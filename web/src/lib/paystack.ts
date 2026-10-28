const PAYSTACK_BASE_URL = "https://api.paystack.co";

function getSecretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  return key;
}

interface InitializeTransactionResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

/**
 * Starts a Paystack transaction. `amount` should be in the currency's main
 * unit (e.g. dollars/naira) — Paystack expects the smallest subunit, so we
 * multiply by 100 here.
 */
export async function initializePaystackTransaction(params: {
  email: string;
  amount: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}) {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: Math.round(params.amount * 100),
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
  });

  const json = (await response.json()) as InitializeTransactionResponse;
  if (!response.ok || !json.status) {
    throw new Error(json.message || "Failed to initialize payment.");
  }
  return json.data;
}

interface VerifyTransactionResponse {
  status: boolean;
  message: string;
  data: {
    status: "success" | "failed" | "abandoned";
    reference: string;
    amount: number;
    metadata?: Record<string, unknown>;
  };
}

export async function verifyPaystackTransaction(reference: string) {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${getSecretKey()}` },
  });

  const json = (await response.json()) as VerifyTransactionResponse;
  if (!response.ok || !json.status) {
    throw new Error(json.message || "Failed to verify payment.");
  }
  return json.data;
}

/**
 * Reconciles a Paystack transaction directly against Paystack's verification API.
 * Updates the treatment to paid, records the official Payment entry in the ledger,
 * and sends an email receipt without requiring any Paystack webhook.
 */
export async function reconcilePaystackPayment(reference: string): Promise<{
  success: boolean;
  status?: string;
  message: string;
  treatmentId?: number;
  amount?: number;
}> {
  if (!reference) {
    return { success: false, message: "Missing reference." };
  }

  // Import dynamically to avoid circular dependencies
  const { prisma } = await import("@/lib/prisma");
  const { sendPaymentReceiptEmail } = await import("@/lib/email");

  // 1. Verify directly with Paystack API
  let verification;
  try {
    verification = await verifyPaystackTransaction(reference);
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Paystack verification request failed.",
    };
  }

  if (verification.status !== "success") {
    return {
      success: false,
      status: verification.status,
      message: `Transaction on Paystack is ${verification.status}. Payment was not completed.`,
    };
  }

  // 2. Locate treatment in database
  const treatment = await prisma.treatment.findUnique({
    where: { paystackRef: reference },
    include: {
      service: true,
      appointment: {
        include: {
          patient: { include: { person: true } },
          treatments: true,
        },
      },
    },
  });

  if (!treatment) {
    return {
      success: false,
      message: `Payment verified on Paystack, but no clinic treatment matches reference ${reference}.`,
    };
  }

  // If already paid and payment record exists, return success immediately
  if (treatment.paid) {
    const existingPayment = await prisma.payment.findFirst({
      where: { reference },
    });
    if (existingPayment) {
      return {
        success: true,
        message: "Payment was already verified and recorded.",
        treatmentId: treatment.treatmentId,
        amount: treatment.charge,
      };
    }
  }

  // Optional staffPersonId can be passed, or defaults to patient's personId
  const recordedById = treatment.appointment.patient.person.personId;

  // 3. Mark paid and create ledger entry in a single transaction
  await prisma.$transaction(async (tx) => {
    await tx.treatment.update({
      where: { treatmentId: treatment.treatmentId },
      data: { paid: true },
    });

    // Check if duplicate payment entry exists for this reference
    const dup = await tx.payment.findFirst({
      where: { reference },
    });

    if (!dup) {
      await tx.payment.create({
        data: {
          patientId: treatment.appointment.pId,
          appointmentId: treatment.appointment.appointmentId,
          treatmentId: treatment.treatmentId,
          amount: treatment.charge,
          method: "online",
          type: "payment",
          reference,
          notes: `Paystack online payment verified directly (Ref: ${reference})`,
          recordedById,
        },
      });
    }
  });

  // 4. Send official receipt email
  const patientEmail = treatment.appointment.patient.person.email;
  if (patientEmail) {
    const serviceName = treatment.service?.name || treatment.action || "Dental Treatment";
    await sendPaymentReceiptEmail({
      to: patientEmail,
      patientName: treatment.appointment.patient.person.firstName,
      amount: treatment.charge,
      serviceName,
    }).catch((err) => console.error("[email] receipt failed:", err));
  }

  return {
    success: true,
    message: "Payment successfully verified and recorded!",
    treatmentId: treatment.treatmentId,
    amount: treatment.charge,
  };
}

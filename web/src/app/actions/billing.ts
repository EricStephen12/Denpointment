"use server"

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, hasCapability } from "@/lib/auth";
import { initializePaystackTransaction } from "@/lib/paystack";

async function requireBillingAccess() {
  const person = await getCurrentPerson();
  if (!hasCapability(person, "frontDesk")) {
    throw new Error("You're not authorized to manage billing.");
  }
}

export async function markTreatmentPaid(formData: FormData) {
  await requireBillingAccess();

  const treatmentId = parseInt(formData.get("treatmentId") as string, 10);
  const paid = formData.get("paid") === "true";

  await prisma.treatment.update({ where: { treatmentId }, data: { paid: !paid } });

  revalidatePath("/dashboard/admin/billing");
}

/**
 * Starts a Paystack checkout for a patient to pay their own unpaid
 * treatment balance online.
 */
export async function initiateTreatmentPayment(formData: FormData) {
  const person = await getCurrentPerson();
  if (!person) throw new Error("Not authenticated");

  const treatmentId = parseInt(formData.get("treatmentId") as string, 10);
  if (!treatmentId) throw new Error("Missing treatment.");

  const treatment = await prisma.treatment.findUnique({
    where: { treatmentId },
    include: { appointment: true },
  });
  if (!treatment) throw new Error("Treatment not found.");

  const isOwner = person.patients.some((p) => p.patientId === treatment.appointment.pId);
  if (!isOwner) throw new Error("You can only pay for your own treatments.");
  if (treatment.paid) throw new Error("This treatment has already been paid for.");

  const reference = `treatment-${treatmentId}-${Date.now()}`;
  const host = (await headers()).get("host");
  const protocol = host?.includes("localhost") ? "http" : "https";
  const callbackUrl = `${protocol}://${host}/dashboard/payment/callback`;

  const { authorization_url } = await initializePaystackTransaction({
    email: person.email,
    amount: treatment.charge,
    reference,
    callbackUrl,
    metadata: { treatmentId },
  });

  await prisma.treatment.update({ where: { treatmentId }, data: { paystackRef: reference } });

  redirect(authorization_url);
}

// ─── Phase 4: Full payment recording ─────────────────────────────────────────

async function requireBillingStaff() {
  const person = await getCurrentPerson();
  if (!person || !hasCapability(person, "frontDesk")) {
    throw new Error("Not authorized for billing.");
  }
  return person;
}

/** Record a cash / card / transfer / insurance payment against an appointment */
export async function recordPayment(formData: FormData) {
  const person = await requireBillingStaff();

  const appointmentId = parseInt(formData.get("appointmentId") as string, 10);
  const amount        = parseInt(formData.get("amount") as string, 10);
  const method        = (formData.get("method") as string) || "cash";
  const reference     = ((formData.get("reference") as string) || "").trim().slice(0, 100);
  const notes         = ((formData.get("notes") as string) || "").trim().slice(0, 300);

  if (!appointmentId || !amount || amount <= 0) throw new Error("Valid appointment and amount required.");

  const appt = await prisma.appointment.findUnique({
    where: { appointmentId },
    include: {
      treatments: { include: { service: true } },
      patient: { include: { person: true } },
    },
  });
  if (!appt) throw new Error("Appointment not found.");

  const VALID_METHODS = ["cash","card","bank_transfer","insurance","online"];
  if (!VALID_METHODS.includes(method)) throw new Error("Invalid payment method.");

  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        patientId: appt.pId,
        appointmentId,
        amount,
        method: method as any,
        type: "payment",
        reference: reference || null,
        notes: notes || null,
        recordedById: person.personId,
      },
    });

    // Mark treatments as paid when total payments cover total charge
    const totalCharge = appt.treatments.reduce((s, t) => s + t.charge, 0);
    const existingPayments = await tx.payment.aggregate({
      where: { appointmentId, type: "payment" },
      _sum: { amount: true },
    });
    const totalPaid = (existingPayments._sum.amount ?? 0) + amount;
    if (totalPaid >= totalCharge) {
      await tx.treatment.updateMany({
        where: { aId: appointmentId, paid: false },
        data: { paid: true },
      });
    }
  });

  // Automatically dispatch email payment receipt to the patient
  try {
    const patientEmail = appt.patient?.person?.email;
    if (patientEmail) {
      const patientName = `${appt.patient.person.firstName} ${appt.patient.person.lastName}`.trim();
      const serviceName =
        appt.treatments.map((t) => t.service?.name || t.action).filter(Boolean).join(", ") ||
        "Dental Treatment";
      const { sendPaymentReceiptEmail } = await import("@/lib/email");
      await sendPaymentReceiptEmail({
        to: patientEmail,
        patientName,
        amount,
        serviceName,
      });
    }
  } catch (emailErr) {
    console.error("Failed to send payment receipt email:", emailErr);
    // Non-blocking: payment is already securely recorded in the database
  }

  revalidatePath("/dashboard/admin/billing");
  revalidatePath("/dashboard/admin/outstanding");
  revalidatePath(`/dashboard/patients/${appt.pId}`);
}

/** Re-send or manually dispatch an official payment receipt email to the patient */
export async function emailReceiptAction(formData: FormData) {
  await requireBillingStaff();
  const appointmentId = parseInt(formData.get("appointmentId") as string, 10);
  if (!appointmentId) throw new Error("Appointment ID is required.");

  const appt = await prisma.appointment.findUnique({
    where: { appointmentId },
    include: {
      treatments: { include: { service: true } },
      patient: { include: { person: true } },
      payments: { where: { type: "payment" } },
    },
  });

  if (!appt) throw new Error("Appointment not found.");
  const patientEmail = appt.patient?.person?.email;
  if (!patientEmail) throw new Error("This patient does not have an email address on file.");

  const totalPaid = appt.payments.reduce((s, p) => s + p.amount, 0);
  const patientName = `${appt.patient.person.firstName} ${appt.patient.person.lastName}`.trim();
  const serviceName =
    appt.treatments.map((t) => t.service?.name || t.action).filter(Boolean).join(", ") ||
    "Dental Treatment";

  const { sendPaymentReceiptEmail } = await import("@/lib/email");
  await sendPaymentReceiptEmail({
    to: patientEmail,
    patientName,
    amount: totalPaid,
    serviceName,
  });

  return { success: true };
}

/** Record a discount or waiver against an appointment */
export async function recordDiscount(formData: FormData) {
  const person = await requireBillingStaff();

  const appointmentId = parseInt(formData.get("appointmentId") as string, 10);
  const amount        = parseInt(formData.get("amount") as string, 10);
  const type          = (formData.get("type") as string) === "waiver" ? "waiver" : "discount";
  const notes         = ((formData.get("notes") as string) || "").trim().slice(0, 300);

  if (!appointmentId || !amount || amount <= 0) throw new Error("Appointment and amount required.");

  const appt = await prisma.appointment.findUnique({ where: { appointmentId } });
  if (!appt) throw new Error("Appointment not found.");

  await prisma.payment.create({
    data: {
      patientId: appt.pId,
      appointmentId,
      amount,
      method: "cash",
      type: type as any,
      notes: notes || null,
      recordedById: person.personId,
    },
  });

  revalidatePath("/dashboard/admin/billing");
  revalidatePath(`/dashboard/patients/${appt.pId}`);
}

/** Record a refund */
export async function recordRefund(formData: FormData) {
  const person = await requireBillingStaff();

  const appointmentId = parseInt(formData.get("appointmentId") as string, 10);
  const amount        = parseInt(formData.get("amount") as string, 10);
  const notes         = ((formData.get("notes") as string) || "").trim().slice(0, 300);

  if (!appointmentId || !amount || amount <= 0) throw new Error("Appointment and amount required.");

  const appt = await prisma.appointment.findUnique({ where: { appointmentId } });
  if (!appt) throw new Error("Appointment not found.");

  await prisma.payment.create({
    data: {
      patientId: appt.pId,
      appointmentId,
      amount,
      method: "cash",
      type: "refund",
      notes: notes || null,
      recordedById: person.personId,
    },
  });

  revalidatePath("/dashboard/admin/billing");
  revalidatePath(`/dashboard/patients/${appt.pId}`);
}

/** Void a payment entry (marks it inactive with a reason, preserves audit trail) */
export async function voidPayment(formData: FormData) {
  const person = await requireBillingStaff();

  const paymentId = parseInt(formData.get("paymentId") as string, 10);
  const reason    = ((formData.get("reason") as string) || "").trim().slice(0, 200);
  if (!paymentId) throw new Error("Payment ID required.");

  const pay = await prisma.payment.findUnique({ where: { paymentId } });
  if (!pay) throw new Error("Payment not found.");

  // Record a counter-entry refund of same amount to neutralise the payment
  await prisma.payment.create({
    data: {
      patientId: pay.patientId,
      appointmentId: pay.appointmentId,
      amount: pay.amount,
      method: pay.method,
      type: "refund",
      notes: `VOID of payment #${paymentId}${reason ? `: ${reason}` : ""}`,
      recordedById: person.personId,
    },
  });

  // Reopen treatments if over-payment was voided
  if (pay.appointmentId) {
    await prisma.treatment.updateMany({
      where: { aId: pay.appointmentId, paid: true },
      data: { paid: false },
    });
  }

  revalidatePath("/dashboard/admin/billing");
  if (pay.patientId) revalidatePath(`/dashboard/patients/${pay.patientId}`);
}

/** Permanently delete a payment entry (reopens treatments and recalculates balance) */
export async function deletePayment(formData: FormData) {
  await requireBillingStaff();

  const paymentId = parseInt(formData.get("paymentId") as string, 10);
  if (!paymentId) throw new Error("Payment ID required.");

  const pay = await prisma.payment.findUnique({
    where: { paymentId },
    include: { appointment: { include: { treatments: true } } },
  });
  if (!pay) throw new Error("Payment not found.");

  await prisma.payment.delete({ where: { paymentId } });

  // If this payment was against an appointment, check if treatments should reopen
  if (pay.appointmentId) {
    const remainingPayments = await prisma.payment.aggregate({
      where: { appointmentId: pay.appointmentId, type: "payment" },
      _sum: { amount: true },
    });
    const totalPaid = remainingPayments._sum.amount ?? 0;
    const totalCharge = pay.appointment?.treatments.reduce((s, t) => s + t.charge, 0) ?? 0;

    if (totalPaid < totalCharge) {
      await prisma.treatment.updateMany({
        where: { aId: pay.appointmentId },
        data: { paid: false },
      });
    }
  }

  revalidatePath("/dashboard/admin/billing");
  revalidatePath("/dashboard/admin/outstanding");
  if (pay.patientId) revalidatePath(`/dashboard/patients/${pay.patientId}`);
}

/** Submit an insurance claim for an appointment */
export async function submitInsuranceClaim(formData: FormData) {
  await requireBillingStaff();

  const appointmentId      = parseInt(formData.get("appointmentId") as string, 10);
  const patientInsuranceId = parseInt(formData.get("patientInsuranceId") as string, 10);
  const claimAmount        = parseInt(formData.get("claimAmount") as string, 10);
  const notes              = ((formData.get("notes") as string) || "").trim().slice(0, 300);

  if (!appointmentId || !patientInsuranceId || !claimAmount || claimAmount <= 0) {
    throw new Error("All fields required.");
  }

  await prisma.insuranceClaim.create({
    data: {
      appointmentId,
      patientInsuranceId,
      claimAmount,
      submittedAt: new Date(),
      status: "submitted",
      notes: notes || null,
    },
  });

  revalidatePath("/dashboard/admin/billing");
}

/** Update insurance claim status */
export async function updateInsuranceClaimStatus(formData: FormData) {
  await requireBillingStaff();

  const claimId = parseInt(formData.get("claimId") as string, 10);
  const status  = formData.get("status") as string;
  const VALID = ["pending","submitted","approved","rejected","paid"];
  if (!claimId || !VALID.includes(status)) throw new Error("Invalid.");

  await prisma.insuranceClaim.update({
    where: { claimId },
    data: {
      status: status as any,
      settledAt: status === "paid" ? new Date() : undefined,
    },
  });

  revalidatePath("/dashboard/admin/billing");
}

/**
 * Permanently deletes an entire billing record (appointment visit),
 * including its treatments, medicines, payments, and insurance claims.
 */
export async function deleteBillingRecord(formData: FormData) {
  await requireBillingStaff();

  const appointmentId = parseInt(formData.get("appointmentId") as string, 10);
  if (!appointmentId) throw new Error("Missing appointment ID.");

  const appt = await prisma.appointment.findUnique({
    where: { appointmentId },
    include: {
      treatments: { select: { treatmentId: true } },
      payments: { select: { paymentId: true } },
      insuranceClaims: { select: { claimId: true } },
    },
  });

  if (!appt) throw new Error("Billing record not found.");

  const treatmentIds = appt.treatments.map((t) => t.treatmentId);

  await prisma.$transaction(async (tx) => {
    // 1. Delete insurance claims
    if (appt.insuranceClaims.length > 0) {
      await tx.insuranceClaim.deleteMany({ where: { appointmentId } });
    }

    // 2. Delete payments attached to this appointment or its treatments
    await tx.payment.deleteMany({
      where: {
        OR: [
          { appointmentId },
          ...(treatmentIds.length > 0 ? [{ treatmentId: { in: treatmentIds } }] : []),
        ],
      },
    });

    // 3. Delete medicines attached to treatments
    if (treatmentIds.length > 0) {
      await tx.medicine.deleteMany({
        where: { tId: { in: treatmentIds } },
      });

      // 4. Detach tooth findings from treatments (keep tooth finding history, unlink treatment)
      await tx.toothFinding.updateMany({
        where: { treatmentId: { in: treatmentIds } },
        data: { treatmentId: null },
      });

      // 5. Delete treatments
      await tx.treatment.deleteMany({
        where: { aId: appointmentId },
      });
    }

    // 6. Delete appointment
    await tx.appointment.delete({
      where: { appointmentId },
    });
  });

  revalidatePath("/dashboard/admin/billing");
  revalidatePath("/dashboard/admin/outstanding");
  revalidatePath("/dashboard/admin/reports");
  revalidatePath("/dashboard/treatments/today");
  revalidatePath("/dashboard/treatments/upcoming");
  revalidatePath("/dashboard/treatments/past");
  revalidatePath("/dashboard/reception/calendar");
  revalidatePath("/dashboard/reception/checkin");
  revalidatePath(`/dashboard/patients/${appt.pId}`);
  revalidatePath("/dashboard");
}

/**
 * Admin / receptionist: write off the full outstanding balance for a patient
 * by creating a waiver payment record that covers the remaining debt.
 * Clinical records (treatments, appointments) are preserved — only the debt is cleared.
 */
export async function writeOffPatientBalance(formData: FormData) {
  const person = await requireBillingStaff();

  const patientId = parseInt(formData.get("patientId") as string, 10);
  if (!patientId) throw new Error("Missing patient ID.");

  // Recalculate outstanding in real time to avoid stale data
  const patient = await prisma.patient.findUnique({
    where: { patientId },
    include: {
      appointments: {
        include: { treatments: true, payments: true },
      },
    },
  });
  if (!patient) throw new Error("Patient not found.");

  // Collect all unpaid appointments
  type UnpaidAppt = { appointmentId: number; remaining: number };
  const unpaid: UnpaidAppt[] = [];
  for (const appt of patient.appointments) {
    const charge = appt.treatments.reduce((s, t) => s + t.charge, 0);
    const paid   = appt.payments.filter((p) => p.type === "payment").reduce((s, p) => s + p.amount, 0);
    const disc   = appt.payments.filter((p) => p.type === "discount" || p.type === "waiver").reduce((s, p) => s + p.amount, 0);
    const remaining = charge - paid - disc;
    if (remaining > 0) unpaid.push({ appointmentId: appt.appointmentId, remaining });
  }

  if (unpaid.length === 0) throw new Error("This patient has no outstanding balance.");

  // Create a waiver record for each appointment that still has a balance
  await prisma.$transaction(
    unpaid.map(({ appointmentId, remaining }) =>
      prisma.payment.create({
        data: {
          patientId,
          appointmentId,
          amount: remaining,
          method: "cash",
          type: "waiver",
          notes: `Management write-off by ${person.firstName} ${person.lastName}`,
          recordedById: person.personId,
        },
      }),
    ),
  );

  revalidatePath("/dashboard/admin/outstanding");
  revalidatePath("/dashboard/admin/billing");
  revalidatePath(`/dashboard/patients/${patientId}`);
  redirect("/dashboard/admin/outstanding");
}

/**
 * Patient deletes their own past or cancelled appointment record from their view.
 * Only allowed for appointments that are no longer upcoming (past date or cancelled).
 * Wipes the appointment + its treatments, medicines, and payments permanently.
 */
export async function deletePatientOwnAppointment(formData: FormData) {
  const person = await getCurrentPerson();
  if (!person) throw new Error("Not authenticated.");

  if (person.patients.length === 0) throw new Error("Not a patient.");
  const patientId = person.patients[0].patientId;

  const appointmentId = parseInt(formData.get("appointmentId") as string, 10);
  if (!appointmentId) throw new Error("Missing appointment ID.");

  const appt = await prisma.appointment.findUnique({
    where: { appointmentId },
    include: {
      treatments: { select: { treatmentId: true } },
      payments:   { select: { paymentId: true } },
      insuranceClaims: { select: { claimId: true } },
    },
  });

  if (!appt) throw new Error("Appointment not found.");
  if (appt.pId !== patientId) throw new Error("You can only delete your own records.");

  // Patients may not delete future / active appointments — they must cancel instead
  const { isAppointmentUpcoming } = await import("@/lib/clinic-date");
  const now = new Date();
  if (appt.status !== "cancelled" && isAppointmentUpcoming(appt, now)) {
    throw new Error("You cannot delete an upcoming appointment. Please cancel it first.");
  }

  const treatmentIds = appt.treatments.map((t) => t.treatmentId);

  await prisma.$transaction(async (tx) => {
    if (appt.insuranceClaims.length > 0) {
      await tx.insuranceClaim.deleteMany({ where: { appointmentId } });
    }
    await tx.payment.deleteMany({
      where: {
        OR: [
          { appointmentId },
          ...(treatmentIds.length > 0 ? [{ treatmentId: { in: treatmentIds } }] : []),
        ],
      },
    });
    if (treatmentIds.length > 0) {
      await tx.medicine.deleteMany({ where: { tId: { in: treatmentIds } } });
      await tx.toothFinding.updateMany({
        where: { treatmentId: { in: treatmentIds } },
        data: { treatmentId: null },
      });
      await tx.treatment.deleteMany({ where: { aId: appointmentId } });
    }
    await tx.appointment.delete({ where: { appointmentId } });
  });

  revalidatePath("/dashboard/appointments");
  redirect("/dashboard/appointments");
}

/**
 * Permanently removes an individual treatment procedure item from a visit bill.
 */
export async function deleteTreatmentProcedure(formData: FormData) {
  await requireBillingStaff();
  const treatmentId = parseInt(formData.get("treatmentId") as string, 10);
  if (!treatmentId) throw new Error("Missing treatment ID.");

  const treatment = await prisma.treatment.findUnique({
    where: { treatmentId },
    include: { appointment: true },
  });

  if (!treatment) throw new Error("Treatment not found.");

  await prisma.$transaction(async (tx) => {
    // Delete payments tied directly to this treatment
    await tx.payment.deleteMany({ where: { treatmentId } });
    // Delete medicines
    await tx.medicine.deleteMany({ where: { tId: treatmentId } });
    // Detach tooth findings
    await tx.toothFinding.updateMany({
      where: { treatmentId },
      data: { treatmentId: null },
    });
    // Delete the treatment
    await tx.treatment.delete({ where: { treatmentId } });
  });

  revalidatePath("/dashboard/admin/billing");
  revalidatePath("/dashboard/admin/outstanding");
  revalidatePath("/dashboard/treatments/today");
  revalidatePath("/dashboard/treatments/past");
  if (treatment.appointment) {
    revalidatePath(`/dashboard/patients/${treatment.appointment.pId}`);
  }
}

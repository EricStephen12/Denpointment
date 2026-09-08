import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPaymentReceiptEmail } from "@/lib/email";
import {
  forwardPaystackWebhookToStore,
  paystackReferenceTarget,
} from "@/lib/paystack-webhook-hub";

interface PaystackChargeSuccessEvent {
  event: string;
  data: {
    reference: string;
    amount: number;
  };
}

function isValidSignature(rawBody: string, signature: string | null, secretKey: string) {
  if (!signature) return false;
  const expected = createHmac("sha512", secretKey).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  const signatureBuf = Buffer.from(signature, "utf8");
  if (expectedBuf.length !== signatureBuf.length) return false;
  return timingSafeEqual(expectedBuf, signatureBuf);
}

async function markClinicTreatmentPaid(reference: string) {
  const treatment = await prisma.treatment.findUnique({
    where: { paystackRef: reference },
    include: {
      service: true,
      appointment: { include: { patient: { include: { person: true } } } },
    },
  });

  if (!treatment || treatment.paid) return;

  await prisma.treatment.update({
    where: { treatmentId: treatment.treatmentId },
    data: { paid: true },
  });

  await sendPaymentReceiptEmail({
    to: treatment.appointment.patient.person.email,
    patientName: treatment.appointment.patient.person.firstName,
    amount: treatment.charge,
    serviceName: treatment.service?.name || treatment.action,
  }).catch((err) => console.error("[email] receipt failed:", err));
}

export async function POST(request: NextRequest) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Paystack not configured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!isValidSignature(rawBody, signature, secretKey)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: PaystackChargeSuccessEvent;
  try {
    event = JSON.parse(rawBody) as PaystackChargeSuccessEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.event === "charge.success") {
    const reference = event.data?.reference;
    const target = paystackReferenceTarget(reference);

    if (target === "store") {
      try {
        const forwarded = await forwardPaystackWebhookToStore(rawBody, signature!);
        if (!forwarded.ok) {
          const detail = await forwarded.text().catch(() => "");
          console.error(
            "[paystack-hub] store forward failed:",
            forwarded.status,
            detail.slice(0, 300),
          );
          // Tell Paystack to retry — store client verify still covers most cases.
          return NextResponse.json({ error: "Store webhook failed" }, { status: 502 });
        }
        return NextResponse.json({ received: true, routed: "store" });
      } catch (err) {
        console.error("[paystack-hub] store forward error:", err);
        return NextResponse.json({ error: "Store webhook not configured" }, { status: 502 });
      }
    }

    if (target === "clinic" && reference) {
      await markClinicTreatmentPaid(reference);
      return NextResponse.json({ received: true, routed: "clinic" });
    }

    // Unknown reference shape — ignore safely (other apps / test events).
    console.warn("[paystack-hub] unhandled reference:", reference);
  }

  return NextResponse.json({ received: true });
}

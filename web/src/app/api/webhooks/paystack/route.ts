import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPaymentReceiptEmail } from "@/lib/email";
import { notifyN8n } from "@/lib/n8n";

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

  const event = JSON.parse(rawBody) as PaystackChargeSuccessEvent;

  if (event.event === "charge.success") {
    const treatment = await prisma.treatment.findUnique({
      where: { paystackRef: event.data.reference },
      include: {
        service: true,
        appointment: { include: { patient: { include: { person: true } } } },
      },
    });

    if (treatment && !treatment.paid) {
      await prisma.treatment.update({ where: { treatmentId: treatment.treatmentId }, data: { paid: true } });

      await sendPaymentReceiptEmail({
        to: treatment.appointment.patient.person.email,
        patientName: treatment.appointment.patient.person.firstName,
        amount: treatment.charge,
        serviceName: treatment.service?.name || treatment.action,
      }).catch((err) => console.error("[email] receipt failed:", err));

      notifyN8n("payment", {
        patientName: `${treatment.appointment.patient.person.firstName} ${treatment.appointment.patient.person.lastName}`,
        patientEmail: treatment.appointment.patient.person.email,
        amount: treatment.charge,
        serviceName: treatment.service?.name || treatment.action,
        reference: event.data.reference,
      }).catch(() => undefined);
    }
  }

  return NextResponse.json({ received: true });
}

import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { sendPaymentReceiptEmail } from "@/lib/email";
import { notifyN8n } from "@/lib/n8n";

export default async function PaymentCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  const { reference } = await searchParams;

  if (!reference) {
    return (
      <div className="text-center py-16">
        <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h1 className="text-xl font-display text-ink-950 mb-2">Missing payment reference</h1>
        <Link href="/dashboard/appointments" className="text-turq-600 hover:text-turq-700 font-medium text-sm">
          Back to Appointments
        </Link>
      </div>
    );
  }

  let success = false;
  let errorMessage = "";

  try {
    const result = await verifyPaystackTransaction(reference);
    success = result.status === "success";

    if (success) {
      const treatment = await prisma.treatment.findUnique({
        where: { paystackRef: reference },
        include: {
          service: true,
          appointment: { include: { patient: { include: { person: true } } } },
        },
      });

      // The webhook is the source of truth, but we confirm here too so the
      // patient gets instant feedback even if the webhook hasn't landed yet.
      if (treatment && !treatment.paid) {
        await prisma.treatment.update({ where: { treatmentId: treatment.treatmentId }, data: { paid: true } });
        const serviceName = treatment.service?.name || treatment.action;
        await sendPaymentReceiptEmail({
          to: treatment.appointment.patient.person.email,
          patientName: treatment.appointment.patient.person.firstName,
          amount: treatment.charge,
          serviceName,
        }).catch((err) => console.error("[email] receipt failed:", err));

        notifyN8n("payment", {
          patientName: `${treatment.appointment.patient.person.firstName} ${treatment.appointment.patient.person.lastName}`,
          patientEmail: treatment.appointment.patient.person.email,
          amount: treatment.charge,
          serviceName,
          reference,
        }).catch(() => undefined);
      }
    }
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Could not verify payment.";
  }

  return (
    <div className="text-center py-16">
      {success ? (
        <>
          <CheckCircle2 className="h-12 w-12 text-turq-600 mx-auto mb-4" />
          <h1 className="text-xl font-display text-ink-950 mb-2">Payment successful</h1>
          <p className="text-ink-950/60 mb-6">Thank you — your payment has been recorded.</p>
        </>
      ) : (
        <>
          <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-display text-ink-950 mb-2">Payment not completed</h1>
          <p className="text-ink-950/60 mb-6">{errorMessage || "The payment could not be verified. If you were charged, please contact the clinic."}</p>
        </>
      )}
      <Link href="/dashboard/appointments" className="text-turq-600 hover:text-turq-700 font-medium text-sm">
        Back to Appointments
      </Link>
    </div>
  );
}

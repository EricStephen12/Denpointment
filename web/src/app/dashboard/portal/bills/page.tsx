import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isPatient } from "@/lib/auth";
import { formatNaira } from "@/lib/currency";
import { formatAppointmentDate } from "@/lib/clinic-date";
import { initiateTreatmentPayment } from "@/app/actions/billing";
import { CreditCard, CheckCircle2, Receipt, ArrowRight } from "lucide-react";

export default async function MyBillsPage() {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isPatient(dbUser)) redirect("/dashboard");

  const patientId = dbUser.patients[0].patientId;

  const appointments = await prisma.appointment.findMany({
    where: { pId: patientId },
    include: {
      dentist: { include: { person: true } },
      treatments: true,
      payments: { orderBy: { createdAt: "asc" } },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }, { day: "desc" }],
  });

  // Only visits that have treatments
  const visits = appointments.filter((a) => a.treatments.length > 0);

  const totalCharge  = visits.flatMap((a) => a.treatments).reduce((s, t) => s + t.charge, 0);
  const totalPaid    = visits.flatMap((a) => a.payments).filter((p) => p.type === "payment").reduce((s, p) => s + p.amount, 0);
  const totalDisc    = visits.flatMap((a) => a.payments).filter((p) => p.type === "discount" || p.type === "waiver").reduce((s, p) => s + p.amount, 0);
  const totalBalance = Math.max(totalCharge - totalPaid - totalDisc, 0);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <p className="text-xs font-medium text-turq-400 uppercase tracking-widest mb-3">My Account</p>
        <h1 className="text-3xl font-display text-sand-50">Bills & Payments</h1>
        <p className="mt-2 text-sm text-sand-50/50">Your treatment charges and payment history.</p>
      </div>

      {/* Balance banner */}
      {totalBalance > 0 && (
        <div className="dash-surface border border-red-500/20 bg-red-900/10 p-5 mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-red-400/70 mb-1">Outstanding Balance</p>
            <p className="text-2xl font-display text-red-400">{formatNaira(totalBalance)}</p>
          </div>
          <p className="text-xs text-sand-50/40 max-w-xs">Pay individual charges below using card or bank transfer via Paystack.</p>
        </div>
      )}

      {totalBalance === 0 && totalCharge > 0 && (
        <div className="dash-surface border border-turq-500/20 bg-turq-600/5 p-4 mb-6 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-turq-400 shrink-0" />
          <p className="text-sm text-turq-400">All bills settled. Thank you!</p>
        </div>
      )}

      {visits.length === 0 ? (
        <div className="dash-surface p-10 text-center">
          <CreditCard className="h-10 w-10 text-sand-50/20 mx-auto mb-3" />
          <p className="text-sand-50/40 text-sm">No treatments recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visits.map((appt) => {
            const charge     = appt.treatments.reduce((s, t) => s + t.charge, 0);
            const paid       = appt.payments.filter((p) => p.type === "payment").reduce((s, p) => s + p.amount, 0);
            const disc       = appt.payments.filter((p) => p.type === "discount" || p.type === "waiver").reduce((s, p) => s + p.amount, 0);
            const balance    = Math.max(charge - paid - disc, 0);
            const isSettled  = balance === 0;

            return (
              <div key={appt.appointmentId} className={`dash-surface overflow-hidden ${isSettled ? "opacity-70" : ""}`}>
                <div className="p-5 flex items-center justify-between gap-3 border-b border-sand-50/8">
                  <div>
                    <p className="font-semibold text-sand-50 text-sm">
                      {formatAppointmentDate({ year: appt.year, month: appt.month, day: appt.day })}
                    </p>
                    <p className="text-xs text-sand-50/40 mt-0.5">
                      Dr. {appt.dentist.person.firstName} {appt.dentist.person.lastName}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {isSettled ? (
                      <span className="inline-flex items-center gap-1 text-xs text-turq-400">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Paid
                      </span>
                    ) : (
                      <span className="text-sm font-display text-red-400">{formatNaira(balance)} due</span>
                    )}
                    <Link
                      href={`/dashboard/print/invoice/${appt.appointmentId}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs text-sand-50/30 hover:text-turq-400 transition-colors"
                    >
                      <Receipt className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                <ul className="divide-y divide-sand-50/8">
                  {appt.treatments.map((t) => (
                    <li key={t.treatmentId} className="px-5 py-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-sand-50/80">{t.action}</p>
                        {t.complaint && <p className="text-xs text-sand-50/35">{t.complaint}</p>}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-medium text-sand-50">{formatNaira(t.charge)}</span>
                        {!t.paid ? (
                          <form action={initiateTreatmentPayment}>
                            <input type="hidden" name="treatmentId" value={t.treatmentId} />
                            <button
                              type="submit"
                              className="inline-flex items-center gap-1 text-xs bg-turq-600 hover:bg-turq-500 text-ink-950 px-3 py-1.5 rounded-full font-semibold transition-colors"
                            >
                              <CreditCard className="h-3 w-3" /> Pay
                            </button>
                          </form>
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-turq-400/60" />
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                {appt.payments.length > 0 && (
                  <div className="px-5 py-3 bg-sand-50/[0.02] space-y-1">
                    {appt.payments.map((p) => (
                      <div key={p.paymentId} className="flex justify-between text-xs text-sand-50/35">
                        <span className="capitalize">{p.type} · {p.method.replace("_"," ")}</span>
                        <span>{p.type === "refund" ? "-" : "+"}{formatNaira(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

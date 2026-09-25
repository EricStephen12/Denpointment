import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isAdmin, isReceptionist } from "@/lib/auth";
import { recordPayment, recordDiscount, recordRefund } from "@/app/actions/billing";
import { formatNaira } from "@/lib/currency";
import { formatAppointmentDate } from "@/lib/clinic-date";
import { Receipt } from "lucide-react";
import PaymentPanel from "@/components/billing/PaymentPanel";
import PaymentHistoryItem from "@/components/billing/PaymentHistoryItem";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>;
}) {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isAdmin(dbUser) && !isReceptionist(dbUser)) redirect("/dashboard");

  const { filter, q } = await searchParams;
  const showAll = filter === "all";
  const query = (q || "").trim();

  // Appointments with treatments
  const appointments = await prisma.appointment.findMany({
    where: {
      treatments: showAll ? undefined : { some: { paid: false } },
      ...(query ? {
        patient: {
          person: {
            OR: [
              { firstName: { contains: query, mode: "insensitive" } },
              { lastName:  { contains: query, mode: "insensitive" } },
            ],
          },
        },
      } : {}),
    },
    include: {
      patient: { include: { person: true, insurancePolicies: { where: { active: true } } } },
      dentist: { include: { person: true } },
      treatments: { include: { medicines: true } },      payments: { orderBy: { createdAt: "desc" } },
      insuranceClaims: true,
    },
    orderBy: [{ year: "desc" }, { month: "desc" }, { day: "desc" }],
    take: 100,
  });

  // Global stats (all time)
  const [allTreatments, allPayments] = await Promise.all([
    prisma.treatment.aggregate({ _sum: { charge: true } }),
    prisma.payment.aggregate({
      where: { type: "payment" },
      _sum: { amount: true },
    }),
  ]);

  const totalBilled      = allTreatments._sum.charge ?? 0;
  const totalCollected   = allPayments._sum.amount ?? 0;
  const totalOutstanding = Math.max(totalBilled - totalCollected, 0);

  const unpaidApptCount = appointments.filter((a) => {
    const charge = a.treatments.reduce((s, t) => s + t.charge, 0);
    const paid   = a.payments.filter((p) => p.type === "payment").reduce((s, p) => s + p.amount, 0);
    const disc   = a.payments.filter((p) => p.type === "discount" || p.type === "waiver").reduce((s, p) => s + p.amount, 0);
    return (charge - paid - disc) > 0;
  }).length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="dash-icon-badge">
            <Receipt className="h-5 w-5 text-turq-400" />
          </div>
          <div>
            <h1 className="dash-title font-display">Billing & Payments</h1>
            <p className="dash-body mt-0.5">Record payments, discounts, and insurance claims.</p>
          </div>
        </div>
        <Link
          href="/dashboard/admin/outstanding"
          className="text-xs border border-sand-50/15 hover:border-turq-400/30 text-sand-50/50 hover:text-turq-400 px-4 py-2 rounded-lg transition-colors"
        >
          Outstanding Balances →
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Total Billed",      value: formatNaira(totalBilled),      color: "text-sand-50" },
          { label: "Collected",         value: formatNaira(totalCollected),    color: "text-turq-400" },
          { label: "Outstanding",       value: formatNaira(totalOutstanding),  color: "text-red-400" },
          { label: "Unpaid Visits",     value: unpaidApptCount.toString(),     color: "text-amber-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="dash-surface p-4">
            <p className={`text-2xl font-display ${color}`}>{value}</p>
            <p className="text-[10px] uppercase tracking-wider text-sand-50/35 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <form method="get" className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Search patient name…"
          className="dash-input flex-1 min-w-[200px]"
        />
        <div className="flex gap-2">
          <Link
            href="/dashboard/admin/billing"
            className={`text-xs px-3 py-2 rounded-lg border transition-colors ${!showAll ? "bg-turq-600 text-ink-950 border-turq-600" : "border-sand-50/15 text-sand-50/50 hover:border-turq-400/30 hover:text-turq-400"}`}
          >
            Unpaid Only
          </Link>
          <Link
            href="/dashboard/admin/billing?filter=all"
            className={`text-xs px-3 py-2 rounded-lg border transition-colors ${showAll ? "bg-turq-600 text-ink-950 border-turq-600" : "border-sand-50/15 text-sand-50/50 hover:border-turq-400/30 hover:text-turq-400"}`}
          >
            All Visits
          </Link>
        </div>
        <button type="submit" className="bg-turq-600 text-ink-950 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-turq-500 transition-colors">
          Search
        </button>
      </form>

      {/* Appointment list */}
      {appointments.length === 0 ? (
        <div className="text-center py-16 text-sand-50/30 border border-dashed border-sand-50/10 rounded-2xl">
          {showAll ? "No appointments found." : "No unpaid visits — all settled!"}
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => {
            const charge = appt.treatments.reduce((s, t) => s + t.charge, 0);
            const paid   = appt.payments.filter((p) => p.type === "payment").reduce((s, p) => s + p.amount, 0);
            const disc   = appt.payments.filter((p) => p.type === "discount" || p.type === "waiver").reduce((s, p) => s + p.amount, 0);
            const outstanding = Math.max(charge - paid - disc, 0);
            const isSettled   = outstanding === 0 && charge > 0;

            return (
              <div key={appt.appointmentId} className={`dash-surface overflow-hidden ${isSettled ? "opacity-70" : ""}`}>
                {/* Appointment header */}
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sand-50/8">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/dashboard/patients/${appt.patient.patientId}`}
                        className="font-semibold text-sand-50 hover:text-turq-400 transition-colors"
                      >
                        {appt.patient.person.firstName} {appt.patient.person.lastName}
                      </Link>
                      {isSettled ? (
                        <span className="text-[11px] bg-turq-600/20 text-turq-400 border border-turq-500/20 px-2 py-0.5 rounded-full font-medium">Settled</span>
                      ) : (
                        <span className="text-[11px] bg-red-900/30 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-medium">{formatNaira(outstanding)} due</span>
                      )}
                    </div>
                    <p className="text-xs text-sand-50/45 mt-0.5">
                      {formatAppointmentDate({ year: appt.year, month: appt.month, day: appt.day })} · {appt.hour}:00 ·
                      Dr. {appt.dentist.person.lastName}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-sand-50/40 shrink-0">
                    <span>Billed: <span className="text-sand-50/70">{formatNaira(charge)}</span></span>
                    <span>Paid: <span className="text-turq-400">{formatNaira(paid)}</span></span>
                    {disc > 0 && <span>Disc: <span className="text-amber-400">{formatNaira(disc)}</span></span>}
                  </div>
                </div>

                {/* Treatments */}
                {appt.treatments.length > 0 && (
                  <div className="px-5 py-3 border-b border-sand-50/8">
                    <div className="space-y-1">
                      {appt.treatments.map((t) => (
                        <div key={t.treatmentId} className="flex items-center justify-between text-xs text-sand-50/60">
                          <span>
                            {t.toothNumber ? <span className="text-turq-300 mr-1">#{t.toothNumber}</span> : null}
                            {t.action}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-sand-50/80">{formatNaira(t.charge)}</span>
                            {t.paid ? (
                              <span className="text-turq-400 text-[10px]">paid</span>
                            ) : (
                              <span className="text-amber-400 text-[10px]">unpaid</span>
                            )}
                            {t.medicines.length > 0 && (
                              <Link
                                href={`/dashboard/print/prescription/${t.treatmentId}`}
                                target="_blank"
                                className="text-turq-400/60 hover:text-turq-400 transition-colors text-[10px] underline"
                              >
                                Rx
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment history */}
                {appt.payments.length > 0 && (() => {
                  const voidedPaymentIds = new Set(
                    appt.payments
                      .filter((p) => p.notes?.startsWith("VOID of payment #"))
                      .map((p) => {
                        const match = p.notes?.match(/VOID of payment #(\d+)/);
                        return match ? parseInt(match[1], 10) : null;
                      })
                      .filter((id): id is number => id !== null)
                  );
                  return (
                    <div className="px-5 py-3 border-b border-sand-50/8 space-y-1">
                      {appt.payments.map((p) => (
                        <PaymentHistoryItem
                          key={p.paymentId}
                          payment={p}
                          isVoided={voidedPaymentIds.has(p.paymentId)}
                        />
                      ))}
                    </div>
                  );
                })()}

                {/* Payment panel */}
                {!isSettled && charge > 0 && (
                  <PaymentPanel
                    appointmentId={appt.appointmentId}
                    outstanding={outstanding}
                    insurance={appt.patient.insurancePolicies.map((i) => ({
                      insuranceId: i.insuranceId,
                      provider: i.provider,
                      policyNumber: i.policyNumber,
                    }))}
                    recordPaymentAction={recordPayment}
                    recordDiscountAction={recordDiscount}
                    recordRefundAction={recordRefund}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

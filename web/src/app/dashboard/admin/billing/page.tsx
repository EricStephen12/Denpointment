import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isAdmin, isReceptionist } from "@/lib/auth";
import { recordPayment, recordDiscount, recordRefund } from "@/app/actions/billing";
import { formatNaira } from "@/lib/currency";
import { formatAppointmentDate, getClinicDay } from "@/lib/clinic-date";
import PaymentPanel from "@/components/billing/PaymentPanel";
import PaymentHistoryItem from "@/components/billing/PaymentHistoryItem";
import DeleteBillingRecordButton from "@/components/billing/DeleteBillingRecordButton";
import DeleteTreatmentProcedureButton from "@/components/billing/DeleteTreatmentProcedureButton";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ClinicWorkflowTracker from "@/components/dashboard/ClinicWorkflowTracker";
import EmailReceiptButton from "@/components/billing/EmailReceiptButton";
import { Printer, RefreshCw, ArrowRight, CheckCircle2 } from "lucide-react";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>;
}) {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isAdmin(dbUser) && !isReceptionist(dbUser)) redirect("/dashboard");

  const today = getClinicDay();
  const { filter, q } = await searchParams;
  const showAll = filter === "all";
  const showToday = filter === "today";
  const query = (q || "").trim();

  // Appointments with treatments
  const appointments = await prisma.appointment.findMany({
    where: {
      ...(showToday
        ? { year: today.year, month: today.month, day: today.day }
        : showAll
        ? undefined
        : { treatments: { some: { paid: false } } }),
      ...(query
        ? {
            patient: {
              person: {
                OR: [
                  { firstName: { contains: query, mode: "insensitive" } },
                  { lastName: { contains: query, mode: "insensitive" } },
                ],
              },
            },
          }
        : {}),
    },
    include: {
      patient: { include: { person: true, insurancePolicies: { where: { active: true } } } },
      dentist: { include: { person: true } },
      treatments: { include: { medicines: true } },
      payments: { orderBy: { createdAt: "desc" } },
      insuranceClaims: true,
    },
    orderBy: [{ year: "desc" }, { month: "desc" }, { day: "desc" }, { hour: "desc" }],
    take: 100,
  });

  // Global stats (all time)
  const [allTreatments, allPayments, todayCompletedCount] = await Promise.all([
    prisma.treatment.aggregate({ _sum: { charge: true } }),
    prisma.payment.aggregate({
      where: { type: "payment" },
      _sum: { amount: true },
    }),
    prisma.appointment.count({
      where: { year: today.year, month: today.month, day: today.day, status: "completed" },
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
    <div className="space-y-6">
      {/* ── 1. WORKFLOW TRACKER BANNER (STEP 4: BILLING & PAYMENTS) ── */}
      <ClinicWorkflowTracker
        currentStep={4}
        counts={{
          needBilling: unpaidApptCount,
        }}
      />

      <AdminPageHeader
        section="Finance"
        title="Billing and Payments"
        description="Review visit charges, record cash/card/transfer payments, and print patient receipts."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/admin/settings#pricing"
              className="inline-flex items-center gap-1.5 rounded-lg border border-sand-50/15 px-3 py-2 text-xs font-medium text-sand-50/70 transition-colors hover:border-turq-400/30 hover:text-turq-400"
            >
              🏷️ Procedure Fee Schedule
            </Link>
            <Link
              href="/dashboard/admin/outstanding"
              className="rounded-lg border border-sand-50/15 px-3 py-2 text-xs font-medium text-sand-50/70 transition-colors hover:border-turq-400/30 hover:text-turq-400"
            >
              Outstanding Balances
            </Link>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Billed",      value: formatNaira(totalBilled),      color: "text-sand-50" },
          { label: "Collected",         value: formatNaira(totalCollected),    color: "text-turq-400" },
          { label: "Outstanding",       value: formatNaira(totalOutstanding),  color: "text-red-400" },
          { label: "Unpaid Visits",     value: unpaidApptCount.toString(),     color: "text-amber-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="dash-surface p-4">
            <p className={`text-2xl font-display font-bold ${color}`}>{value}</p>
            <p className="text-[10px] uppercase tracking-wider text-sand-50/40 mt-1 font-semibold">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters with Today's Checkout Tab */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <form method="get" className="flex flex-1 gap-2">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search patient name…"
            className="dash-input flex-1 min-w-[200px]"
          />
          {filter && <input type="hidden" name="filter" value={filter} />}
          <button
            type="submit"
            className="px-4 py-2 bg-turq-600 hover:bg-turq-500 text-ink-950 font-semibold rounded-xl text-xs transition-colors shrink-0"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-ink-900 border border-sand-50/10 text-xs">
          <Link
            href="/dashboard/admin/billing?filter=today"
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              showToday
                ? "bg-turq-500/20 text-turq-300 border border-turq-500/30"
                : "text-sand-50/60 hover:text-sand-50"
            }`}
          >
            Today's Visits ({todayCompletedCount})
          </Link>
          <Link
            href="/dashboard/admin/billing"
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              !showAll && !showToday
                ? "bg-turq-500/20 text-turq-300 border border-turq-500/30"
                : "text-sand-50/60 hover:text-sand-50"
            }`}
          >
            Unpaid Only
          </Link>
          <Link
            href="/dashboard/admin/billing?filter=all"
            className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
              showAll
                ? "bg-turq-500/20 text-turq-300 border border-turq-500/30"
                : "text-sand-50/60 hover:text-sand-50"
            }`}
          >
            All History
          </Link>
        </div>
      </div>

      {/* Appointment list */}
      {appointments.length === 0 ? (
        <div className="text-center py-16 text-sand-50/40 border border-dashed border-sand-50/10 rounded-2xl">
          <p className="font-semibold text-sand-50 mb-1">No appointment bills match the selected filter.</p>
          <p className="text-xs text-sand-50/40">Try switching to &quot;All History&quot; or clear search.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => {
            const charge = appt.treatments.reduce((s, t) => s + t.charge, 0);
            const paid   = appt.payments.filter((p) => p.type === "payment").reduce((s, p) => s + p.amount, 0);
            const disc   = appt.payments.filter((p) => p.type === "discount" || p.type === "waiver").reduce((s, p) => s + p.amount, 0);
            const outstanding = Math.max(charge - paid - disc, 0);
            const isSettled = outstanding === 0;

            const apptDate = formatAppointmentDate({
              year: appt.year,
              month: appt.month,
              day: appt.day,
            });

            return (
              <div
                key={appt.appointmentId}
                className="dash-surface overflow-hidden border border-sand-50/10 rounded-2xl"
              >
                {/* Header row */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sand-50/8 bg-white/[0.01]">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <Link
                        href={`/dashboard/patients/${appt.patient.patientId}`}
                        className="font-semibold text-sand-50 hover:text-turq-400 transition-colors text-base"
                      >
                        {appt.patient.person.firstName} {appt.patient.person.lastName}
                      </Link>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                        isSettled
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/25"
                          : "bg-amber-500/15 text-amber-300 border-amber-500/25"
                      }`}>
                        {isSettled ? "Settled" : "Balance Due"}
                      </span>
                    </div>
                    <p className="text-xs text-sand-50/45 mt-0.5">
                      {apptDate} at {appt.hour}:00 · Dr. {appt.dentist.person.firstName} {appt.dentist.person.lastName} · Room {appt.room}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right sm:text-right">
                      <p className="text-lg font-bold font-display text-sand-50 tabular-nums">
                        {formatNaira(outstanding)}
                      </p>
                      <p className="text-[10px] text-sand-50/40">
                        Total: {formatNaira(charge)} · Paid: {formatNaira(paid)}
                        {disc > 0 && ` · Disc: ${formatNaira(disc)}`}
                      </p>
                    </div>
                    {isAdmin(dbUser) && (
                      <DeleteBillingRecordButton
                        appointmentId={appt.appointmentId}
                        patientName={`${appt.patient.person.firstName} ${appt.patient.person.lastName}`}
                        totalCharge={charge}
                        totalPaid={paid}
                      />
                    )}
                  </div>
                </div>

                {/* Treatment breakdown */}
                {appt.treatments.length > 0 && (
                  <div className="px-5 py-3 border-b border-sand-50/8 bg-black/20 text-xs">
                    <p className="text-[10px] uppercase tracking-wider text-sand-50/35 mb-2 font-bold font-display">
                      Procedures &amp; Items
                    </p>
                    <div className="space-y-1.5">
                      {appt.treatments.map((t) => (
                        <div key={t.treatmentId} className="flex items-center justify-between gap-4">
                          <span className="text-sand-50/70">
                            {t.toothNumber != null && (
                              <span className="text-turq-300 mr-1.5">#{t.toothNumber}</span>
                            )}
                            {t.action}
                          </span>
                          <div className="flex items-center gap-2.5">
                            <span className="text-sand-50/80 font-medium">{formatNaira(t.charge)}</span>
                            {t.paid ? (
                              <span className="text-emerald-400 text-[10px] font-semibold">PAID</span>
                            ) : (
                              <span className="text-amber-400 text-[10px] font-semibold">UNPAID</span>
                            )}
                            {t.medicines.length > 0 && (
                              <Link
                                href={`/dashboard/print/prescription/${t.treatmentId}`}
                                target="_blank"
                                className="text-turq-400 hover:text-turq-300 transition-colors text-[10px] underline"
                              >
                                View Rx
                              </Link>
                            )}
                            {isAdmin(dbUser) && (
                              <DeleteTreatmentProcedureButton
                                treatmentId={t.treatmentId}
                                treatmentName={t.action}
                              />
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

                {/* Payment panel (when outstanding balance remains) */}
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

                {/* Connected next actions (Print Receipt & Recall) */}
                {(isSettled || appt.payments.length > 0) && (
                  <div className="px-5 py-3 bg-white/[0.02] flex flex-wrap items-center justify-between gap-3 text-xs border-t border-sand-50/5">
                    <span className="text-sand-50/50 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-turq-400" />
                      Payment recorded for this visit. Next steps:
                    </span>
                    <div className="flex items-center gap-2">
                      <EmailReceiptButton
                        appointmentId={appt.appointmentId}
                        patientEmail={appt.patient.person.email}
                      />
                      <Link
                        href={`/dashboard/print/invoice/${appt.appointmentId}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-turq-400 hover:text-turq-300 border border-turq-500/25 bg-turq-500/10 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        <span>Print Receipt</span>
                      </Link>
                      <Link
                        href="/dashboard/reception/recalls"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-300 hover:text-purple-200 border border-purple-500/25 bg-purple-500/10 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Set 6-Month Recall (Step 5)</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
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

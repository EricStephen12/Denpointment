import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isAdmin } from "@/lib/auth";
import { formatNaira } from "@/lib/currency";
import { BarChart2, Users, Calendar, TrendingUp, AlertTriangle, RefreshCw, Download } from "lucide-react";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; date?: string }>;
}) {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isAdmin(dbUser)) redirect("/dashboard");

  const { period = "month", date } = await searchParams;

  // ── Date range calculation ──────────────────────────────────────────────────
  const now   = new Date();
  const today = { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };

  // Daily report date (default today)
  let reportDate = today;
  if (date) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (m) reportDate = { y: +m[1], m: +m[2], d: +m[3] };
  }

  // Revenue period data — last 12 months bucketed by month
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [
    dailyAppts,
    revenueByMonth,
    revenueByService,
    revenueByDentist,
    patientGrowth,
    noShowStats,
    recallStats,
  ] = await Promise.all([
    // Daily appointments for selected date
    prisma.appointment.findMany({
      where: { year: reportDate.y, month: reportDate.m, day: reportDate.d },
      include: { treatments: true, payments: true },
    }),

    // Revenue by month — last 12 months
    prisma.payment.findMany({
      where: {
        type: "payment",
        createdAt: { gte: twelveMonthsAgo },
      },
      select: { amount: true, createdAt: true },
    }),

    // Revenue by service
    prisma.treatment.groupBy({
      by: ["serviceId"],
      _sum: { charge: true },
      _count: { treatmentId: true },
      orderBy: { _sum: { charge: "desc" } },
      take: 10,
    }),

    // Revenue by dentist
    prisma.treatment.groupBy({
      by: ["treatorId"],
      _sum: { charge: true },
      _count: { treatmentId: true },
      orderBy: { _sum: { charge: "desc" } },
    }),

    // Patient growth — registrations per month last 12
    prisma.patient.findMany({
      select: { patientId: true },
      orderBy: { patientId: "asc" },
    }),

    // No-show stats last 90 days
    prisma.appointment.groupBy({
      by: ["status"],
      _count: { appointmentId: true },
    }),

    // Recall compliance
    prisma.recall.groupBy({
      by: ["status"],
      _count: { recallId: true },
    }),
  ]);

  // ── Services with names ─────────────────────────────────────────────────────
  const serviceIds = revenueByService.map((r) => r.serviceId).filter(Boolean) as number[];
  const services   = await prisma.service.findMany({ where: { serviceId: { in: serviceIds } } });
  const svcMap     = new Map(services.map((s) => [s.serviceId, s.name]));

  // ── Dentist names ───────────────────────────────────────────────────────────
  const dentistIds = revenueByDentist.map((r) => r.treatorId);
  const dentists   = await prisma.dentist.findMany({ where: { dentistId: { in: dentistIds } }, include: { person: true } });
  const dntMap     = new Map(dentists.map((d) => [d.dentistId, `Dr. ${d.person.firstName} ${d.person.lastName}`]));

  // ── Monthly revenue buckets ─────────────────────────────────────────────────
  const monthBuckets: Record<string, number> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthBuckets[key] = 0;
  }
  for (const p of revenueByMonth) {
    const d   = new Date(p.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (key in monthBuckets) monthBuckets[key] += p.amount;
  }
  const maxMonthRevenue = Math.max(...Object.values(monthBuckets), 1);
  const totalRevenue    = Object.values(monthBuckets).reduce((s, v) => s + v, 0);

  // ── Daily stats ─────────────────────────────────────────────────────────────
  const dailyTotal    = dailyAppts.length;
  const dailyCheckins = dailyAppts.filter((a) => ["checked_in","in_chair","completed"].includes(a.status)).length;
  const dailyNoShows  = dailyAppts.filter((a) => a.status === "no_show").length;
  const dailyRevenue  = dailyAppts.flatMap((a) => a.payments).filter((p) => p.type === "payment").reduce((s, p) => s + p.amount, 0);

  // ── No-show rate ────────────────────────────────────────────────────────────
  const statusMap     = new Map(noShowStats.map((s) => [s.status, s._count.appointmentId]));
  const totalAppts    = noShowStats.reduce((s, x) => s + x._count.appointmentId, 0);
  const noShowCount   = statusMap.get("no_show") ?? 0;
  const cancelCount   = statusMap.get("cancelled") ?? 0;
  const noShowRate    = totalAppts > 0 ? ((noShowCount / totalAppts) * 100).toFixed(1) : "0.0";
  const cancelRate    = totalAppts > 0 ? ((cancelCount / totalAppts) * 100).toFixed(1) : "0.0";

  // ── Recall compliance ───────────────────────────────────────────────────────
  const recallMap      = new Map(recallStats.map((r) => [r.status, r._count.recallId]));
  const totalRecalls   = recallStats.reduce((s, r) => s + r._count.recallId, 0);
  const completedRecalls = recallMap.get("completed") ?? 0;
  const recallRate     = totalRecalls > 0 ? ((completedRecalls / totalRecalls) * 100).toFixed(1) : "0.0";

  function fmtMonthLabel(key: string) {
    const [y, m] = key.split("-");
    return new Date(+y, +m - 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  }

  const dateInputVal = `${reportDate.y}-${String(reportDate.m).padStart(2,"0")}-${String(reportDate.d).padStart(2,"0")}`;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="dash-icon-badge">
            <BarChart2 className="h-5 w-5 text-turq-400" />
          </div>
          <div>
            <h1 className="dash-title font-display">Reports & Analytics</h1>
            <p className="dash-body mt-0.5">Clinic performance at a glance</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/api/export/patients"
            className="inline-flex items-center gap-1.5 text-xs border border-sand-50/15 hover:border-turq-400/30 text-sand-50/40 hover:text-turq-400 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> Patients CSV
          </a>
          <a
            href={`/api/export/schedule`}
            className="inline-flex items-center gap-1.5 text-xs border border-sand-50/15 hover:border-turq-400/30 text-sand-50/40 hover:text-turq-400 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> Today's Schedule CSV
          </a>
        </div>
      </div>

      {/* ── Daily Summary ── */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-semibold text-sand-50 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-turq-400" /> Daily Summary
          </h2>
          <form method="get" className="flex items-center gap-2">
            <input type="date" name="date" defaultValue={dateInputVal} className="dash-input text-xs py-1" />
            <button type="submit" className="text-xs bg-turq-600 text-ink-950 px-3 py-1.5 rounded-lg font-semibold hover:bg-turq-500 transition-colors">View</button>
          </form>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Appointments", value: dailyTotal,             color: "text-sand-50" },
            { label: "Checked In",   value: dailyCheckins,          color: "text-turq-400" },
            { label: "No-shows",     value: dailyNoShows,           color: "text-red-400" },
            { label: "Revenue",      value: formatNaira(dailyRevenue), color: "text-turq-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="dash-surface p-5 text-center">
              <p className={`text-2xl font-display ${color}`}>{value}</p>
              <p className="text-[10px] uppercase tracking-wider text-sand-50/35 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Revenue chart ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-sand-50 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-turq-400" /> Revenue — Last 12 Months
          </h2>
          <span className="text-xs text-sand-50/40">{formatNaira(totalRevenue)} total</span>
        </div>
        <div className="dash-surface p-5">
          <div className="flex items-end gap-1.5 h-36">
            {Object.entries(monthBuckets).map(([key, val]) => {
              const pct = Math.round((val / maxMonthRevenue) * 100);
              return (
                <div key={key} className="flex-1 flex flex-col items-center gap-1 group">
                  <div
                    className="w-full bg-turq-600/30 hover:bg-turq-600/60 transition-colors rounded-t relative"
                    style={{ height: `${Math.max(pct, 2)}%` }}
                  >
                    {val > 0 && (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-sand-50/60 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatNaira(val)}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-sand-50/30 rotate-45 origin-left hidden sm:block">
                    {fmtMonthLabel(key)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Revenue by service + dentist ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <h2 className="text-sm font-semibold text-sand-50 mb-4">Revenue by Service</h2>
          <div className="dash-surface p-5 space-y-3">
            {revenueByService.length === 0 ? (
              <p className="text-sm text-sand-50/30">No data yet.</p>
            ) : revenueByService.map((r) => {
              const name = r.serviceId ? (svcMap.get(r.serviceId) ?? "Custom") : "Custom";
              const amount = r._sum.charge ?? 0;
              const pct = Math.round((amount / (revenueByService[0]._sum.charge ?? 1)) * 100);
              return (
                <div key={String(r.serviceId)} className="space-y-1">
                  <div className="flex justify-between text-xs text-sand-50/70">
                    <span>{name} <span className="text-sand-50/30">({r._count.treatmentId}x)</span></span>
                    <span className="text-turq-400">{formatNaira(amount)}</span>
                  </div>
                  <div className="h-1.5 bg-sand-50/10 rounded-full">
                    <div className="h-full bg-turq-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-sand-50 mb-4">Revenue by Dentist</h2>
          <div className="dash-surface p-5 space-y-3">
            {revenueByDentist.length === 0 ? (
              <p className="text-sm text-sand-50/30">No data yet.</p>
            ) : revenueByDentist.map((r) => {
              const name   = dntMap.get(r.treatorId) ?? "Unknown";
              const amount = r._sum.charge ?? 0;
              const pct    = Math.round((amount / ((revenueByDentist[0]._sum.charge) ?? 1)) * 100);
              return (
                <div key={r.treatorId} className="space-y-1">
                  <div className="flex justify-between text-xs text-sand-50/70">
                    <span>{name} <span className="text-sand-50/30">({r._count.treatmentId} procedures)</span></span>
                    <span className="text-turq-400">{formatNaira(amount)}</span>
                  </div>
                  <div className="h-1.5 bg-sand-50/10 rounded-full">
                    <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="dash-surface p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <h3 className="text-sm font-semibold text-sand-50">No-show & Cancellation</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-sand-50/60">
              <span>Total appointments</span><span className="text-sand-50">{totalAppts}</span>
            </div>
            <div className="flex justify-between text-sand-50/60">
              <span>No-show rate</span><span className="text-red-400">{noShowRate}%</span>
            </div>
            <div className="flex justify-between text-sand-50/60">
              <span>Cancellation rate</span><span className="text-amber-400">{cancelRate}%</span>
            </div>
          </div>
        </div>

        <div className="dash-surface p-5">
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw className="h-4 w-4 text-turq-400" />
            <h3 className="text-sm font-semibold text-sand-50">Recall Compliance</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-sand-50/60">
              <span>Total recalls</span><span className="text-sand-50">{totalRecalls}</span>
            </div>
            <div className="flex justify-between text-sand-50/60">
              <span>Completed</span><span className="text-turq-400">{completedRecalls}</span>
            </div>
            <div className="flex justify-between text-sand-50/60">
              <span>Compliance rate</span><span className="text-turq-400">{recallRate}%</span>
            </div>
          </div>
        </div>

        <div className="dash-surface p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-turq-400" />
            <h3 className="text-sm font-semibold text-sand-50">Patient Registry</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-sand-50/60">
              <span>Total patients</span><span className="text-sand-50">{patientGrowth.length}</span>
            </div>
            <div className="flex justify-between text-sand-50/60">
              <span>Outstanding balances</span>
              <Link href="/dashboard/admin/outstanding" className="text-red-400 hover:text-red-300 transition-colors">
                View →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

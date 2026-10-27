import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isAdmin } from "@/lib/auth";
import { formatNaira } from "@/lib/currency";
import {
  Users,
  Calendar,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Download,
  DollarSign,
  Activity,
  CheckCircle2,
  Stethoscope,
} from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isAdmin(dbUser)) redirect("/dashboard");

  const { date } = await searchParams;

  // ── Date range calculation ──────────────────────────────────────────────────
  const now = new Date();
  const today = { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };

  let reportDate = today;
  if (date) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (m) reportDate = { y: +m[1], m: +m[2], d: +m[3] };
  }

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
    prisma.appointment.findMany({
      where: { year: reportDate.y, month: reportDate.m, day: reportDate.d },
      include: { treatments: true, payments: true },
    }),
    prisma.payment.findMany({
      where: {
        type: "payment",
        createdAt: { gte: twelveMonthsAgo },
      },
      select: { amount: true, createdAt: true },
    }),
    prisma.treatment.groupBy({
      by: ["serviceId"],
      _sum: { charge: true },
      _count: { treatmentId: true },
      orderBy: { _sum: { charge: "desc" } },
      take: 8,
    }),
    prisma.treatment.groupBy({
      by: ["treatorId"],
      _sum: { charge: true },
      _count: { treatmentId: true },
      orderBy: { _sum: { charge: "desc" } },
    }),
    prisma.patient.findMany({
      select: { patientId: true },
      orderBy: { patientId: "asc" },
    }),
    prisma.appointment.groupBy({
      by: ["status"],
      _count: { appointmentId: true },
    }),
    prisma.recall.groupBy({
      by: ["status"],
      _count: { recallId: true },
    }),
  ]);

  const serviceIds = revenueByService.map((r) => r.serviceId).filter(Boolean) as number[];
  const services = await prisma.service.findMany({ where: { serviceId: { in: serviceIds } } });
  const svcMap = new Map(services.map((s) => [s.serviceId, s.name]));

  const dentistIds = revenueByDentist.map((r) => r.treatorId);
  const dentists = await prisma.dentist.findMany({ where: { dentistId: { in: dentistIds } }, include: { person: true } });
  const dntMap = new Map(dentists.map((d) => [d.dentistId, `Dr. ${d.person.firstName} ${d.person.lastName}`]));

  const monthBuckets: Record<string, number> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthBuckets[key] = 0;
  }
  for (const p of revenueByMonth) {
    const d = new Date(p.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (key in monthBuckets) monthBuckets[key] += p.amount;
  }
  const maxMonthRevenue = Math.max(...Object.values(monthBuckets), 1);
  const totalRevenue = Object.values(monthBuckets).reduce((s, v) => s + v, 0);

  const dailyTotal = dailyAppts.length;
  const dailyCheckins = dailyAppts.filter((a) => ["checked_in", "in_chair", "completed"].includes(a.status)).length;
  const dailyNoShows = dailyAppts.filter((a) => a.status === "no_show").length;
  const dailyRevenue = dailyAppts.flatMap((a) => a.payments).filter((p) => p.type === "payment").reduce((s, p) => s + p.amount, 0);

  const statusMap = new Map(noShowStats.map((s) => [s.status, s._count.appointmentId]));
  const totalAppts = noShowStats.reduce((s, x) => s + x._count.appointmentId, 0);
  const noShowCount = statusMap.get("no_show") ?? 0;
  const cancelCount = statusMap.get("cancelled") ?? 0;
  const noShowRate = totalAppts > 0 ? ((noShowCount / totalAppts) * 100).toFixed(1) : "0.0";
  const cancelRate = totalAppts > 0 ? ((cancelCount / totalAppts) * 100).toFixed(1) : "0.0";

  const recallMap = new Map(recallStats.map((r) => [r.status, r._count.recallId]));
  const totalRecalls = recallStats.reduce((s, r) => s + r._count.recallId, 0);
  const completedRecalls = recallMap.get("completed") ?? 0;
  const recallRate = totalRecalls > 0 ? ((completedRecalls / totalRecalls) * 100).toFixed(1) : "0.0";

  function fmtMonthLabel(key: string) {
    const [y, m] = key.split("-");
    return new Date(+y, +m - 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  }

  const dateInputVal = `${reportDate.y}-${String(reportDate.m).padStart(2, "0")}-${String(reportDate.d).padStart(2, "0")}`;

  return (
    <div className="space-y-8">
      {/* Executive Header */}
      <AdminPageHeader
        section="Analytics & Intelligence"
        title="Financial & Operational Reports"
        description="Monitor clinic revenue trajectory, appointment attendance, treatment breakdowns, and patient retention over time."
        action={
          <div className="flex items-center gap-2">
            <a
              href="/api/export/patients"
              className="inline-flex items-center gap-1.5 text-xs border border-sand-50/15 hover:border-turq-400/40 text-sand-50/80 hover:text-turq-400 px-3.5 py-2 rounded-xl transition-all bg-ink-900 shadow-sm"
            >
              <Download className="h-3.5 w-3.5" /> Export Patients CSV
            </a>
            <a
              href="/api/export/schedule"
              className="inline-flex items-center gap-1.5 text-xs border border-sand-50/15 hover:border-turq-400/40 text-sand-50/80 hover:text-turq-400 px-3.5 py-2 rounded-xl transition-all bg-ink-900 shadow-sm"
            >
              <Download className="h-3.5 w-3.5" /> Export Schedule CSV
            </a>
          </div>
        }
      />

      {/* ── Daily Summary & Date Filter ── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-turq-400" />
            <h2 className="text-sm font-semibold text-sand-50">Single-Day Performance Snapshot</h2>
          </div>
          <form method="get" className="flex items-center gap-2">
            <input
              type="date"
              name="date"
              defaultValue={dateInputVal}
              className="px-3 py-1.5 bg-ink-900 border border-sand-50/10 rounded-xl text-xs text-sand-50 focus:outline-none focus:border-turq-500"
            />
            <button
              type="submit"
              className="text-xs bg-turq-500 hover:bg-turq-400 text-ink-950 px-3.5 py-1.5 rounded-xl font-bold transition-colors cursor-pointer"
            >
              Update View
            </button>
          </form>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-ink-900 border border-sand-50/10 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-sand-50/40 font-medium">Appointments</p>
              <p className="text-2xl font-bold font-display text-sand-50 mt-1">{dailyTotal}</p>
            </div>
            <div className="p-3 rounded-xl bg-sand-50/5 text-sand-50/60">
              <Calendar className="h-5 w-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-ink-900 border border-sand-50/10 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-sand-50/40 font-medium">Checked In / Treated</p>
              <p className="text-2xl font-bold font-display text-turq-400 mt-1">{dailyCheckins}</p>
            </div>
            <div className="p-3 rounded-xl bg-turq-500/10 text-turq-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-ink-900 border border-sand-50/10 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-red-400/80 font-medium">No-Shows</p>
              <p className="text-2xl font-bold font-display text-red-400 mt-1">{dailyNoShows}</p>
            </div>
            <div className="p-3 rounded-xl bg-red-500/10 text-red-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-ink-900 border border-sand-50/10 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-sand-50/40 font-medium">Day's Collections</p>
              <p className="text-xl font-bold font-display text-emerald-400 mt-1">{formatNaira(dailyRevenue)}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
        </div>
      </section>

      {/* ── 12-Month Revenue Trajectory ── */}
      <section className="bg-ink-900 border border-sand-50/10 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-sand-50/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-turq-500/10 text-turq-400">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-sand-50">12-Month Revenue Trajectory</h2>
              <p className="text-xs text-sand-50/40">Gross collections recorded through billing &amp; checkout</p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs text-sand-50/40 uppercase tracking-wider">Annual Production</p>
            <p className="text-xl font-bold font-display text-turq-400">{formatNaira(totalRevenue)}</p>
          </div>
        </div>

        <div className="pt-2">
          <div className="flex items-end gap-2 sm:gap-3 h-44 pb-2">
            {Object.entries(monthBuckets).map(([key, val]) => {
              const pct = Math.round((val / maxMonthRevenue) * 100);
              return (
                <div key={key} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  {val > 0 && (
                    <span className="text-[10px] font-mono text-sand-50/70 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {formatNaira(val)}
                    </span>
                  )}
                  <div
                    className="w-full bg-gradient-to-t from-turq-600/40 to-turq-400/80 group-hover:to-turq-300 transition-all rounded-t-lg relative"
                    style={{ height: `${Math.max(pct, 4)}%` }}
                  />
                  <span className="text-[10px] text-sand-50/40 font-medium whitespace-nowrap">
                    {fmtMonthLabel(key)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Breakdown: Services & Dentists ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Procedure */}
        <section className="bg-ink-900 border border-sand-50/10 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-sand-50/10">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-turq-400" />
              <h2 className="text-sm font-semibold text-sand-50">Top Procedures by Revenue</h2>
            </div>
            <span className="text-xs text-sand-50/40">Top {revenueByService.length} Services</span>
          </div>

          <div className="space-y-3.5">
            {revenueByService.length === 0 ? (
              <p className="text-xs text-sand-50/30 py-6 text-center">No service revenue recorded yet.</p>
            ) : (
              revenueByService.map((r, idx) => {
                const name = r.serviceId ? (svcMap.get(r.serviceId) ?? "Custom Procedure") : "Custom Procedure";
                const amount = r._sum.charge ?? 0;
                const topAmt = revenueByService[0]?._sum?.charge ?? 1;
                const pct = Math.round((amount / topAmt) * 100);

                return (
                  <div key={String(r.serviceId ?? idx)} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-sand-50 flex items-center gap-1.5">
                        <span className="text-sand-50/30 font-mono">#{idx + 1}</span>
                        <span>{name}</span>
                        <span className="text-sand-50/30 font-normal">({r._count.treatmentId}x)</span>
                      </span>
                      <span className="font-mono text-sand-50 font-bold">{formatNaira(amount)}</span>
                    </div>
                    <div className="h-2 bg-sand-50/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-turq-500 to-turq-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Revenue by Doctor */}
        <section className="bg-ink-900 border border-sand-50/10 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-sand-50/10">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-purple-400" />
              <h2 className="text-sm font-semibold text-sand-50">Provider Production Distribution</h2>
            </div>
            <span className="text-xs text-sand-50/40">{revenueByDentist.length} Practitioners</span>
          </div>

          <div className="space-y-3.5">
            {revenueByDentist.length === 0 ? (
              <p className="text-xs text-sand-50/30 py-6 text-center">No dentist production data yet.</p>
            ) : (
              revenueByDentist.map((r, idx) => {
                const name = dntMap.get(r.treatorId) ?? "Doctor";
                const amount = r._sum.charge ?? 0;
                const topAmt = revenueByDentist[0]?._sum?.charge ?? 1;
                const pct = Math.round((amount / topAmt) * 100);

                return (
                  <div key={r.treatorId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-sand-50 flex items-center gap-1.5">
                        <span className="text-purple-400/60 font-mono">#{idx + 1}</span>
                        <span>{name}</span>
                        <span className="text-sand-50/30 font-normal">({r._count.treatmentId} procedures)</span>
                      </span>
                      <span className="font-mono text-sand-50 font-bold">{formatNaira(amount)}</span>
                    </div>
                    <div className="h-2 bg-sand-50/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* ── Operational Reliability & Compliance ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-ink-900 border border-sand-50/10 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-sand-50/10">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-sand-50">Attendance Reliability</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-sand-50/60">
              <span>Total Scheduled Bookings</span>
              <span className="text-sand-50 font-semibold">{totalAppts}</span>
            </div>
            <div className="flex justify-between text-sand-50/60">
              <span>No-Show Rate</span>
              <span className="text-red-400 font-semibold">{noShowRate}%</span>
            </div>
            <div className="flex justify-between text-sand-50/60">
              <span>Cancellation Rate</span>
              <span className="text-amber-400 font-semibold">{cancelRate}%</span>
            </div>
          </div>
        </div>

        <div className="bg-ink-900 border border-sand-50/10 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-sand-50/10">
            <RefreshCw className="h-4 w-4 text-turq-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-sand-50">Recall Compliance</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-sand-50/60">
              <span>Total Recalls Due</span>
              <span className="text-sand-50 font-semibold">{totalRecalls}</span>
            </div>
            <div className="flex justify-between text-sand-50/60">
              <span>Follow-ups Completed</span>
              <span className="text-turq-400 font-semibold">{completedRecalls}</span>
            </div>
            <div className="flex justify-between text-sand-50/60">
              <span>Compliance Rate</span>
              <span className="text-turq-400 font-semibold">{recallRate}%</span>
            </div>
          </div>
        </div>

        <div className="bg-ink-900 border border-sand-50/10 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-sand-50/10">
            <Users className="h-4 w-4 text-turq-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-sand-50">Patient Registry</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-sand-50/60">
              <span>Total Patients Registered</span>
              <span className="text-sand-50 font-semibold">{patientGrowth.length}</span>
            </div>
            <div className="flex justify-between text-sand-50/60 items-center">
              <span>Receivables Management</span>
              <Link href="/dashboard/admin/outstanding" className="text-turq-400 hover:text-turq-300 font-medium">
                View Balances →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

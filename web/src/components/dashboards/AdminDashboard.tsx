import React from "react";
import Link from "next/link";
import {
  CalendarCheck,
  CalendarPlus,
  Users,
  CreditCard,
  RefreshCw,
  Clock,
  ArrowRight,
  Settings,
  Globe,
  Zap,
  BarChart2,
  AlertCircle,
  FlaskConical,
  Share2,
  UserPlus,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { PersonWithRoles } from "@/lib/auth";
import { getClinicDay, formatAppointmentDate } from "@/lib/clinic-date";
import { formatNaira } from "@/lib/currency";
import ClinicWorkflowTracker from "@/components/dashboard/ClinicWorkflowTracker";

export default async function AdminDashboard({ user }: { user?: PersonWithRoles } = {}) {
  const today = getClinicDay();
  const dateStr = formatAppointmentDate(today);

  // Fetch all live operational data in parallel
  const [
    clinicSettings,
    allDentists,
    todayAppointments,
    totalPatients,
    unpaidCount,
    revenueResult,
    openRecalls,
    waitlistCount,
    openLabCases,
  ] = await Promise.all([
    prisma.clinicSettings.findUnique({ where: { id: 1 } }),
    prisma.dentist.findMany({ include: { person: true } }),
    prisma.appointment.findMany({
      where: { year: today.year, month: today.month, day: today.day },
      include: {
        patient: { include: { person: true } },
        dentist: { include: { person: true } },
        treatments: true,
        payments: true,
      },
      orderBy: { hour: "asc" },
    }),
    prisma.patient.count(),
    prisma.treatment.count({ where: { paid: false } }),
    prisma.payment.aggregate({ where: { type: "payment" }, _sum: { amount: true } }),
    prisma.recall.count({ where: { status: { in: ["due", "scheduled"] } } }),
    prisma.waitlistEntry.count({ where: { status: "waiting" } }),
    prisma.labCase.count({ where: { status: { notIn: ["fitted", "cancelled"] } } }),
  ]);

  const totalRevenue = revenueResult._sum.amount ?? 0;

  // Pipeline counts for today
  const bookedCount = todayAppointments.length;
  const checkedInCount = todayAppointments.filter((a) => a.status === "checked_in").length;
  const inChairCount = todayAppointments.filter((a) => a.status === "in_chair").length;
  const completedToday = todayAppointments.filter((a) => a.status === "completed");
  const needBillingCount = completedToday.filter((a) => {
    const totalCharge = a.treatments.reduce((sum, t) => sum + t.charge, 0);
    const totalPaid = a.payments.filter((p) => p.type === "payment").reduce((sum, p) => sum + p.amount, 0);
    return totalCharge > totalPaid;
  }).length;

  function formatHour(h: number) {
    const ampm = h >= 12 ? "PM" : "AM";
    const d = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${d}:00 ${ampm}`;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "checked_in":
        return { label: "Checked In", tone: "bg-blue-500/15 text-blue-300 border-blue-500/30" };
      case "in_chair":
        return { label: "In Chair", tone: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" };
      case "completed":
        return { label: "Completed", tone: "bg-turq-500/15 text-turq-300 border-turq-500/30" };
      case "no_show":
        return { label: "No Show", tone: "bg-red-500/15 text-red-300 border-red-500/30" };
      default:
        return { label: "Scheduled", tone: "bg-sand-50/10 text-sand-50/70 border-sand-50/15" };
    }
  };

  const getNextAction = (a: (typeof todayAppointments)[number]) => {
    const totalCharge = a.treatments.reduce((sum, t) => sum + t.charge, 0);
    const totalPaid = a.payments.filter((p) => p.type === "payment").reduce((sum, p) => sum + p.amount, 0);
    const isUnpaid = totalCharge > totalPaid;

    if (a.status === "scheduled") {
      return {
        label: "Check In",
        href: "/dashboard/reception/checkin",
        tone: "bg-turq-600 hover:bg-turq-500 text-ink-950",
      };
    }
    if (a.status === "checked_in") {
      return {
        label: "Send to Chair",
        href: "/dashboard/treatments/today",
        tone: "bg-blue-600 hover:bg-blue-500 text-white",
      };
    }
    if (a.status === "in_chair") {
      return {
        label: "Clinical Chart",
        href: `/dashboard/patients/${a.pId}`,
        tone: "bg-emerald-600 hover:bg-emerald-500 text-ink-950",
      };
    }
    if (a.status === "completed") {
      if (isUnpaid) {
        return {
          label: `Bill ${formatNaira(totalCharge - totalPaid)}`,
          href: "/dashboard/admin/billing",
          tone: "bg-amber-500 hover:bg-amber-400 text-ink-950",
        };
      }
      return {
        label: "Set Recall",
        href: "/dashboard/reception/recalls",
        tone: "bg-purple-600 hover:bg-purple-500 text-white",
      };
    }
    return {
      label: "View Visit",
      href: "/dashboard/treatments/today",
      tone: "bg-white/[0.08] hover:bg-white/[0.15] text-sand-50",
    };
  };

  return (
    <div className="space-y-8">
      {/* ── 1. CLINIC HEADER & LIVE STATUS ── */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 border-b border-sand-50/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-turq-400 bg-turq-500/10 border border-turq-500/20 px-2.5 py-0.5 rounded-full font-display">
              Clinic Command Center
            </span>
            <span className="text-xs text-sand-50/40">·</span>
            <span className="text-xs text-sand-50/60 font-medium">{dateStr}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-sand-50 tracking-tight">
            {user ? `Good day, ${user.firstName}` : "Practice Overview"}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-sand-50/50">
            Hours: {clinicSettings?.openHour ?? 8}:00 AM – {clinicSettings?.closeHour ?? 18}:00 PM · {allDentists.length} Doctors Registered
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/dashboard/book"
            className="inline-flex items-center gap-2 bg-turq-600 hover:bg-turq-500 text-ink-950 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm"
          >
            <CalendarPlus className="h-4 w-4" />
            <span>Book Patient</span>
          </Link>
          <Link
            href="/dashboard/reception/checkin"
            className="inline-flex items-center gap-2 bg-white/[0.08] hover:bg-white/[0.12] text-sand-50 border border-sand-50/15 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors"
          >
            <CalendarCheck className="h-4 w-4 text-turq-400" />
            <span>Check-in Desk</span>
          </Link>
        </div>
      </header>

      {/* ── 2. THE 5-STEP CONNECTED DAILY WORKFLOW BAR ── */}
      <section aria-label="Daily Clinic Workflow">
        <ClinicWorkflowTracker
          counts={{
            booked: bookedCount,
            checkedIn: checkedInCount,
            inChair: inChairCount,
            needBilling: needBillingCount,
            recallsDue: openRecalls,
          }}
        />
      </section>

      {/* ── 3. TODAY'S LIVE QUEUE & QUICK ACTIONS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Live Patient Queue */}
        <section className="lg:col-span-2 dash-surface p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-sand-50/10">
              <div>
                <h2 className="text-base font-bold font-display text-sand-50 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-turq-400" />
                  Today's Patient Queue
                </h2>
                <p className="text-xs text-sand-50/45 mt-0.5">
                  Real-time status of patients arriving and being treated today
                </p>
              </div>
              <Link
                href="/dashboard/treatments/today"
                className="text-xs text-turq-400 hover:text-turq-300 font-medium inline-flex items-center gap-1"
              >
                Full Schedule <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {todayAppointments.length === 0 ? (
              <div className="text-center py-12 px-4 border border-dashed border-sand-50/10 rounded-xl my-2">
                <p className="text-sm font-medium text-sand-50/60 mb-1">No appointments scheduled for today yet</p>
                <p className="text-xs text-sand-50/35 mb-4">Book in a patient or check the multi-dentist calendar.</p>
                <Link
                  href="/dashboard/book"
                  className="inline-flex items-center gap-1.5 text-xs bg-turq-600 hover:bg-turq-500 text-ink-950 font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  <CalendarPlus className="h-3.5 w-3.5" /> Book First Visit
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-sand-50/10 text-[10px] uppercase font-bold text-sand-50/40 tracking-wider">
                      <th className="py-2.5 px-3">Time</th>
                      <th className="py-2.5 px-3">Patient</th>
                      <th className="py-2.5 px-3">Doctor</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Next Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-50/5">
                    {todayAppointments.map((a) => {
                      const badge = getStatusBadge(a.status);
                      const action = getNextAction(a);
                      const patientName = `${a.patient.person.firstName} ${a.patient.person.lastName}`;
                      const doctorName = `Dr. ${a.dentist.person.lastName}`;

                      return (
                        <tr key={a.appointmentId} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="py-3 px-3 font-semibold text-sand-50 tabular-nums">
                            {formatHour(a.hour)}
                            <span className="block text-[10px] font-normal text-sand-50/40">Rm {a.room}</span>
                          </td>
                          <td className="py-3 px-3">
                            <Link
                              href={`/dashboard/patients/${a.pId}`}
                              className="font-medium text-sand-50 hover:text-turq-300 transition-colors block truncate max-w-[140px]"
                            >
                              {patientName}
                            </Link>
                            <span className="text-[10px] text-sand-50/40 capitalize">
                              {a.type || "checkup"}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-sand-50/70 truncate max-w-[110px]">
                            {doctorName}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.tone}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <Link
                              href={action.href}
                              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors ${action.tone}`}
                            >
                              <span>{action.label}</span>
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-sand-50/10 flex items-center justify-between text-xs text-sand-50/40">
            <span>{todayAppointments.length} total visits scheduled today</span>
            <span>{completedToday.length} completed</span>
          </div>
        </section>

        {/* Right 1 Col: Quick Action Launchpad */}
        <section className="dash-surface p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold font-display text-sand-50 mb-1">
              Quick Actions
            </h2>
            <p className="text-xs text-sand-50/45 mb-4">
              Common tasks for front desk and clinic management
            </p>

            <div className="space-y-2">
              {[
                {
                  label: "Book Appointment",
                  sub: "Schedule visit for new or returning patient",
                  href: "/dashboard/book",
                  icon: CalendarPlus,
                  color: "text-turq-400 bg-turq-500/10",
                },
                {
                  label: "Open Check-In Desk",
                  sub: "Mark patient arrivals and send to doctor",
                  href: "/dashboard/reception/checkin",
                  icon: CalendarCheck,
                  color: "text-blue-400 bg-blue-500/10",
                },
                {
                  label: "Record Payment / Cash Desk",
                  sub: "Issue receipts and take Cash / Card / POS",
                  href: "/dashboard/admin/billing",
                  icon: CreditCard,
                  color: "text-amber-400 bg-amber-500/10",
                },
                {
                  label: "Register New Patient",
                  sub: "Add patient record & contact information",
                  href: "/dashboard/patients",
                  icon: UserPlus,
                  color: "text-emerald-400 bg-emerald-500/10",
                },
                {
                  label: "Recall Follow-up List",
                  sub: `${openRecalls} patients due for 6-month checkup`,
                  href: "/dashboard/reception/recalls",
                  icon: RefreshCw,
                  color: "text-purple-400 bg-purple-500/10",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-sand-50/10 hover:border-sand-50/20 hover:bg-white/[0.03] transition-all group"
                  >
                    <div className={`p-2 rounded-lg ${item.color} shrink-0`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-sand-50 group-hover:text-turq-300 transition-colors">
                        {item.label}
                      </p>
                      <p className="text-[10px] text-sand-50/40 truncate">
                        {item.sub}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-sand-50/25 group-hover:text-sand-50/60 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Quick Metrics summary strip */}
          <div className="mt-4 pt-3 border-t border-sand-50/10 grid grid-cols-2 gap-2 text-center">
            <div className="p-2 rounded-lg bg-white/[0.02]">
              <span className="block text-[10px] text-sand-50/40">Total Registered</span>
              <span className="text-sm font-bold text-sand-50 tabular-nums">{totalPatients.toLocaleString()}</span>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.02]">
              <span className="block text-[10px] text-sand-50/40">Waiting List</span>
              <span className="text-sm font-bold text-sand-50 tabular-nums">{waitlistCount}</span>
            </div>
          </div>
        </section>
      </div>

      {/* ── 4. PRACTICE MANAGEMENT HUB (ALL ADMIN TOOLS UNHIDDEN & CLEAR) ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold font-display text-sand-50 tracking-tight">
            Practice Management & Administration
          </h2>
          <p className="text-xs text-sand-50/50 mt-0.5">
            Configure team permissions, treatment fees, website branding, and view practice reports
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: "Staff & Permissions",
              desc: "Manage doctors, receptionists, access roles, and assign surgery rooms.",
              href: "/dashboard/admin/staff",
              icon: Users,
              badge: `${allDentists.length} Doctors`,
            },
            {
              title: "Hours & Pricing",
              desc: "Configure clinic opening hours, working days, and procedure catalog prices.",
              href: "/dashboard/admin/settings",
              icon: Settings,
              badge: "Settings",
            },
            {
              title: "Financial Ledger",
              desc: "Review practice collections, payment methods, and revenue trends.",
              href: "/dashboard/admin/reports",
              icon: BarChart2,
              badge: formatNaira(totalRevenue),
            },
            {
              title: "Outstanding Debts",
              desc: "Track patient balances, overdue treatments, and uncollected clinic fees.",
              href: "/dashboard/admin/outstanding",
              icon: AlertCircle,
              badge: unpaidCount > 0 ? `${unpaidCount} Unpaid` : "Up to date",
              badgeAlert: unpaidCount > 0,
            },
            {
              title: "Website & Branding",
              desc: "Customize clinic name, tagline, emergency hotline, and clinic address.",
              href: "/dashboard/admin/site",
              icon: Globe,
              badge: "Public Site",
            },
            {
              title: "Automated Reminders",
              desc: "Automated birthday greetings, recall notices, and SMS/email broadcasts.",
              href: "/dashboard/admin/automations",
              icon: Zap,
              badge: "Automations",
            },
            {
              title: "Dental Lab Cases",
              desc: "Track crowns, bridges, and dentures sent out to external dental laboratories.",
              href: "/dashboard/clinical/labs",
              icon: FlaskConical,
              badge: `${openLabCases} Active`,
            },
            {
              title: "Specialist Referrals",
              desc: "Manage patient cases referred to external specialists or hospitals.",
              href: "/dashboard/clinical/referrals",
              icon: Share2,
              badge: "Referrals",
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                href={card.href}
                className="dash-surface p-4 flex flex-col justify-between hover:border-turq-500/30 hover:bg-white/[0.04] transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="p-2 rounded-xl bg-turq-500/10 border border-turq-500/20 text-turq-400 group-hover:scale-105 transition-transform">
                      <Icon className="h-4 w-4" />
                    </div>
                    {card.badge && (
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          card.badgeAlert
                            ? "bg-amber-500/15 text-amber-300 border-amber-500/25"
                            : "bg-white/[0.04] text-sand-50/60 border-sand-50/10"
                        }`}
                      >
                        {card.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-sand-50 group-hover:text-turq-300 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-sand-50/45 mt-1 leading-relaxed">
                    {card.desc}
                  </p>
                </div>

                <div className="mt-4 pt-2.5 border-t border-sand-50/5 flex items-center justify-between text-xs font-medium text-sand-50/40 group-hover:text-turq-400 transition-colors">
                  <span>Manage</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

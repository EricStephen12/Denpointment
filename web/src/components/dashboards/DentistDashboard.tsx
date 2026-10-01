import React from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, Users, Calendar, Activity, Sun, FlaskConical, RefreshCw, Share2, Stethoscope } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import type { PersonWithRoles } from '@/lib/auth';
import { getClinicDay } from '@/lib/clinic-date';

export default async function DentistDashboard({ user }: { user: PersonWithRoles }) {
  const today = getClinicDay();
  const dentistId = user.dentists[0]?.dentistId;

  const [todayCount, upcomingCount, openLabs, dueRecalls] = await Promise.all([
    dentistId ? prisma.appointment.count({ where: { dId: dentistId, year: today.year, month: today.month, day: today.day } }) : Promise.resolve(0),
    dentistId ? prisma.appointment.count({ where: { dId: dentistId, OR: [{ year: { gt: today.year } }, { year: today.year, month: { gt: today.month } }, { year: today.year, month: today.month, day: { gt: today.day } }] } }) : Promise.resolve(0),
    dentistId ? prisma.labCase.count({ where: { dentistId, status: { notIn: ["fitted","cancelled"] } } }) : Promise.resolve(0),
    dentistId ? prisma.recall.count({ where: { dentistId, status: { in: ["due","scheduled"] } } }) : Promise.resolve(0),
  ]);

  const actions: { label: string; hint: string; href: string; icon: LucideIcon; badge?: string }[] = [
    { label: "Today's schedule", hint: "Review visits and document treatment.", href: '/dashboard/treatments/today', icon: Clock },
    { label: 'Upcoming appointments', hint: 'Review future visits assigned to you.', href: '/dashboard/treatments/upcoming', icon: Calendar },
    { label: 'Patient records', hint: 'Open dental charts, clinical notes and care plans.', href: '/dashboard/patients', icon: Users },
    { label: 'Past treatments', hint: 'Review your completed clinical work.', href: '/dashboard/treatments/past', icon: Activity },
    { label: 'Laboratory cases', hint: 'Track work sent to the dental laboratory.', href: '/dashboard/clinical/labs', icon: FlaskConical, badge: openLabs > 0 ? String(openLabs) : undefined },
    { label: 'Referrals', hint: 'Follow the status of specialist referrals.', href: '/dashboard/clinical/referrals', icon: Share2 },
    { label: 'Recall follow-ups', hint: 'Review patients due to return.', href: '/dashboard/reception/recalls', icon: RefreshCw, badge: dueRecalls > 0 ? String(dueRecalls) : undefined },
    { label: 'Time off', hint: 'Manage your unavailable dates.', href: '/dashboard/holidays', icon: Sun },
  ];

  return (
    <div className="space-y-9">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 border-b border-sand-50/10 pb-6">
        <div>
          <p className="text-xs font-medium text-turq-400 mb-2">Clinical workspace</p>
          <h1 className="text-3xl font-semibold text-sand-50">Good day, Dr. {user.lastName}</h1>
          <p className="mt-1.5 text-sm text-sand-50/45">Room {user.dentists[0]?.roomNumber ?? "—"} · Your clinical schedule and follow-ups</p>
        </div>
        <Link href="/dashboard/treatments/today" className="inline-flex items-center justify-center gap-2 rounded-lg bg-turq-600 hover:bg-turq-500 px-4 py-2.5 text-sm font-semibold text-ink-950 transition-colors">
          <Stethoscope className="h-4 w-4" /> Open today’s schedule
        </Link>
      </header>

      <section aria-label="Clinical summary" className="grid grid-cols-2 sm:grid-cols-4 border-y border-sand-50/10 divide-x divide-y sm:divide-y-0 divide-sand-50/10">
        {[
          { label: "Patients today", value: todayCount, href: "/dashboard/treatments/today", alert: false },
          { label: "Upcoming visits", value: upcomingCount, href: "/dashboard/treatments/upcoming", alert: false },
          { label: "Open lab cases", value: openLabs, href: "/dashboard/clinical/labs", alert: openLabs > 0 },
          { label: "Due recalls", value: dueRecalls, href: "/dashboard/reception/recalls", alert: dueRecalls > 0 },
        ].map(({ label, value, href, alert }) => (
          <Link key={label} href={href} className="group px-4 py-4 sm:px-5 hover:bg-white/[0.03] transition-colors">
            <span className="block text-xs text-sand-50/45">{label}</span>
            <span className={`mt-2 block text-2xl font-semibold tabular-nums ${alert ? "text-amber-400" : "text-sand-50"} group-hover:text-turq-300 transition-colors`}>{value}</span>
          </Link>
        ))}
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-sand-50">Clinical work</h2>
          <span className="text-xs text-sand-50/35">Patient care, case tracking and follow-up</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10">
          {actions.map(({ label, hint, href, icon: Icon, badge }) => (
            <Link key={label} href={href} className="group flex items-center gap-4 border-t border-sand-50/10 py-4">
              <Icon className="h-4 w-4 shrink-0 text-turq-400/80" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-medium text-sand-50 group-hover:text-turq-300 transition-colors">{label}{badge && <span className="rounded bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-amber-300">{badge}</span>}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-sand-50/40">{hint}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-sand-50/25 group-hover:translate-x-0.5 group-hover:text-turq-400 transition-all" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

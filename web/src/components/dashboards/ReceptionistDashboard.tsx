import React from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarCheck, CalendarClock, UserPlus, Users, CreditCard, CalendarPlus, RefreshCw, LayoutGrid, AlertCircle, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import type { PersonWithRoles } from '@/lib/auth';
import { getClinicDay } from '@/lib/clinic-date';

export default async function ReceptionistDashboard({ user }: { user: PersonWithRoles }) {
  const today = getClinicDay();

  const [todayTotal, checkedIn, upcoming, totalPatients, unpaidCount, overdueRecalls, waitlistCount] = await Promise.all([
    prisma.appointment.count({ where: { year: today.year, month: today.month, day: today.day } }),
    prisma.appointment.count({ where: { year: today.year, month: today.month, day: today.day, OR: [{ status: 'checked_in' }, { status: 'in_chair' }, { status: 'completed' }, { checkedIn: true }] } }),
    prisma.appointment.count({ where: { OR: [{ year: { gt: today.year } }, { year: today.year, month: { gt: today.month } }, { year: today.year, month: today.month, day: { gt: today.day } }] } }),
    prisma.patient.count(),
    prisma.treatment.count({ where: { paid: false } }),
    prisma.recall.count({ where: { status: { in: ["due","scheduled"] }, dueDate: { lte: new Date() } } }),
    prisma.waitlistEntry.count({ where: { status: "waiting" } }),
  ]);

  const pending = todayTotal - checkedIn;

  const stats = [
    { label: "Today's Total",  value: todayTotal.toString(),             color: 'text-sand-50' },
    { label: 'Checked In',     value: checkedIn.toString(),              color: 'text-turq-400' },
    { label: 'Still Pending',  value: pending.toString(),                color: 'text-amber-400' },
    { label: 'Upcoming',       value: upcoming.toString(),               color: 'text-sand-50' },
    { label: 'Total Patients', value: totalPatients.toLocaleString(),    color: 'text-sand-50' },
    { label: 'Unpaid Bills',   value: unpaidCount.toString(),            color: unpaidCount > 0 ? 'text-red-400' : 'text-sand-50/40' },
    { label: 'Overdue Recalls',value: overdueRecalls.toString(),         color: overdueRecalls > 0 ? 'text-amber-400' : 'text-sand-50/40' },
    { label: 'Waitlist',       value: waitlistCount.toString(),          color: 'text-sand-50' },
  ];

  const actions: { label: string; hint: string; href: string; icon: LucideIcon; badge?: string }[] = [
    { label: 'Check-in desk', hint: 'Check patients in, mark no-shows and send reminders.', href: '/dashboard/reception/checkin', icon: CalendarCheck },
    { label: "Today's appointments", hint: 'Review today’s visits and their current status.', href: '/dashboard/treatments/today', icon: Clock },
    { label: 'Clinic calendar', hint: 'See chair availability across all dentists.', href: '/dashboard/reception/calendar', icon: LayoutGrid },
    { label: 'Upcoming appointments', hint: 'Reschedule or cancel future visits.', href: '/dashboard/treatments/upcoming', icon: CalendarClock },
    { label: 'Book an appointment', hint: 'Create a booking for a patient or walk-in.', href: '/dashboard/book', icon: CalendarPlus },
    { label: 'Register a patient', hint: 'Add a patient and continue to appointment booking.', href: '/dashboard/patients', icon: UserPlus },
    { label: 'Patient registry', hint: 'Find a patient and manage contact details.', href: '/dashboard/patients', icon: Users },
    { label: 'Recall list', hint: 'Contact patients due for a follow-up.', href: '/dashboard/reception/recalls', icon: RefreshCw, badge: overdueRecalls > 0 ? String(overdueRecalls) : undefined },
    { label: 'Waiting list', hint: 'Offer newly available appointment slots.', href: '/dashboard/reception/waitlist', icon: CalendarCheck, badge: waitlistCount > 0 ? String(waitlistCount) : undefined },
    { label: 'Record a payment', hint: 'Record payments against patient appointments.', href: '/dashboard/admin/billing', icon: CreditCard },
    { label: 'Outstanding balances', hint: 'Review patient accounts that need follow-up.', href: '/dashboard/admin/outstanding', icon: AlertCircle },
  ];

  return (
    <div className="space-y-9">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 border-b border-sand-50/10 pb-6">
        <div>
          <p className="text-xs font-medium text-turq-400 mb-2">Front desk</p>
          <h1 className="text-3xl font-semibold text-sand-50">Good day, {user.firstName}</h1>
          <p className="mt-1.5 text-sm text-sand-50/45">Today’s patient flow and reception tasks</p>
        </div>
        <Link href="/dashboard/reception/checkin" className="inline-flex items-center justify-center gap-2 rounded-lg bg-turq-600 hover:bg-turq-500 px-4 py-2.5 text-sm font-semibold text-ink-950 transition-colors">
          <CalendarCheck className="h-4 w-4" /> Open check-in desk
        </Link>
      </header>

      <section aria-label="Front desk summary" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 border-y border-sand-50/10 divide-x divide-y sm:divide-y-0 divide-sand-50/10">
        {stats.filter(({ label }) => ["Today's Total", "Checked In", "Still Pending", "Overdue Recalls", "Waitlist", "Unpaid Bills"].includes(label)).map(({ label, value, color }) => (
          <div key={label} className="px-4 py-4 sm:px-5">
            <span className="block text-xs text-sand-50/45">{label}</span>
            <span className={`mt-2 block text-2xl font-semibold tabular-nums ${color}`}>{value}</span>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-12 gap-y-8">
        <section>
          <h2 className="mb-3 text-base font-semibold text-sand-50">Today’s flow</h2>
          <div>
            {actions.slice(0, 5).map(({ label, hint, href, icon: Icon }) => (
              <Link key={label} href={href} className="group flex items-center gap-4 border-t border-sand-50/10 py-4">
                <Icon className="h-4 w-4 shrink-0 text-turq-400/80" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-sand-50 group-hover:text-turq-300 transition-colors">{label}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-sand-50/40">{hint}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-sand-50/25 group-hover:translate-x-0.5 group-hover:text-turq-400 transition-all" />
              </Link>
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-base font-semibold text-sand-50">Patient services</h2>
          <div>
            {actions.slice(5).map(({ label, hint, href, icon: Icon, badge }) => (
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
    </div>
  );
}

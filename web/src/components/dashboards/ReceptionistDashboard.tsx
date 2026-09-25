import React from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarCheck, CalendarClock, UserPlus, Users, CreditCard, CalendarPlus, RefreshCw, LayoutGrid, AlertCircle, Clock } from 'lucide-react';
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

  const actions = [
    { label: "Check-in Desk",        hint: "One-click check-in, no-show, send reminder — all from one screen.",       href: '/dashboard/reception/checkin',   icon: CalendarCheck },
    { label: 'Multi-Dentist Calendar', hint: "See all chairs and all hours across every dentist for any day.",          href: '/dashboard/reception/calendar',  icon: LayoutGrid },
    { label: "Today's Schedule",     hint: "Full appointment list for today with status and patient details.",         href: '/dashboard/treatments/today',    icon: Clock },
    { label: 'Upcoming Appointments', hint: "Browse all future bookings. Reschedule or cancel from here.",             href: '/dashboard/treatments/upcoming', icon: CalendarClock },
    { label: 'Book Appointment',     hint: "Create a booking on behalf of any patient, including walk-ins.",           href: '/dashboard/book',                icon: CalendarPlus },
    { label: 'Patient Registry',     hint: "Search patients, view records, open dental history.",                     href: '/dashboard/patients',            icon: Users },
    { label: 'Register New Patient', hint: "Add a walk-in to the system and go straight to booking.",                  href: '/dashboard/patients',            icon: UserPlus },
    { label: 'Recall List',          hint: "Patients overdue for a checkup. Log call attempts and book them in.",      href: '/dashboard/reception/recalls',   icon: RefreshCw,    badge: overdueRecalls > 0 ? String(overdueRecalls) : undefined },
    { label: 'Waiting List',         hint: "Patients waiting for a slot. Book them when one opens up.",               href: '/dashboard/reception/waitlist',  icon: CalendarCheck, badge: waitlistCount > 0 ? String(waitlistCount) : undefined },
    { label: 'Invoicing & Payments', hint: "Record cash, card or bank transfer payments against any appointment.",     href: '/dashboard/admin/billing',       icon: CreditCard },
    { label: 'Outstanding Balances', hint: "All patients with unpaid balances, sorted by amount owed.",               href: '/dashboard/admin/outstanding',   icon: AlertCircle },
  ] as const;

  return (
    <div className="space-y-12">
      <div>
        <p className="text-turq-400 text-xs tracking-[0.3em] uppercase mb-4">Front Desk</p>
        <h1 className="text-4xl md:text-5xl font-display text-sand-50 leading-tight uppercase">
          WELCOME BACK,<br /><span className="italic text-turq-400">{user.firstName.toUpperCase()}.</span>
        </h1>
        <p className="mt-3 text-sm text-sand-50/40 max-w-xl">
          You manage check-ins, bookings, recalls and invoicing. Everything you need is below.
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-px bg-sand-50/10 border border-sand-50/10 rounded-2xl overflow-hidden">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="bg-ink-900 p-4 flex flex-col gap-1.5">
            <span className={`font-display text-2xl ${color}`}>{value}</span>
            <span className="text-[10px] text-sand-50/35 tracking-[0.12em] uppercase leading-snug">{label}</span>
          </div>
        ))}
      </div>

      {/* Action tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-sand-50/10 border border-sand-50/10 rounded-2xl overflow-hidden">
        {actions.map(({ label, hint, href, icon: Icon, badge }: any) => (
          <Link key={label} href={href} className="bg-ink-900 hover:bg-turq-600/10 transition-colors p-7 flex flex-col justify-between gap-5 group min-h-[190px]">
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-xl bg-turq-500/10 border border-turq-500/15 text-turq-400 group-hover:bg-turq-500/20 transition-colors">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2">
                {badge && <span className="text-[10px] bg-amber-900/40 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-semibold">{badge}</span>}
                <ArrowRight className="h-4 w-4 text-sand-50/15 group-hover:text-turq-400 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
            <div>
              <p className="font-display text-lg uppercase text-sand-50 group-hover:text-turq-400 transition-colors mb-1">{label}</p>
              <p className="text-xs text-sand-50/30 leading-relaxed">{hint}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

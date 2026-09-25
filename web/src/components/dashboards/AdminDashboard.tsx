import React from 'react';
import Link from 'next/link';
import { ArrowRight, Users, BarChart2, CreditCard, Settings, Globe, Zap, CalendarCheck, AlertCircle } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import type { PersonWithRoles } from '@/lib/auth';
import { getClinicDay } from '@/lib/clinic-date';
import { formatNaira } from '@/lib/currency';

export default async function AdminDashboard({ user }: { user?: PersonWithRoles } = {}) {
  const today = getClinicDay();

  const [totalPatients, todayAppointments, unpaidCount, revenueResult, openRecalls] = await Promise.all([
    prisma.patient.count(),
    prisma.appointment.count({ where: { year: today.year, month: today.month, day: today.day } }),
    prisma.treatment.count({ where: { paid: false } }),
    prisma.payment.aggregate({ where: { type: "payment" }, _sum: { amount: true } }),
    prisma.recall.count({ where: { status: { in: ["due","scheduled"] } } }),
  ]);

  const totalRevenue = revenueResult._sum.amount ?? 0;

  const stats = [
    { label: "Today's Visits",   value: todayAppointments.toString(),  href: '/dashboard/reception/checkin',   color: 'text-sand-50' },
    { label: 'Total Patients',   value: totalPatients.toLocaleString(), href: '/dashboard/patients',            color: 'text-sand-50' },
    { label: 'Unpaid Bills',     value: unpaidCount.toString(),         href: '/dashboard/admin/billing',       color: 'text-amber-400' },
    { label: 'Total Collected',  value: formatNaira(totalRevenue),      href: '/dashboard/admin/reports',       color: 'text-turq-400' },
    { label: 'Active Recalls',   value: openRecalls.toString(),         href: '/dashboard/reception/recalls',   color: 'text-sand-50' },
  ];

  const actions = [
    { label: 'Staff Management',      hint: 'Add or remove dentists, receptionists and admins.',        href: '/dashboard/admin/staff',       icon: Users },
    { label: 'Reports & Analytics',   hint: 'Revenue charts, no-show rate, recall compliance.',         href: '/dashboard/admin/reports',     icon: BarChart2 },
    { label: 'Billing & Payments',    hint: 'Record payments, discounts and issue invoices.',            href: '/dashboard/admin/billing',     icon: CreditCard },
    { label: 'Outstanding Balances',  hint: 'All patients with unpaid balances, sorted by amount.',     href: '/dashboard/admin/outstanding', icon: AlertCircle },
    { label: 'Automations & Email',   hint: 'Birthday greetings, reminders and broadcast campaigns.',   href: '/dashboard/admin/automations', icon: Zap },
    { label: 'Clinic Settings',       hint: 'Hours, working days, services and prices.',                href: '/dashboard/admin/settings',    icon: Settings },
    { label: 'Website & Branding',    hint: 'Edit the public site hero, testimonials and contacts.',    href: '/dashboard/admin/site',        icon: Globe },
    { label: 'Check-in Desk',         hint: 'Real-time today\'s schedule with one-click check-in.',    href: '/dashboard/reception/checkin', icon: CalendarCheck },
  ] as const;

  return (
    <div className="space-y-12">
      <div>
        <p className="text-turq-400 text-xs tracking-[0.3em] uppercase mb-4">Admin Portal</p>
        <h1 className="text-4xl md:text-5xl font-display text-sand-50 leading-tight uppercase">
          CLINIC <br /><span className="italic text-turq-400">OVERVIEW.</span>
        </h1>
        {user && <p className="mt-3 text-sm text-sand-50/40">{user.firstName} {user.lastName}</p>}
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-sand-50/10 border border-sand-50/10 rounded-2xl overflow-hidden">
        {stats.map(({ label, value, href, color }) => (
          <Link key={label} href={href} className="bg-ink-900 hover:bg-turq-600/10 transition-colors p-6 flex flex-col gap-3 group">
            <span className="text-[10px] text-sand-50/35 tracking-[0.2em] uppercase">{label}</span>
            <span className={`font-display text-2xl md:text-3xl ${color} group-hover:text-turq-400 transition-colors`}>{value}</span>
          </Link>
        ))}
      </div>

      {/* Action tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-sand-50/10 border border-sand-50/10 rounded-2xl overflow-hidden">
        {actions.map(({ label, hint, href, icon: Icon }) => (
          <Link key={label} href={href} className="bg-ink-900 hover:bg-turq-600/10 transition-colors p-7 flex flex-col justify-between gap-5 group min-h-[180px]">
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-xl bg-turq-500/10 border border-turq-500/15 text-turq-400 group-hover:bg-turq-500/20 transition-colors">
                <Icon className="h-4 w-4" />
              </div>
              <ArrowRight className="h-4 w-4 text-sand-50/15 group-hover:text-turq-400 group-hover:translate-x-1 transition-all" />
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

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import type { PersonWithRoles } from '@/lib/auth';
import { getClinicDay } from '@/lib/clinic-date';

export default async function ReceptionistDashboard({ user }: { user: PersonWithRoles }) {
  const today = getClinicDay();

  const [todayTotal, checkedIn, totalPatients] = await Promise.all([
    prisma.appointment.count({
      where: { year: today.year, month: today.month, day: today.day },
    }),
    prisma.appointment.count({
      where: {
        year: today.year, month: today.month, day: today.day,
        OR: [{ status: 'checked_in' }, { status: 'in_chair' }, { checkedIn: true }],
      },
    }),
    prisma.patient.count(),
  ]);

  const pending = todayTotal - checkedIn;

  const stats = [
    { label: "Today's Total", value: todayTotal.toString(), href: '/dashboard/treatments/today' },
    { label: 'Checked In', value: checkedIn.toString(), href: '/dashboard/treatments/today' },
    { label: 'Pending', value: pending.toString(), href: '/dashboard/treatments/today' },
    { label: 'Total Patients', value: totalPatients.toLocaleString(), href: '/dashboard/patients' },
  ];

  return (
    <div className="space-y-16">
      {/* Editorial greeting */}
      <div>
        <p className="text-turq-400 text-xs tracking-[0.3em] uppercase mb-4">
          Front Desk Portal
        </p>
        <h1 className="text-4xl md:text-5xl font-display text-sand-50 leading-tight uppercase">
          WELCOME BACK, <br />
          <span className="italic text-turq-400">{user?.firstName}.</span>
        </h1>
      </div>

      {/* Live today stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-sand-50/10 border border-sand-50/10 rounded-2xl overflow-hidden">
        {stats.map(({ label, value, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-ink-900 hover:bg-turq-600/10 transition-colors p-8 flex flex-col gap-4 group"
          >
            <span className="text-xs text-sand-50/40 tracking-[0.2em] uppercase">{label}</span>
            <span className="font-display text-3xl md:text-4xl text-sand-50 group-hover:text-turq-400 transition-colors">
              {value}
            </span>
          </Link>
        ))}
      </div>

      <div className="border-t border-sand-50/10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-sand-50/8 border-b border-sand-50/10">
          {[
            { label: "Today's Schedule", href: '/dashboard/treatments/today' },
            { label: 'Patients', href: '/dashboard/patients' },
            { label: 'Book Appointment', href: '/dashboard/book' },
            { label: 'Billing', href: '/dashboard/admin/billing' },
          ].map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="bg-ink-900 py-16 px-8 group flex flex-col justify-between hover:bg-turq-600/10 transition-colors h-[250px]"
            >
              <span className="font-display text-2xl md:text-3xl uppercase text-sand-50 group-hover:text-turq-400 transition-colors">
                {label}
              </span>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.2em] text-sand-50/30">Manage</span>
                <ArrowRight className="h-5 w-5 text-sand-50/20 group-hover:text-turq-400 group-hover:translate-x-2 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

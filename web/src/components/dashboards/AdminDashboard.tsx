import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import type { PersonWithRoles } from '@/lib/auth';
import { getClinicDay } from '@/lib/clinic-date';

export default async function AdminDashboard({ user }: { user?: PersonWithRoles } = {}) {
  const today = getClinicDay();

  const [totalPatients, todayAppointments, unpaidCount, revenueResult] = await Promise.all([
    prisma.patient.count(),
    prisma.appointment.count({
      where: { year: today.year, month: today.month, day: today.day },
    }),
    prisma.treatment.count({ where: { paid: false } }),
    prisma.treatment.aggregate({ where: { paid: true }, _sum: { charge: true } }),
  ]);

  const totalRevenue = revenueResult._sum.charge ?? 0;

  const stats = [
    { label: "Today's Appointments", value: todayAppointments.toString(), href: '/dashboard/treatments/today' },
    { label: 'Total Patients', value: totalPatients.toLocaleString(), href: '/dashboard/patients' },
    { label: 'Pending Payments', value: unpaidCount.toString(), href: '/dashboard/admin/billing' },
    {
      label: 'Total Revenue',
      value: `₦${(totalRevenue / 100).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`,
      href: '/dashboard/admin/billing',
    },
  ];

  return (
    <div className="space-y-16">
      {/* Editorial greeting */}
      <div>
        <p className="text-turq-400 text-xs tracking-[0.3em] uppercase mb-4">
          {user ? `Admin · ${user.firstName} ${user.lastName}` : "Admin Portal"}
        </p>
        <h1 className="text-4xl md:text-5xl font-display text-sand-50 leading-tight uppercase">
          CLINIC <br />
          <span className="italic text-turq-400">OVERVIEW.</span>
        </h1>
      </div>

      {/* Live KPI Stats */}
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

      {/* Navigation tiles */}
      <div className="border-t border-sand-50/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-sand-50/8 border-b border-sand-50/10">
          {[
            { label: 'Staff Management', href: '/dashboard/admin/staff' },
            { label: 'Billing & Revenue', href: '/dashboard/admin/billing' },
            { label: 'Automations & Marketing', href: '/dashboard/admin/automations' },
            { label: 'Clinic Settings', href: '/dashboard/admin/settings' },
            { label: 'Website', href: '/dashboard/admin/site' },
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

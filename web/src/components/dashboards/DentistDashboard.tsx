import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { PersonWithRoles } from '@/lib/auth';

const LINKS = [
  { label: "Today's Schedule", href: '/dashboard/treatments/today', hint: 'See today’s patients & record procedures' },
  { label: 'Patients & dental chart', href: '/dashboard/patients', hint: 'Open a patient → scroll to the 2D tooth chart' },
  { label: 'Upcoming', href: '/dashboard/treatments/upcoming', hint: 'Future appointments' },
  { label: 'Past Treatments', href: '/dashboard/treatments/past', hint: 'Visit history' },
  { label: 'Statistics', href: '/dashboard/statistics/patients', hint: 'Your numbers' },
  { label: 'Holidays', href: '/dashboard/holidays', hint: 'Block unavailable days' },
] as const;

export default function DentistDashboard({ user }: { user: PersonWithRoles }) {
  return (
    <div className="space-y-16">
      <div>
        <p className="text-turq-400 text-xs tracking-[0.3em] uppercase mb-4">
          Dentist Portal
        </p>
        <h1 className="text-4xl md:text-5xl font-display text-sand-50 leading-tight uppercase">
          WELCOME BACK, <br />
          <span className="italic text-turq-400">DR. {user?.lastName}.</span>
        </h1>
        <p className="mt-4 text-sm text-sand-50/45 max-w-xl">
          Dental chart lives on each patient page — open <span className="text-turq-300">Patients &amp; dental chart</span>, pick a patient, then use the tooth grid at the bottom.
        </p>
      </div>

      <div className="border-t border-sand-50/10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-sand-50/8 border-b border-sand-50/10">
          {LINKS.map(({ label, href, hint }) => (
            <Link
              key={label}
              href={href}
              className="bg-ink-900 py-14 px-8 group flex flex-col justify-between hover:bg-turq-600/10 transition-colors min-h-[220px]"
            >
              <div>
                <span className="font-display text-2xl md:text-3xl uppercase text-sand-50 group-hover:text-turq-400 transition-colors block">
                  {label}
                </span>
                <p className="mt-3 text-xs text-sand-50/35 leading-relaxed">{hint}</p>
              </div>
              <div className="flex items-center justify-between mt-8">
                <span className="text-[10px] uppercase tracking-[0.2em] text-sand-50/30">Open</span>
                <ArrowRight className="h-5 w-5 text-sand-50/20 group-hover:text-turq-400 group-hover:translate-x-2 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { PersonWithRoles } from '@/lib/auth';

export default function ReceptionistDashboard({ user }: { user: PersonWithRoles }) {
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

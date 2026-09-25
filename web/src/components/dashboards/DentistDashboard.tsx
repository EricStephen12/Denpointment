import React from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, Users, Calendar, Activity, Sun, FlaskConical, ClipboardList, RefreshCw, Share2 } from 'lucide-react';import { prisma } from '@/lib/prisma';
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

  const actions = [
    { label: "Today's Schedule",    hint: "See your patients for today and record treatments.",                   href: '/dashboard/treatments/today',    icon: Clock },
    { label: 'Upcoming Appointments', hint: "All future bookings assigned to you.",                              href: '/dashboard/treatments/upcoming', icon: Calendar },
    { label: 'Past Treatments',     hint: "Full history of every visit you have treated.",                       href: '/dashboard/treatments/past',     icon: Activity },
    { label: 'Patients & Records',  hint: "Open any patient: dental chart, SOAP notes, clinical care.",         href: '/dashboard/patients',            icon: Users },
    { label: 'Lab Cases',           hint: "Track crowns, dentures and bridges sent to the lab.",                 href: '/dashboard/clinical/labs',       icon: FlaskConical,  badge: openLabs > 0 ? String(openLabs) : undefined },
    { label: 'Referrals',           hint: "Specialist referrals you have created — track pending and sent.",      href: '/dashboard/clinical/referrals',  icon: Share2 },
    { label: 'Recalls',             hint: "Patients you have set to return for follow-up.",                      href: '/dashboard/reception/recalls',   icon: RefreshCw,     badge: dueRecalls > 0 ? String(dueRecalls) : undefined },
    { label: 'Patient Analytics',   hint: "Stats on patients, procedures and revenue.",                          href: '/dashboard/statistics/patients', icon: Activity },
    { label: 'Holidays & Off-Days', hint: "Block days when you are not available.",                              href: '/dashboard/holidays',            icon: Sun },
  ] as const;

  return (
    <div className="space-y-12">
      <div>
        <p className="text-turq-400 text-xs tracking-[0.3em] uppercase mb-4">Clinical Desk</p>
        <h1 className="text-4xl md:text-5xl font-display text-sand-50 leading-tight uppercase">
          WELCOME BACK,<br /><span className="italic text-turq-400">DR. {user.lastName.toUpperCase()}.</span>
        </h1>
        <p className="mt-3 text-sm text-sand-50/40 max-w-xl">
          Room {user.dentists[0]?.roomNumber ?? "—"} · {todayCount} patient{todayCount !== 1 ? "s" : ""} today · {upcomingCount} upcoming
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-sand-50/10 border border-sand-50/10 rounded-2xl overflow-hidden">
        {[
          { label: "Today",     value: todayCount.toString(),    color: "text-turq-400" },
          { label: "Upcoming",  value: upcomingCount.toString(), color: "text-sand-50"  },
          { label: "Open Labs", value: openLabs.toString(),      color: openLabs > 0 ? "text-amber-400" : "text-sand-50/40" },
          { label: "Recalls",   value: dueRecalls.toString(),    color: dueRecalls > 0 ? "text-amber-400" : "text-sand-50/40" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-ink-900 p-6 flex flex-col gap-2">
            <span className="text-[10px] text-sand-50/35 tracking-[0.2em] uppercase">{label}</span>
            <span className={`font-display text-3xl ${color}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Action tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-sand-50/10 border border-sand-50/10 rounded-2xl overflow-hidden">
        {actions.map(({ label, hint, href, icon: Icon, badge }: any) => (
          <Link key={label} href={href} className="bg-ink-900 hover:bg-turq-600/10 transition-colors p-7 flex flex-col justify-between gap-5 group min-h-[180px]">
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

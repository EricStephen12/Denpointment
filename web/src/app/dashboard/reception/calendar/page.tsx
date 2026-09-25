import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isReceptionist, isAdmin } from "@/lib/auth";
import { getClinicDay, formatAppointmentDate, addCalendarDays, toDateKey } from "@/lib/clinic-date";
import { statusMeta } from "@/lib/appointment-status";
import { LayoutGrid, ChevronLeft, ChevronRight, Download } from "lucide-react";

export default async function MultiDentistCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isReceptionist(dbUser) && !isAdmin(dbUser)) redirect("/dashboard");

  const { date: dateParam } = await searchParams;
  const today = getClinicDay();

  let viewDay = today;
  if (dateParam) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateParam);
    if (m) viewDay = { year: parseInt(m[1]), month: parseInt(m[2]), day: parseInt(m[3]) };
  }

  const prevDay = addCalendarDays(viewDay, -1);
  const nextDay = addCalendarDays(viewDay, 1);
  const prevKey = `${prevDay.year}-${String(prevDay.month).padStart(2,"0")}-${String(prevDay.day).padStart(2,"0")}`;
  const nextKey = `${nextDay.year}-${String(nextDay.month).padStart(2,"0")}-${String(nextDay.day).padStart(2,"0")}`;

  const [dentists, settings, appointments] = await Promise.all([
    prisma.dentist.findMany({ include: { person: true }, orderBy: { dentistId: "asc" } }),
    prisma.clinicSettings.findUnique({ where: { id: 1 } }),
    prisma.appointment.findMany({
      where: { year: viewDay.year, month: viewDay.month, day: viewDay.day },
      include: { patient: { include: { person: true } }, dentist: { include: { person: true } } },
      orderBy: { hour: "asc" },
    }),
  ]);

  const openHour = settings?.openHour ?? 8;
  const closeHour = settings?.closeHour ?? 18;
  const hours = Array.from({ length: closeHour - openHour }, (_, i) => openHour + i);

  // Map dentistId-hour → appointment
  const apptMap = new Map<string, typeof appointments[number]>();
  for (const a of appointments) {
    apptMap.set(`${a.dId}-${a.hour}`, a);
  }

  function fmt(h: number) {
    const ampm = h >= 12 ? "PM" : "AM";
    const d = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${d}:00 ${ampm}`;
  }

  const isToday = toDateKey(viewDay) === toDateKey(today);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="dash-icon-badge">
            <LayoutGrid className="h-5 w-5 text-turq-400" />
          </div>
          <div>
            <h1 className="dash-title font-display">Multi-Dentist Calendar</h1>
            <p className="dash-body mt-0.5">{formatAppointmentDate(viewDay)}{isToday ? " · Today" : ""}</p>
          </div>
        </div>
        {/* Day nav */}
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/reception/calendar?date=${prevKey}`}
            className="p-2 border border-sand-50/15 rounded-lg text-sand-50/50 hover:text-sand-50 hover:border-sand-50/30 transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </Link>
          {!isToday && (
            <Link href="/dashboard/reception/calendar"
              className="text-xs px-3 py-1.5 border border-sand-50/15 rounded-lg text-sand-50/50 hover:text-turq-400 transition-colors">
              Today
            </Link>
          )}
          <Link href={`/dashboard/reception/calendar?date=${nextKey}`}
            className="p-2 border border-sand-50/15 rounded-lg text-sand-50/50 hover:text-sand-50 hover:border-sand-50/30 transition-colors">
            <ChevronRight className="h-4 w-4" />
          </Link>
          <a
            href={`/api/export/schedule?date=${toDateKey(viewDay)}`}
            className="inline-flex items-center gap-1.5 text-xs border border-sand-50/15 hover:border-turq-400/30 text-sand-50/40 hover:text-turq-400 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </a>
        </div>
      </div>

      {dentists.length === 0 ? (
        <p className="text-sm text-sand-50/40">No dentists registered yet.</p>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th className="w-20">Time</th>
                {dentists.map((d) => (
                  <th key={d.dentistId}>
                    Dr. {d.person.firstName} {d.person.lastName}
                    <span className="text-sand-50/30 font-normal ml-1">· Rm {d.roomNumber}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hours.map((h) => (
                <tr key={h}>
                  <td className="font-medium text-sand-50/50 whitespace-nowrap">{fmt(h)}</td>
                  {dentists.map((d) => {
                    const app = apptMap.get(`${d.dentistId}-${h}`);
                    if (!app) return (
                      <td key={d.dentistId}>
                        <Link
                          href={`/dashboard/book?date=${toDateKey(viewDay)}&hour=${h}`}
                          className="text-xs text-sand-50/15 hover:text-turq-400 hover:underline transition-colors"
                        >
                          Free
                        </Link>
                      </td>
                    );
                    const meta = statusMeta(app.status);
                    return (
                      <td key={d.dentistId}>
                        <Link href={`/dashboard/patients/${app.patient.patientId}`}
                          className="inline-flex flex-col gap-0.5 group">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${meta.tone} group-hover:opacity-80 transition-opacity`}>
                            {app.patient.person.firstName} {app.patient.person.lastName}
                          </span>
                          <span className="text-[10px] text-sand-50/25">{meta.label}</span>
                        </Link>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mt-4">
        {[
          { label: "Scheduled", tone: "bg-sand-50/8 text-sand-50/50" },
          { label: "Checked in", tone: "bg-amber-900/40 text-amber-300" },
          { label: "In chair", tone: "bg-sky-900/40 text-sky-300" },
          { label: "Completed", tone: "bg-turq-600/20 text-turq-300" },
          { label: "No-show", tone: "bg-red-900/40 text-red-300" },
        ].map(({ label, tone }) => (
          <span key={label} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${tone}`}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

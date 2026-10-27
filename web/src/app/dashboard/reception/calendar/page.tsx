import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isReceptionist, isAdmin, isDentist } from "@/lib/auth";
import { getClinicDay, formatAppointmentDate, addCalendarDays, toDateKey } from "@/lib/clinic-date";
import { statusMeta } from "@/lib/appointment-status";
import { LayoutGrid, ChevronLeft, ChevronRight, Download } from "lucide-react";
import ReassignAppointmentModal from "@/components/reception/ReassignAppointmentModal";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export default async function MultiDentistCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isReceptionist(dbUser) && !isAdmin(dbUser) && !isDentist(dbUser)) redirect("/dashboard");

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

  const dentistOptions = dentists.map((d) => ({
    dentistId: d.dentistId,
    name: `${d.person.firstName} ${d.person.lastName}`,
    defaultRoom: d.roomNumber,
  }));

  const isToday = toDateKey(viewDay) === toDateKey(today);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        section="Operations"
        title="Appointments & Schedule"
        description={`Multi-doctor schedule matrix for ${formatAppointmentDate(viewDay)}${isToday ? " (Today)" : ""}.`}
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Day Nav Toolbar */}
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-sand-50/10 text-xs">
              <Link
                href={`/dashboard/reception/calendar?date=${prevKey}`}
                className="p-1.5 rounded-lg text-sand-50/50 hover:text-sand-50 hover:bg-white/[0.04] transition-colors"
                title="Previous Day"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
              {!isToday && (
                <Link
                  href="/dashboard/reception/calendar"
                  className="px-2.5 py-1 text-xs font-semibold text-turq-400 hover:text-turq-300 transition-colors"
                >
                  Today
                </Link>
              )}
              <Link
                href={`/dashboard/reception/calendar?date=${nextKey}`}
                className="p-1.5 rounded-lg text-sand-50/50 hover:text-sand-50 hover:bg-white/[0.04] transition-colors"
                title="Next Day"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <a
              href={`/api/export/schedule?date=${toDateKey(viewDay)}`}
              className="inline-flex items-center gap-1.5 text-xs border border-sand-50/15 hover:border-turq-400/30 text-sand-50/70 hover:text-turq-400 px-3.5 py-2 rounded-xl transition-colors bg-white/[0.02]"
            >
              <Download className="h-3.5 w-3.5" /> Export Day CSV
            </a>

            <Link
              href="/dashboard/book"
              className="inline-flex items-center gap-2 bg-turq-500 hover:bg-turq-400 text-ink-950 font-semibold px-4 py-2 rounded-xl text-xs sm:text-sm transition-all shadow-sm active:scale-[0.98]"
            >
              <span>+ Book Visit</span>
            </Link>
          </div>
        }
      />

      {/* Schedule Matrix Container */}
      <div className="dash-surface rounded-2xl border border-sand-50/10 overflow-hidden shadow-xl">
        {dentists.length === 0 ? (
          <div className="py-16 text-center text-xs text-sand-50/40">
            No doctors registered yet. Add staff under Practice Management &gt; Staff &amp; Permissions.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-sand-50/10 bg-white/[0.02] text-[10px] uppercase font-bold text-sand-50/40 tracking-wider">
                  <th className="py-3.5 px-4 w-24">Time</th>
                  {dentists.map((d) => (
                    <th key={d.dentistId} className="py-3.5 px-4 min-w-[200px]">
                      <div className="font-semibold text-sand-50 text-xs">
                        Dr. {d.person.firstName} {d.person.lastName}
                      </div>
                      <span className="text-[10px] font-normal text-sand-50/40">
                        Room {d.roomNumber || "1"}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-50/5">
                {hours.map((h) => (
                  <tr key={h} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-3 px-4 font-semibold text-sand-50/60 tabular-nums whitespace-nowrap bg-white/[0.01]">
                      {fmt(h)}
                    </td>
                    {dentists.map((d) => {
                      const app = apptMap.get(`${d.dentistId}-${h}`);
                      if (!app) {
                        return (
                          <td key={d.dentistId} className="py-3 px-4">
                            <Link
                              href={`/dashboard/book?date=${toDateKey(viewDay)}&hour=${h}`}
                              className="inline-block text-[11px] text-sand-50/20 hover:text-turq-400 hover:border-turq-500/30 border border-dashed border-sand-50/10 rounded-lg px-2.5 py-1 transition-colors"
                            >
                              + Available
                            </Link>
                          </td>
                        );
                      }
                      const meta = statusMeta(app.status);
                      return (
                        <td key={d.dentistId} className="py-3 px-4">
                          <div className="p-2 rounded-xl bg-white/[0.02] border border-sand-50/10 flex flex-col gap-1.5 items-start">
                            <Link
                              href={`/dashboard/patients/${app.patient.patientId}`}
                              className="group block"
                            >
                              <span className="text-xs font-semibold text-sand-50 group-hover:text-turq-300 transition-colors block">
                                {app.patient.person.firstName} {app.patient.person.lastName}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`inline-block px-2 py-0.2 rounded-full text-[10px] font-semibold border ${meta.tone}`}>
                                  {meta.label}
                                </span>
                                <span className="text-[10px] text-sand-50/40">
                                  Rm {app.room}
                                </span>
                              </div>
                            </Link>

                            {app.status !== "cancelled" && app.status !== "completed" && (
                              <ReassignAppointmentModal
                                appointmentId={app.appointmentId}
                                currentDentistId={app.dId}
                                currentDentistName={`Dr. ${d.person.firstName} ${d.person.lastName}`}
                                currentRoom={app.room}
                                currentDate={`${app.year}-${String(app.month).padStart(2, "0")}-${String(app.day).padStart(2, "0")}`}
                                currentHour={app.hour}
                                patientName={`${app.patient.person.firstName} ${app.patient.person.lastName}`}
                                dentists={dentistOptions}
                                openHour={openHour}
                                closeHour={closeHour}
                                clinicToday={toDateKey(today)}
                                buttonLabel="Reassign"
                                compact={true}
                              />
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend Footer */}
        <div className="p-4 border-t border-sand-50/10 bg-white/[0.01] flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-sand-50/40 text-[11px] uppercase tracking-wider font-semibold">
            Status Legend:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: "Scheduled", tone: "bg-sand-50/8 text-sand-50/50 border-sand-50/10" },
              { label: "Checked in", tone: "bg-blue-500/10 text-blue-300 border-blue-500/20" },
              { label: "In chair", tone: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" },
              { label: "Completed", tone: "bg-turq-500/10 text-turq-300 border-turq-500/20" },
              { label: "No-show", tone: "bg-red-500/10 text-red-300 border-red-500/20" },
            ].map(({ label, tone }) => (
              <span
                key={label}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${tone}`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

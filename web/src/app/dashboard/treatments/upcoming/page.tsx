import React from 'react';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isDentist, isReceptionist, isAdmin } from "@/lib/auth";
import { CalendarClock } from 'lucide-react';
import Link from "next/link";
import { isAppointmentUpcoming, formatAppointmentDate } from "@/lib/clinic-date";
import { statusMeta } from "@/lib/appointment-status";
import RescheduleModal from "@/components/reception/RescheduleModal";

export default async function UpcomingAppointmentsPage() {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");

  const canView = isDentist(dbUser) || isReceptionist(dbUser) || isAdmin(dbUser);
  if (!canView) redirect("/dashboard");

  const isDoc       = isDentist(dbUser) && !isAdmin(dbUser) && !isReceptionist(dbUser);
  const dentistId   = isDoc ? dbUser.dentists[0].dentistId : undefined;
  const now         = new Date();

  const [appointments, settings] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        ...(dentistId ? { dId: dentistId } : {}),
      },
      include: {
        patient: { include: { person: { include: { contacts: true } } } },
        dentist: { include: { person: true } },
        treatments: true,
      },
      orderBy: [{ year: 'asc' }, { month: 'asc' }, { day: 'asc' }, { hour: 'asc' }],
    }),
    prisma.clinicSettings.findUnique({ where: { id: 1 } }),
  ]);

  const openHour  = settings?.openHour  ?? 8;
  const closeHour = settings?.closeHour ?? 18;

  const upcoming = appointments.filter((app) =>
    isAppointmentUpcoming(app, now) && app.status !== "cancelled"
  );

  function fmtHour(h: number) {
    const ampm = h >= 12 ? "PM" : "AM";
    const d = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${d}:00 ${ampm}`;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="dash-icon-badge">
            <CalendarClock className="h-5 w-5 text-turq-400" />
          </div>
          <div>
            <h1 className="dash-title font-display">Upcoming Appointments</h1>
            <p className="dash-body mt-0.5">
              {upcoming.length} future visit{upcoming.length !== 1 ? "s" : ""}
              {isDoc ? " on your calendar" : " across all dentists"}
            </p>
          </div>
        </div>
        {(isReceptionist(dbUser) || isAdmin(dbUser)) && (
          <Link
            href="/dashboard/book"
            className="inline-flex items-center gap-2 bg-turq-600 hover:bg-turq-500 text-ink-950 px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
          >
            + Book Appointment
          </Link>
        )}
      </div>

      {upcoming.length === 0 ? (
        <div className="text-center py-16 text-sand-50/30 border border-dashed border-sand-50/10 rounded-2xl">
          No upcoming appointments.
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.map((app) => {
            const meta      = statusMeta(app.status);
            const phone     = app.patient.person.contacts[0]?.contactNumber;
            const dateLabel = formatAppointmentDate(
              { year: app.year, month: app.month, day: app.day },
              { weekday: "short", month: "short", day: "numeric" },
            );

            return (
              <div key={app.appointmentId} className="dash-surface p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Left: date + patient */}
                <div className="flex items-center gap-4">
                  <div className="text-center w-20 shrink-0">
                    <p className="text-xs text-sand-50/35 uppercase tracking-wider">{dateLabel.split(",")[0]}</p>
                    <p className="font-display text-xl text-sand-50">{fmtHour(app.hour)}</p>
                    <p className="text-xs text-sand-50/40">Rm {app.room}</p>
                  </div>
                  <div>
                    <Link
                      href={`/dashboard/patients/${app.patient.patientId}`}
                      className="font-semibold text-sand-50 hover:text-turq-400 transition-colors"
                    >
                      {app.patient.person.firstName} {app.patient.person.lastName}
                    </Link>
                    <p className="text-xs text-sand-50/45 mt-0.5">
                      {!isDoc && `Dr. ${app.dentist.person.firstName} ${app.dentist.person.lastName} · `}
                      {dateLabel}
                      {app.type && app.type !== "checkup" && (
                        <span className="ml-2 capitalize text-turq-400/70">{app.type.replace("_", " ")}</span>
                      )}
                    </p>
                    {app.notes && (
                      <p className="text-xs text-sand-50/30 mt-0.5 italic">{app.notes}</p>
                    )}
                    {phone && (
                      <a href={`tel:${phone}`} className="text-xs text-sand-50/25 hover:text-turq-400 mt-0.5 block transition-colors">
                        {phone}
                      </a>
                    )}
                    {app.treatments.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {app.treatments.map((t) => (
                          <span key={t.treatmentId} className="text-[10px] bg-turq-600/15 text-turq-300 border border-turq-500/20 px-2 py-0.5 rounded-full">
                            {t.action}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: status + actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${meta.tone}`}>
                    {meta.label}
                  </span>
                  {app.confirmedAt && (
                    <span className="text-[10px] text-emerald-400 border border-emerald-500/20 bg-emerald-900/20 px-2 py-0.5 rounded-full">
                      Confirmed
                    </span>
                  )}
                  {(isReceptionist(dbUser) || isAdmin(dbUser)) && (
                    <RescheduleModal
                      appointmentId={app.appointmentId}
                      currentDate={`${app.year}-${String(app.month).padStart(2,"0")}-${String(app.day).padStart(2,"0")}`}
                      currentHour={app.hour}
                      openHour={openHour}
                      closeHour={closeHour}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

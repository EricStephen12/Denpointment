import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isReceptionist, isAdmin } from "@/lib/auth";
import { getClinicDay, formatAppointmentDate } from "@/lib/clinic-date";
import { checkInAppointment, markNoShow, confirmAppointment } from "@/app/actions/appointments";
import { statusMeta } from "@/lib/appointment-status";
import RescheduleModal from "@/components/reception/RescheduleModal";
import SendReminderButton from "@/components/reception/SendReminderButton";
import { CalendarCheck, Clock, UserCheck, UserX, Phone, CheckCheck, Download } from "lucide-react";
import PrintScheduleButton from "@/components/common/PrintScheduleButton";

export default async function CheckInPage() {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isReceptionist(dbUser) && !isAdmin(dbUser)) redirect("/dashboard");

  const today = getClinicDay();
  const todayLabel = formatAppointmentDate(today);

  const appointments = await prisma.appointment.findMany({
    where: { year: today.year, month: today.month, day: today.day },
    include: {
      patient: { include: { person: { include: { contacts: true } } } },
      dentist: { include: { person: true } },
      treatments: true,
    },
    orderBy: { hour: "asc" },
  });

  const slots = await prisma.clinicSettings.findUnique({ where: { id: 1 } });
  const openHour = slots?.openHour ?? 8;
  const closeHour = slots?.closeHour ?? 18;

  // Stats
  const total = appointments.length;
  const arrived = appointments.filter((a) => a.status === "checked_in" || a.status === "in_chair" || a.status === "completed").length;
  const pending = appointments.filter((a) => a.status === "scheduled").length;
  const noShows = appointments.filter((a) => a.status === "no_show").length;
  const done = appointments.filter((a) => a.status === "completed").length;

  function formatHour(h: number) {
    const ampm = h >= 12 ? "PM" : "AM";
    const d = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${d}:00 ${ampm}`;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="dash-icon-badge">
            <CalendarCheck className="h-5 w-5 text-turq-400" />
          </div>
          <div>
            <h1 className="dash-title font-display">Check-in Desk</h1>
            <p className="dash-body mt-0.5">{todayLabel} — manage arrivals in real time</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/reception/calendar"
            className="text-xs text-sand-50/50 hover:text-turq-400 border border-sand-50/15 px-3 py-1.5 rounded-lg transition-colors"
          >
            Full Calendar
          </Link>
          <a
            href={`/api/export/schedule?date=${today.year}-${String(today.month).padStart(2,"0")}-${String(today.day).padStart(2,"0")}`}
            className="inline-flex items-center gap-1.5 text-xs border border-sand-50/15 hover:border-turq-400/30 text-sand-50/40 hover:text-turq-400 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </a>
          <PrintScheduleButton />
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Total Today", value: total, color: "text-sand-50" },
          { label: "Arrived", value: arrived, color: "text-turq-400" },
          { label: "Pending", value: pending, color: "text-amber-400" },
          { label: "No-show", value: noShows, color: "text-red-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="dash-surface p-4 text-center">
            <p className={`text-3xl font-display ${color}`}>{value}</p>
            <p className="text-[10px] uppercase tracking-wider text-sand-50/35 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Appointment cards */}
      {appointments.length === 0 ? (
        <div className="text-center py-16 text-sand-50/30 border border-dashed border-sand-50/10 rounded-2xl">
          No appointments scheduled for today.
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((app) => {
            const meta = statusMeta(app.status);
            const phone = app.patient.person.contacts[0]?.contactNumber;
            const isActive = app.status === "scheduled" || app.status === "checked_in";
            const arrivedTime = app.arrivedAt
              ? new Date(app.arrivedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : null;

            return (
              <div
                key={app.appointmentId}
                className={`dash-surface p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-all ${
                  app.status === "completed" ? "opacity-60" : ""
                }`}
              >
                {/* Time + status */}
                <div className="flex items-center gap-4 sm:w-40 shrink-0">
                  <div className="text-center">
                    <p className="text-xl font-display text-sand-50">{formatHour(app.hour)}</p>
                    <p className="text-[10px] text-sand-50/35 mt-0.5">Room {app.room}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${meta.tone}`}>
                    {meta.label}
                  </span>
                </div>

                {/* Patient info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/dashboard/patients/${app.patient.patientId}`}
                    className="text-base font-semibold text-sand-50 hover:text-turq-400 transition-colors"
                  >
                    {app.patient.person.firstName} {app.patient.person.lastName}
                  </Link>
                  <p className="text-xs text-sand-50/45 mt-0.5">
                    Dr. {app.dentist.person.firstName} {app.dentist.person.lastName}
                    {arrivedTime && <span className="text-turq-400 ml-2">· Arrived {arrivedTime}</span>}
                    {app.confirmedAt && <span className="text-emerald-400 ml-2">· Confirmed</span>}
                    {app.notes && <span className="text-sand-50/30 ml-2">· {app.notes}</span>}
                  </p>
                  {phone && (
                    <a href={`tel:${phone}`} className="inline-flex items-center gap-1 text-xs text-sand-50/30 hover:text-turq-400 mt-1 transition-colors">
                      <Phone className="h-3 w-3" /> {phone}
                    </a>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {app.status === "scheduled" && !app.confirmedAt && (
                    <form action={confirmAppointment}>
                      <input type="hidden" name="appointmentId" value={app.appointmentId} />
                      <button type="submit" className="inline-flex items-center gap-1.5 text-xs border border-sand-50/20 hover:border-turq-400/40 text-sand-50/60 hover:text-turq-400 px-3 py-1.5 rounded-lg transition-colors">
                        <CheckCheck className="h-3.5 w-3.5" /> Confirm
                      </button>
                    </form>
                  )}

                  {(app.status === "scheduled" || app.status === "checked_in") && (
                    <form action={checkInAppointment}>
                      <input type="hidden" name="appointmentId" value={app.appointmentId} />
                      <button type="submit" className="inline-flex items-center gap-1.5 text-xs bg-turq-600 hover:bg-turq-500 text-ink-950 px-3 py-1.5 rounded-lg font-semibold transition-colors">
                        <UserCheck className="h-3.5 w-3.5" />
                        {app.status === "checked_in" ? "Re-check In" : "Check In"}
                      </button>
                    </form>
                  )}

                  {app.status === "scheduled" && (
                    <form action={markNoShow}>
                      <input type="hidden" name="appointmentId" value={app.appointmentId} />
                      <button type="submit" className="inline-flex items-center gap-1.5 text-xs border border-red-500/20 text-red-400/70 hover:text-red-400 hover:border-red-400/40 px-3 py-1.5 rounded-lg transition-colors">
                        <UserX className="h-3.5 w-3.5" /> No-show
                      </button>
                    </form>
                  )}

                  <RescheduleModal
                    appointmentId={app.appointmentId}
                    currentDate={`${app.year}-${String(app.month).padStart(2,"0")}-${String(app.day).padStart(2,"0")}`}
                    currentHour={app.hour}
                    openHour={openHour}
                    closeHour={closeHour}
                  />

                  <SendReminderButton
                    appointmentId={app.appointmentId}
                    alreadySent={app.reminderSent}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

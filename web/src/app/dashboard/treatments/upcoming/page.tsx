import React from 'react';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isDentist, isReceptionist, isAdmin } from "@/lib/auth";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { CalendarClock, Calendar, UserCheck, Stethoscope, Phone, Clock, Plus } from 'lucide-react';
import Link from "next/link";
import { isAppointmentUpcoming, formatAppointmentDate, getClinicDay, toDateKey } from "@/lib/clinic-date";
import { statusMeta } from "@/lib/appointment-status";
import ReassignAppointmentModal from "@/components/reception/ReassignAppointmentModal";
import { updateAppointmentNotes } from "@/app/actions/appointments";

export default async function UpcomingAppointmentsPage() {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");

  const canView = isDentist(dbUser) || isReceptionist(dbUser) || isAdmin(dbUser);
  if (!canView) redirect("/dashboard");

  const isDoc       = isDentist(dbUser) && !isAdmin(dbUser) && !isReceptionist(dbUser);
  const dentistId   = isDoc ? dbUser.dentists[0].dentistId : undefined;
  const now         = new Date();
  const clinicToday = toDateKey(getClinicDay(now));

  const [appointments, settings, allDentists] = await Promise.all([
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
    prisma.dentist.findMany({
      include: { person: true },
      orderBy: { person: { lastName: "asc" } },
    }),
  ]);

  const openHour  = settings?.openHour  ?? 8;
  const closeHour = settings?.closeHour ?? 18;

  const dentistOptions = allDentists.map((d) => ({
    dentistId: d.dentistId,
    name: `${d.person.firstName} ${d.person.lastName}`,
    defaultRoom: d.roomNumber,
  }));

  const upcoming = appointments.filter((app) =>
    isAppointmentUpcoming(app, now) && app.status !== "cancelled"
  );

  const uniquePatients = new Set(upcoming.map((a) => a.pId)).size;
  const confirmedCount = upcoming.filter((a) => a.confirmedAt !== null).length;

  function fmtHour(h: number) {
    const ampm = h >= 12 ? "PM" : "AM";
    const d = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${d}:00 ${ampm}`;
  }

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <AdminPageHeader
        section="Clinic Operations"
        title="Upcoming Visits"
        subtitle={`${upcoming.length} future booking${upcoming.length === 1 ? "" : "s"} ${isDoc ? "on your calendar" : "across all dentists"}`}
        action={
          (isReceptionist(dbUser) || isAdmin(dbUser)) ? (
            <Link
              href="/dashboard/book"
              className="inline-flex items-center gap-2 bg-turq-500 hover:bg-turq-400 text-ink-950 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-turq-500/10 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Book Appointment
            </Link>
          ) : undefined
        }
      />

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-ink-900 border border-sand-50/10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-sand-50/40 font-medium">Upcoming Bookings</p>
            <p className="text-2xl font-bold font-display text-turq-400 mt-1">{upcoming.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-turq-500/10 text-turq-400">
            <CalendarClock className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-ink-900 border border-sand-50/10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-sand-50/40 font-medium">Scheduled Patients</p>
            <p className="text-2xl font-bold font-display text-sand-50 mt-1">{uniquePatients}</p>
          </div>
          <div className="p-3 rounded-xl bg-sand-50/5 text-sand-50/60">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-ink-900 border border-sand-50/10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-sand-50/40 font-medium">Confirmed Patients</p>
            <p className="text-2xl font-bold font-display text-emerald-400 mt-1">{confirmedCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Clock className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Appointments List */}
      {upcoming.length === 0 ? (
        <div className="text-center py-16 px-4 bg-ink-900 border border-dashed border-sand-50/10 rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-sand-50/5 border border-sand-50/10 flex items-center justify-center mx-auto mb-3 text-sand-50/30">
            <CalendarClock className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-sand-50">No upcoming appointments found</p>
          <p className="text-xs text-sand-50/40 max-w-sm mx-auto mt-1">
            New appointments scheduled for future dates will automatically appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.map((app) => {
            const meta = statusMeta(app.status);
            const phone = app.patient.person.contacts[0]?.contactNumber;
            const patientFullName = `${app.patient.person.firstName} ${app.patient.person.lastName}`;
            const initials = `${app.patient.person.firstName[0] || ""}${app.patient.person.lastName[0] || ""}`.toUpperCase();
            const dateLabel = formatAppointmentDate(
              { year: app.year, month: app.month, day: app.day },
              { weekday: "short", month: "short", day: "numeric" },
            );

            return (
              <div
                key={app.appointmentId}
                className="bg-ink-900 border border-sand-50/10 rounded-2xl p-5 hover:border-sand-50/20 transition-all shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Left: date badge + patient info */}
                <div className="flex items-center gap-4">
                  <div className="text-center w-20 shrink-0 p-2.5 rounded-xl bg-sand-50/[0.03] border border-sand-50/10">
                    <p className="text-[10px] text-turq-400 uppercase tracking-wider font-semibold">{dateLabel.split(",")[0]}</p>
                    <p className="font-display text-lg text-sand-50 font-bold leading-tight">{fmtHour(app.hour)}</p>
                    <p className="text-[11px] text-sand-50/40">Rm {app.room}</p>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-turq-500/10 border border-turq-500/20 text-turq-400 flex items-center justify-center text-xs font-bold shrink-0">
                      {initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/dashboard/patients/${app.patient.patientId}`}
                          className="font-semibold text-sand-50 hover:text-turq-400 transition-colors"
                        >
                          {patientFullName}
                        </Link>
                        {app.type && app.type !== "checkup" && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full capitalize bg-sand-50/10 text-turq-300 border border-turq-500/20 font-medium">
                            {app.type.replace("_", " ")}
                          </span>
                        )}
                        {app.confirmedAt && (
                          <span className="text-[10px] text-emerald-400 border border-emerald-500/20 bg-emerald-900/20 px-2 py-0.5 rounded-full">
                            Confirmed
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-sand-50/50 mt-0.5">
                        {!isDoc && `Dr. ${app.dentist.person.firstName} ${app.dentist.person.lastName} · `}
                        <span className="text-sand-50/70 font-medium">{dateLabel}</span>
                        {phone && (
                          <>
                            {" · "}
                            <a href={`tel:${phone}`} className="hover:text-turq-400 transition-colors">
                              {phone}
                            </a>
                          </>
                        )}
                      </p>

                      {app.notes && (
                        <p className="text-xs text-sand-50/35 italic mt-1">Note: {app.notes}</p>
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
                </div>

                {/* Right: status pill & actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${meta.tone}`}>
                    {meta.label}
                  </span>

                  {(isReceptionist(dbUser) || isAdmin(dbUser)) && (
                    <>
                      <ReassignAppointmentModal
                        appointmentId={app.appointmentId}
                        currentDentistId={app.dId}
                        currentDentistName={`Dr. ${app.dentist.person.firstName} ${app.dentist.person.lastName}`}
                        currentRoom={app.room}
                        currentDate={`${app.year}-${String(app.month).padStart(2,"0")}-${String(app.day).padStart(2,"0")}`}
                        currentHour={app.hour}
                        patientName={patientFullName}
                        dentists={dentistOptions}
                        openHour={openHour}
                        closeHour={closeHour}
                        clinicToday={clinicToday}
                        buttonLabel="Reassign"
                        compact={true}
                      />
                      <details className="relative">
                        <summary className="cursor-pointer list-none rounded-lg border border-sand-50/10 px-3 py-1.5 text-xs text-sand-50/70 hover:text-sand-50 hover:bg-sand-50/5 transition-colors">
                          Edit
                        </summary>
                        <form action={updateAppointmentNotes} className="absolute right-0 z-20 mt-2 grid w-72 gap-2.5 rounded-xl border border-sand-50/15 bg-ink-900 p-4 shadow-2xl">
                          <input type="hidden" name="appointmentId" value={app.appointmentId} />
                          <label className="grid gap-1 text-xs text-sand-50/60">
                            Visit type
                            <select name="type" defaultValue={app.type} className="dash-input">
                              <option value="checkup">Check-up</option>
                              <option value="cleaning">Cleaning</option>
                              <option value="emergency">Emergency</option>
                              <option value="follow_up">Follow-up</option>
                              <option value="consultation">Consultation</option>
                              <option value="extraction">Extraction</option>
                              <option value="other">Other</option>
                            </select>
                          </label>
                          <label className="grid gap-1 text-xs text-sand-50/60">
                            Reception notes
                            <textarea name="notes" rows={3} maxLength={500} defaultValue={app.notes ?? ""} className="dash-input resize-y" />
                          </label>
                          <button type="submit" className="rounded-lg bg-turq-500 hover:bg-turq-400 px-3 py-2 text-xs font-bold text-ink-950 transition-colors">
                            Save changes
                          </button>
                        </form>
                      </details>
                    </>
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

import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isReceptionist, isAdmin } from "@/lib/auth";
import { getClinicDay, formatAppointmentDate, toDateKey } from "@/lib/clinic-date";
import { statusMeta } from "@/lib/appointment-status";
import RescheduleModal from "@/components/reception/RescheduleModal";
import SendReminderButton from "@/components/reception/SendReminderButton";
import CheckInActions from "@/components/reception/CheckInActions";
import {
  CalendarCheck,
  Clock,
  Phone,
  Download,
  Stethoscope,
  CreditCard,
  ArrowRight,
  User,
} from "lucide-react";
import PrintScheduleButton from "@/components/common/PrintScheduleButton";
import ClinicWorkflowTracker from "@/components/dashboard/ClinicWorkflowTracker";

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
      payments: true,
    },
    orderBy: { hour: "asc" },
  });

  const slots = await prisma.clinicSettings.findUnique({ where: { id: 1 } });
  const openHour = slots?.openHour ?? 8;
  const closeHour = slots?.closeHour ?? 18;

  // Stats
  const total = appointments.length;
  const arrived = appointments.filter(
    (a) => a.status === "checked_in" || a.status === "in_chair" || a.status === "completed"
  ).length;
  const pending = appointments.filter((a) => a.status === "scheduled").length;
  const inChair = appointments.filter((a) => a.status === "in_chair").length;
  const noShows = appointments.filter((a) => a.status === "no_show").length;
  const completed = appointments.filter((a) => a.status === "completed").length;

  function formatHour(h: number) {
    const ampm = h >= 12 ? "PM" : "AM";
    const d = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${d}:00 ${ampm}`;
  }

  return (
    <div className="space-y-6">
      {/* ── 1. WORKFLOW TRACKER BANNER (STEP 2: CHECK-IN) ── */}
      <ClinicWorkflowTracker
        currentStep={2}
        counts={{
          booked: total,
          checkedIn: arrived,
          inChair,
          needBilling: completed,
        }}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="dash-icon-badge">
            <CalendarCheck className="h-5 w-5 text-turq-400" />
          </div>
          <div>
            <h1 className="dash-title font-display">Check-in Desk</h1>
            <p className="dash-body mt-0.5">{todayLabel} — manage arrivals in real time</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/dashboard/reception/calendar"
            className="text-xs text-sand-50/70 hover:text-turq-400 border border-sand-50/15 px-3 py-1.5 rounded-lg transition-colors"
          >
            Multi-Dentist Calendar
          </Link>
          <a
            href={`/api/export/schedule?date=${today.year}-${String(today.month).padStart(2, "0")}-${String(today.day).padStart(2, "0")}`}
            className="inline-flex items-center gap-1.5 text-xs border border-sand-50/15 hover:border-turq-400/30 text-sand-50/60 hover:text-turq-400 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </a>
          <PrintScheduleButton />
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Booked", value: total, color: "text-sand-50" },
          { label: "Arrived / Waiting", value: arrived, color: "text-turq-400" },
          { label: "Awaiting Arrival", value: pending, color: "text-amber-400" },
          { label: "No-Show", value: noShows, color: "text-red-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="dash-surface p-4 text-center">
            <p className={`text-3xl font-display ${color}`}>{value}</p>
            <p className="text-[10px] uppercase tracking-wider text-sand-50/40 mt-1 font-semibold">{label}</p>
          </div>
        ))}
      </div>

      {/* Appointment cards */}
      {appointments.length === 0 ? (
        <div className="text-center py-16 text-sand-50/40 border border-dashed border-sand-50/10 rounded-2xl">
          <p className="font-semibold text-sand-50 mb-1">No appointments scheduled for today.</p>
          <p className="text-xs text-sand-50/40 mb-4">Book in a patient or view upcoming dates.</p>
          <Link
            href="/dashboard/book"
            className="inline-flex items-center gap-2 text-xs bg-turq-600 hover:bg-turq-500 text-ink-950 font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            Book Patient
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((app) => {
            const meta = statusMeta(app.status);
            const phone = app.patient.person.contacts[0]?.contactNumber;
            const arrivedTime = app.arrivedAt
              ? new Date(app.arrivedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : null;

            const isCheckedIn = app.status === "checked_in";
            const isInChair = app.status === "in_chair";
            const isCompleted = app.status === "completed";

            return (
              <div
                key={app.appointmentId}
                className={`dash-surface p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all ${
                  isCompleted ? "opacity-75" : ""
                }`}
              >
                {/* Time + Status */}
                <div className="flex items-center gap-4 sm:w-44 shrink-0">
                  <div className="text-center min-w-[65px]">
                    <p className="text-lg sm:text-xl font-display font-bold text-sand-50">{formatHour(app.hour)}</p>
                    <p className="text-[10px] text-sand-50/40 mt-0.5">Room {app.room}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.tone}`}>
                    {meta.label}
                  </span>
                </div>

                {/* Patient Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/dashboard/patients/${app.patient.patientId}`}
                      className="text-sm sm:text-base font-semibold text-sand-50 hover:text-turq-400 transition-colors"
                    >
                      {app.patient.person.firstName} {app.patient.person.lastName}
                    </Link>
                    <span className="text-[11px] text-sand-50/40 capitalize">
                      ({app.type || "checkup"})
                    </span>
                  </div>
                  <p className="text-xs text-sand-50/50 mt-1">
                    Dr. {app.dentist.person.firstName} {app.dentist.person.lastName}
                    {arrivedTime && <span className="text-turq-300 ml-2 font-medium">· Arrived at {arrivedTime}</span>}
                    {app.confirmedAt && <span className="text-emerald-400 ml-2">· Confirmed</span>}
                    {app.notes && <span className="text-sand-50/40 ml-2">· {app.notes}</span>}
                  </p>
                  {phone && (
                    <a
                      href={`tel:${phone}`}
                      className="inline-flex items-center gap-1 text-xs text-sand-50/40 hover:text-turq-400 mt-1 transition-colors"
                    >
                      <Phone className="h-3 w-3" /> {phone}
                    </a>
                  )}
                </div>

                {/* Connected Workflow Next Actions & CheckIn Controls */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {/* Connected Step 3 handoff when patient is checked in */}
                  {isCheckedIn && (
                    <Link
                      href="/dashboard/treatments/today"
                      className="inline-flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                      title="Step 3: Hand off patient to surgery chair"
                    >
                      <Stethoscope className="h-3.5 w-3.5" />
                      <span>Send to Chair (Step 3)</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}

                  {/* Connected Step 4 handoff when completed */}
                  {isCompleted && (
                    <Link
                      href={`/dashboard/admin/billing?q=${encodeURIComponent(app.patient.person.lastName)}`}
                      className="inline-flex items-center gap-1 text-xs bg-amber-500 hover:bg-amber-400 text-ink-950 font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      title="Step 4: Collect payment"
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      <span>Collect Payment (Step 4)</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}

                  {/* Patient Record Shortcut */}
                  <Link
                    href={`/dashboard/patients/${app.patient.patientId}`}
                    className="p-1.5 rounded-lg border border-sand-50/15 hover:border-sand-50/30 text-sand-50/60 hover:text-sand-50 transition-colors"
                    title="Open Patient Dental File"
                  >
                    <User className="h-4 w-4" />
                  </Link>

                  <CheckInActions
                    appointmentId={app.appointmentId}
                    status={app.status}
                    confirmedAt={app.confirmedAt?.toISOString() ?? null}
                  />

                  <RescheduleModal
                    appointmentId={app.appointmentId}
                    currentDate={`${app.year}-${String(app.month).padStart(2, "0")}-${String(app.day).padStart(2, "0")}`}
                    clinicToday={toDateKey(today)}
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

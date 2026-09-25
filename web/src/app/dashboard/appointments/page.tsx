import React from 'react';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isPatient } from "@/lib/auth";
import { cancelAppointment } from "@/app/actions/appointments";
import { initiateTreatmentPayment } from "@/app/actions/billing";
import {
  X,
  CreditCard,
  MapPin,
  Clock,
  Calendar,
  ArrowRight,
  Pill,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { formatNaira } from "@/lib/currency";
import {
  formatAppointmentDate,
  isAppointmentUpcoming,
  relativeAppointmentLabel,
} from "@/lib/clinic-date";

function formatHour(h: number): string {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}:00 ${ampm}`;
}

export default async function AppointmentsPage() {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isPatient(dbUser)) redirect("/dashboard");

  const patientId = dbUser.patients[0].patientId;
  const now = new Date();

  const allAppointments = await prisma.appointment.findMany({
    where: { pId: patientId },
    include: {
      dentist: { include: { person: true } },
      treatments: { include: { medicines: true } },
      payments: { orderBy: { createdAt: "asc" } },
    },
    orderBy: [{ year: 'asc' }, { month: 'asc' }, { day: 'asc' }, { hour: 'asc' }]
  });

  const upcoming = allAppointments.filter((app) => isAppointmentUpcoming(app, now));

  // Past = only appointments no longer upcoming that have treatments recorded,
  // or are explicitly completed/no_show. Prevents future bookings with no
  // treatments yet from appearing in the past section.
  const past = allAppointments
    .filter((app) => {
      if (isAppointmentUpcoming(app, now)) return false;
      return app.treatments.length > 0 || app.status === "completed" || app.status === "no_show";
    })
    .reverse();

  // Outstanding balance across all visits
  const totalCharge      = allAppointments.flatMap((a) => a.treatments).reduce((s, t) => s + t.charge, 0);
  const totalPaid        = allAppointments.flatMap((a) => a.payments).filter((p) => p.type === "payment").reduce((s, p) => s + p.amount, 0);
  const totalDisc        = allAppointments.flatMap((a) => a.payments).filter((p) => p.type === "discount" || p.type === "waiver").reduce((s, p) => s + p.amount, 0);
  const totalOutstanding = Math.max(totalCharge - totalPaid - totalDisc, 0);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-10 animate-fade-up">
        <p className="text-xs font-medium text-turq-400 uppercase tracking-widest mb-3">
          Your Schedule
        </p>
        <h1 className="text-3xl md:text-4xl font-display text-sand-50 leading-tight">
          My Appointments
        </h1>
        <p className="mt-2 text-sand-50/50 text-sm">
          Track your upcoming visits and past treatments.
        </p>
      </div>

      {/* Outstanding balance banner */}
      {totalOutstanding > 0 && (
        <div className="mb-8 p-5 border border-red-500/20 bg-red-900/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-red-400/70 mb-1">Outstanding Balance</p>
            <p className="text-2xl font-display text-red-400">{formatNaira(totalOutstanding)}</p>
            <p className="text-xs text-sand-50/40 mt-1">
              Scroll down to past treatments and tap <span className="text-turq-300 font-medium">Pay</span> next to each charge — card or bank transfer via Paystack.
            </p>
          </div>
          <Link
            href="/dashboard/portal/bills"
            className="inline-flex items-center gap-2 text-xs bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-full font-semibold transition-colors shrink-0"
          >
            <CreditCard className="h-3.5 w-3.5" /> Pay Now
          </Link>
        </div>
      )}

      {/* ── Upcoming ── */}
      <section className="mb-12">
        <p className="text-xs font-medium text-sand-50/40 uppercase tracking-widest mb-4">
          Upcoming
        </p>

        {upcoming.length > 0 ? (
          <div className="space-y-4">
            {upcoming.map((app) => {
              const dateLabel = relativeAppointmentLabel(
                { year: app.year, month: app.month, day: app.day },
                now,
              );

              return (
                <div
                  key={app.appointmentId}
                  className="dash-card overflow-hidden hover:border-sand-50/15 transition-colors"
                >
                  {/* Turquoise accent bar */}
                  <div className="flex">
                    <div className="w-1 bg-turq-500 shrink-0" />
                    <div className="flex-1 p-5 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Left: date + time */}
                        <div className="space-y-2">
                          <p className="font-display text-xl text-sand-50">{dateLabel}</p>
                          <div className="flex items-center gap-4 text-sm text-sand-50/50">
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              {formatHour(app.hour)}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5" />
                              Room {app.room}
                            </span>
                          </div>
                          {app.treatments.length > 0 && (
                            <div className="pt-1 flex flex-wrap gap-1.5">
                              {app.treatments.map((t) => (
                                <span
                                  key={t.treatmentId}
                                  className="text-[11px] font-medium text-turq-300 bg-turq-950/60 border border-turq-500/25 px-2.5 py-0.5 rounded-full"
                                >
                                  {t.action}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Right: dentist */}
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-turq-600/20 flex items-center justify-center text-turq-300 font-semibold text-sm shrink-0">
                            {app.dentist.person.firstName[0]}{app.dentist.person.lastName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-sand-50">
                              Dr. {app.dentist.person.firstName} {app.dentist.person.lastName}
                            </p>
                            <p className="text-xs text-sand-50/40">Your dentist</p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 pt-4 border-t border-sand-50/8 flex items-center justify-end">
                        <form action={cancelAppointment}>
                          <input type="hidden" name="appointmentId" value={app.appointmentId} />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                            Cancel Appointment
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="dash-card p-8 text-center">
            <div className="w-12 h-12 bg-turq-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-6 w-6 text-turq-400" />
            </div>
            <p className="font-display text-lg text-sand-50 mb-1">No upcoming visits</p>
            <p className="text-sm text-sand-50/40 mb-5">Book a time and we'll confirm it.</p>
            <Link
              href="/dashboard/book"
              className="inline-flex items-center gap-2 bg-turq-600 text-ink-950 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-turq-500 transition-colors"
            >
              Book Now <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </section>

      {/* ── Past Treatments ── */}
      <section>
        <p className="text-xs font-medium text-sand-50/40 uppercase tracking-widest mb-4">
          Past Treatments
        </p>

        {past.length > 0 ? (
          <div className="space-y-4">
            {past.map((app) => {
              const dateLabel = formatAppointmentDate(
                { year: app.year, month: app.month, day: app.day },
                { month: "short", day: "numeric", year: "numeric" },
              );

              return (
                <div
                  key={app.appointmentId}
                  className="dash-card p-5 sm:p-6"
                >
                  <div className="mb-3">
                    <p className="text-sm font-medium text-sand-50">{dateLabel}</p>
                    <p className="text-xs text-sand-50/40 mt-0.5">
                      {formatHour(app.hour)} · Dr. {app.dentist.person.firstName} {app.dentist.person.lastName}
                    </p>
                  </div>

                  {app.treatments.length > 0 ? (
                    <div className="space-y-4 pt-3 border-t border-sand-50/8">
                      {app.treatments.map((treatment) => (
                        <div key={treatment.treatmentId} className="space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm text-sand-50/80">
                              {treatment.toothNumber != null && (
                                <span className="text-turq-300 mr-1.5">#{treatment.toothNumber}</span>
                              )}
                              {treatment.action}
                            </p>
                            {treatment.paid ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-turq-600/20 text-turq-300 shrink-0">
                                <CheckCircle2 className="h-3 w-3" />
                                Paid
                              </span>
                            ) : (
                              <form action={initiateTreatmentPayment}>
                                <input type="hidden" name="treatmentId" value={treatment.treatmentId} />
                                <button
                                  type="submit"
                                  className="inline-flex items-center gap-1 text-xs text-ink-950 bg-turq-600 hover:bg-turq-500 px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer"
                                >
                                  <CreditCard className="h-3 w-3" />
                                  Pay {formatNaira(treatment.charge)}
                                </button>
                              </form>
                            )}
                          </div>
                          {treatment.complaint && (
                            <p className="text-xs text-sand-50/40">Complaint: {treatment.complaint}</p>
                          )}
                          {treatment.description && (
                            <p className="text-xs text-sand-50/40 whitespace-pre-wrap">{treatment.description}</p>
                          )}
                          {treatment.medicines.length > 0 && (
                            <div className="space-y-1.5">
                              {treatment.medicines.map((m) => (
                                <div
                                  key={m.medicineId}
                                  className="flex items-start gap-1.5 text-xs text-sand-50/60"
                                >
                                  <Pill className="h-3 w-3 text-turq-400 mt-0.5 shrink-0" />
                                  <span>
                                    <span className="text-sand-50/80">{m.medicineName}</span>
                                    {[m.dose, m.frequency, m.duration].filter(Boolean).length > 0 && (
                                      <> — {[m.dose, m.frequency, m.duration].filter(Boolean).join(" · ")}</>
                                    )}
                                    {m.instructions ? (
                                      <span className="block text-sand-50/40">{m.instructions}</span>
                                    ) : null}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-sand-50/30 italic pt-3 border-t border-sand-50/8">
                      No treatment recorded for this visit.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="dash-card p-8 text-center">
            <p className="text-sm text-sand-50/40">No past visits recorded yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}


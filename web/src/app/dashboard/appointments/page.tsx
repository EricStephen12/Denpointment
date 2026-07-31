import React from 'react';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isPatient } from "@/lib/auth";
import { cancelAppointment } from "@/app/actions/appointments";
import { initiateTreatmentPayment } from "@/app/actions/billing";
import {
  CalendarClock,
  X,
  CreditCard,
  MapPin,
  Clock,
  User,
  Calendar,
  ArrowRight,
  Pill,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

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
      treatments: { include: { medicines: true } }
    },
    orderBy: [{ year: 'asc' }, { month: 'asc' }, { day: 'asc' }, { hour: 'asc' }]
  });

  const upcoming = allAppointments.filter(app => {
    const d = new Date(app.year, app.month - 1, app.day, app.hour);
    return d >= now;
  });

  const past = allAppointments.filter(app => {
    const d = new Date(app.year, app.month - 1, app.day, app.hour);
    return d < now;
  }).reverse();

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

      {/* ── Upcoming ── */}
      <section className="mb-12">
        <p className="text-xs font-medium text-sand-50/40 uppercase tracking-widest mb-4">
          Upcoming
        </p>

        {upcoming.length > 0 ? (
          <div className="space-y-4">
            {upcoming.map((app) => {
              const apptDate = new Date(app.year, app.month - 1, app.day);
              const dateLabel = apptDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              });

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
            <p className="text-sm text-sand-50/40 mb-5">Your next smile session is just a click away.</p>
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
              const treatment = app.treatments[0];
              const apptDate = new Date(app.year, app.month - 1, app.day);
              const dateLabel = apptDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div
                  key={app.appointmentId}
                  className="dash-card p-5 sm:p-6"
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="text-sm font-medium text-sand-50">{dateLabel}</p>
                      <p className="text-xs text-sand-50/40 mt-0.5">
                        {formatHour(app.hour)} · Dr. {app.dentist.person.firstName} {app.dentist.person.lastName}
                      </p>
                    </div>

                    {treatment ? (
                      treatment.paid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-turq-600/20 text-turq-300">
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
                            Pay ${treatment.charge}
                          </button>
                        </form>
                      )
                    ) : null}
                  </div>

                  {/* Treatment details */}
                  {treatment ? (
                    <div className="space-y-2 pt-3 border-t border-sand-50/8">
                      {treatment.complaint && (
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-medium text-sand-50/40 w-20 shrink-0 pt-0.5">Complaint</span>
                          <p className="text-sm text-sand-50/60">{treatment.complaint}</p>
                        </div>
                      )}
                      {treatment.action && (
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-medium text-sand-50/40 w-20 shrink-0 pt-0.5">Treatment</span>
                          <p className="text-sm text-sand-50/60">{treatment.action}</p>
                        </div>
                      )}
                      {treatment.charge != null && (
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-medium text-sand-50/40 w-20 shrink-0 pt-0.5">Charge</span>
                          <p className="text-sm font-medium text-sand-50">${treatment.charge}</p>
                        </div>
                      )}
                      {treatment.medicines.length > 0 && (
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-medium text-sand-50/40 w-20 shrink-0 pt-0.5">Medicines</span>
                          <div className="flex flex-wrap gap-1.5">
                            {treatment.medicines.map((m) => (
                              <span
                                key={m.medicineId}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs bg-sand-50/8 text-sand-50/60"
                              >
                                <Pill className="h-3 w-3 text-turq-400" />
                                {m.medicineName}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
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
            <p className="text-sm text-sand-50/40">No past visits yet — your journey begins here.</p>
          </div>
        )}
      </section>
    </div>
  );
}


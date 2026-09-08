import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cancelAppointment } from "@/app/actions/appointments";
import { prisma } from "@/lib/prisma";
import type { PersonWithRoles } from "@/lib/auth";
import { isAppointmentUpcoming, relativeAppointmentLabel, CLINIC_TIMEZONE } from "@/lib/clinic-date";
import { clinicMapsSearchUrl, clinicWhatsAppUrl } from "@/lib/clinic-links";
import { getSiteContent } from "@/lib/site";

function formatHour(h: number): string {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}:00 ${ampm}`;
}

export default async function PatientDashboard({ user }: { user: PersonWithRoles }) {
  const patientId = user.patients[0]?.patientId;
  const now = new Date();
  const [site, allUpcoming] = await Promise.all([
    getSiteContent(),
    patientId
      ? prisma.appointment.findMany({
          where: { pId: patientId },
          include: { dentist: { include: { person: true } }, treatments: true },
          orderBy: [{ year: 'asc' }, { month: 'asc' }, { day: 'asc' }, { hour: 'asc' }],
        })
      : Promise.resolve([]),
  ]);

  const whatsappHref = clinicWhatsAppUrl(
    `Hi ${site.clinicName}, I'm ${user.firstName} ${user.lastName} (${user.email}). I'd like to follow up.`,
    site.phone,
  );
  const mapsHref = clinicMapsSearchUrl(site.address);

  const upcoming = allUpcoming.find((app) => isAppointmentUpcoming(app, now)) ?? null;

  // Time-based greeting (clinic clock — Abuja)
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone: CLINIC_TIMEZONE,
    hour: "numeric",
    hourCycle: "h23",
  })
    .formatToParts(now)
    .find((p) => p.type === "hour");
  const clinicHour = hour ? parseInt(hour.value, 10) : now.getHours();
  const greeting =
    clinicHour < 12 ? 'GOOD MORNING' : clinicHour < 17 ? 'GOOD AFTERNOON' : 'GOOD EVENING';

  const dateLabel = upcoming
    ? relativeAppointmentLabel(
        { year: upcoming.year, month: upcoming.month, day: upcoming.day },
        now,
      )
    : null;

  const timeLabel = upcoming ? formatHour(upcoming.hour) : null;

  const timelineSteps = upcoming
    ? [
        { label: 'BOOKED', done: true },
        { label: 'REMINDER', done: upcoming.reminderSent },
        {
          label: 'CHECK-IN',
          done:
            upcoming.status === 'checked_in' ||
            upcoming.status === 'in_chair' ||
            upcoming.status === 'completed' ||
            upcoming.checkedIn,
        },
        { label: 'TREATMENT', done: upcoming.treatments.length > 0 },
        {
          label: 'DONE',
          done: upcoming.status === 'completed',
        },
      ]
    : [];

  return (
    <div className="space-y-16">
      {/* Editorial greeting & Quick Continue actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <p className="text-turq-400 text-xs tracking-[0.3em] uppercase mb-4">
            Patient Portal
          </p>
          <h1 className="text-4xl md:text-5xl font-display text-sand-50 leading-tight uppercase">
            {greeting}, <br />
            <span className="italic text-turq-400">{user.firstName}.</span>
          </h1>
        </div>

        {/* Simple 2-way Continue Actions */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/dashboard/book"
            className="inline-flex items-center gap-2 bg-turq-600 hover:bg-turq-500 text-ink-950 px-6 py-3.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all shadow-lg shadow-turq-900/20"
          >
            <span>Book Appointment</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-sand-50/15 hover:border-turq-400/50 bg-sand-50/5 hover:bg-sand-50/10 text-sand-50 px-6 py-3.5 rounded-full text-xs font-medium uppercase tracking-wider transition-all"
          >
            <span>Continue with WhatsApp</span>
            <ArrowRight className="h-4 w-4 text-turq-400" />
          </a>
        </div>
      </div>

      <div id="portal-web" className="scroll-mt-24 space-y-16">
      {/* Next appointment */}
      {upcoming ? (
        <div className="border-y border-sand-50/10 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <p className="text-xs text-sand-50/40 tracking-[0.2em] uppercase mb-4">
                Next Appointment
              </p>
              <p className="text-4xl font-display text-sand-50 uppercase mb-2">
                {dateLabel}
              </p>
              <p className="text-sand-50/60 font-display italic text-2xl">
                {timeLabel} &middot; Room {upcoming.room}
              </p>
            </div>
            
            <div className="md:text-right flex flex-col justify-between">
              <div>
                <p className="text-xs text-sand-50/40 tracking-[0.2em] uppercase mb-1">
                  Provider
                </p>
                <p className="font-display text-2xl text-sand-50 uppercase">
                  DR. {upcoming.dentist.person.firstName} {upcoming.dentist.person.lastName}
                </p>
              </div>

              <div className="flex items-center gap-6 mt-8 md:mt-0 md:justify-end">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-turq-400 hover:text-turq-300 uppercase tracking-widest transition-colors"
                >
                  WhatsApp Clinic
                </a>
                <a
                  href={`tel:${site.phone.replace(/\s/g, "")}`}
                  className="text-xs font-medium text-sand-50/60 hover:text-turq-400 uppercase tracking-widest transition-colors"
                >
                  Call Clinic
                </a>
                <form action={cancelAppointment}>
                  <input type="hidden" name="appointmentId" value={upcoming.appointmentId} />
                  <button
                    type="submit"
                    formAction={cancelAppointment}
                    onClick={(e) => {
                      if (!confirm('Are you sure you want to cancel this appointment? This cannot be undone.')) {
                        e.preventDefault();
                      }
                    }}
                    className="text-xs font-medium text-red-500 hover:text-red-700 uppercase tracking-widest transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </form>
              </div>
            </div>
          </div>
          
          {/* Timeline Minimal */}
          <div className="mt-12 flex items-center justify-between border-t border-sand-50/10 pt-8">
            {timelineSteps.map((step, i, arr) => (
              <React.Fragment key={step.label}>
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full mb-3 ${step.done ? 'bg-turq-600' : 'border border-sand-50/20'}`} />
                  <span className={`text-[10px] tracking-[0.2em] ${step.done ? 'text-sand-50' : 'text-sand-50/30'}`}>
                    {step.label}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div className={`flex-1 h-px mx-4 ${step.done && arr[i + 1].done ? 'bg-turq-600' : 'bg-sand-50/10'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      ) : (
        <div className="border-y border-sand-50/10 py-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <p className="font-display text-4xl text-sand-50 uppercase mb-2">No Upcoming <br className="hidden md:block"/> Appointments</p>
            <p className="text-sand-50/50 text-sm tracking-wide">
              Your next smile session is just a few clicks away.
            </p>
          </div>
          <Link
            href="/dashboard/book"
            className="flex-shrink-0 border border-sand-50/20 text-sand-50 px-8 py-4 text-xs tracking-[0.2em] uppercase hover:border-turq-600 hover:text-turq-400 transition-colors flex items-center gap-3"
          >
            Book Now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Quick actions minimal */}
      <div>
        <p className="text-xs text-sand-50/40 tracking-[0.2em] uppercase mb-8">
          Quick Actions
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-px bg-sand-50/10 border-y border-sand-50/10">
          {[
            { label: 'Book Visit', href: '/dashboard/book' },
            { label: 'My History', href: '/dashboard/appointments' },
            { label: 'WhatsApp Us', href: whatsappHref, external: true },
            { label: 'Update Profile', href: '/dashboard/profile' },
            { label: 'Directions', href: mapsHref, external: true },
          ].map(({ label, href, external }) => (
            <Link
              key={label}
              href={href}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="bg-transparent py-10 px-6 group flex items-center justify-between hover:bg-turq-50/10 transition-colors"
            >
              <span className="font-display text-xl uppercase text-sand-50 group-hover:text-turq-400 transition-colors">
                {label}
              </span>
              <ArrowRight className="h-4 w-4 text-sand-50/20 group-hover:text-turq-400 group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
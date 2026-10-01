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

  // Outstanding balance
  const allPaymentsData = patientId ? await prisma.payment.findMany({
    where: { patientId, type: "payment" },
    select: { amount: true },
  }) : [];
  const allDiscData = patientId ? await prisma.payment.findMany({
    where: { patientId, type: { in: ["discount", "waiver"] } },
    select: { amount: true },
  }) : [];
  const totalCharge = allUpcoming.flatMap((a) => a.treatments).reduce((s, t) => s + t.charge, 0);
  const totalPaid   = allPaymentsData.reduce((s, p) => s + p.amount, 0);
  const totalDisc   = allDiscData.reduce((s, p) => s + p.amount, 0);
  const outstandingBalance = Math.max(totalCharge - totalPaid - totalDisc, 0);

  // Due recall
  const dueRecall = patientId ? await prisma.recall.findFirst({
    where: { patientId, status: { in: ["due", "scheduled"] }, dueDate: { lte: now } },
    orderBy: { dueDate: "asc" },
  }) : null;

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

  return (
    <div className="space-y-9">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-5 border-b border-sand-50/10 pb-6">
        <div>
          <p className="text-xs font-medium text-turq-400 mb-2">Patient portal</p>
          <h1 className="text-3xl font-semibold text-sand-50">
            {greeting.charAt(0) + greeting.slice(1).toLowerCase()}, {user.firstName}
          </h1>
          <p className="mt-1.5 text-sm text-sand-50/45">Your appointments, care plan and account</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/dashboard/book"
            className="inline-flex items-center gap-2 bg-turq-600 hover:bg-turq-500 text-ink-950 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            <span>Book an appointment</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          {outstandingBalance > 0 && (
            <Link
              href="/dashboard/portal/bills"
              className="inline-flex items-center gap-2 border border-red-500/30 text-red-300 hover:bg-red-500/10 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <span>Pay balance</span>
            </Link>
          )}
        </div>
      </header>

      <div id="portal-web" className="scroll-mt-24 space-y-8">
      {/* Outstanding balance banner */}
      {outstandingBalance > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-red-500/20 bg-red-900/10 rounded-lg">
          <div>
            <p className="text-xs uppercase tracking-wider text-red-400/70 mb-0.5">Outstanding Balance</p>
            <p className="text-xl font-display text-red-400">{new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(outstandingBalance)}</p>
          </div>
          <Link href="/dashboard/portal/bills" className="inline-flex items-center gap-2 text-xs bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-full font-semibold transition-colors shrink-0">
            View & Pay <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Recall due banner */}
      {dueRecall && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-turq-500/20 bg-turq-600/5 rounded-lg">
          <div>
            <p className="text-xs uppercase tracking-wider text-turq-400/70 mb-0.5">Time for your checkup</p>
            <p className="text-sm text-sand-50/70">{dueRecall.reason}</p>
          </div>
          <Link href="/dashboard/book" className="inline-flex items-center gap-2 text-xs bg-turq-600 hover:bg-turq-500 text-ink-950 px-4 py-2.5 rounded-full font-semibold transition-colors shrink-0">
            Book Now <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
      {/* Next appointment */}
      {upcoming ? (
        <div className="border border-sand-50/10 bg-ink-900/60 rounded-lg p-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-sand-50/45 mb-2">Next appointment</p>
              <p className="text-2xl font-semibold text-sand-50">{dateLabel}</p>
              <p className="mt-1 text-sm text-sand-50/60">{timeLabel} · Room {upcoming.room}</p>
            </div>
            
            <div className="md:text-right flex flex-col justify-between gap-4">
              <div>
                <p className="text-xs text-sand-50/45 mb-1">Dentist</p>
                <p className="text-base font-medium text-sand-50">
                  Dr. {upcoming.dentist.person.firstName} {upcoming.dentist.person.lastName}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 md:justify-end">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-turq-400 hover:text-turq-300 transition-colors"
                >
                  WhatsApp Clinic
                </a>
                <a
                  href={`tel:${site.phone.replace(/\s/g, "")}`}
                  className="text-xs font-medium text-sand-50/60 hover:text-turq-400 transition-colors"
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
                    className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </form>
              </div>
            </div>
          </div>
          
        </div>
      ) : (
        <div className="border border-sand-50/10 bg-ink-900/60 rounded-lg p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div>
            <p className="text-lg font-semibold text-sand-50 mb-1">No upcoming appointments</p>
            <p className="text-sand-50/50 text-sm">Book a visit whenever you’re ready.</p>
          </div>
          <Link
            href="/dashboard/book"
            className="flex-shrink-0 bg-turq-600 hover:bg-turq-500 text-ink-950 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
          >
            Book Now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Quick actions minimal */}
      <div>
        <h2 className="text-base font-semibold text-sand-50 mb-3">Your care and account</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10">
          {[
            { label: 'Book Visit', href: '/dashboard/book' },
            { label: 'My History', href: '/dashboard/appointments' },
            { label: 'Treatment Plan', href: '/dashboard/portal/plan' },
            { label: 'Prescriptions', href: '/dashboard/portal/prescriptions' },
            { label: 'My Bills', href: '/dashboard/portal/bills' },
            { label: 'WhatsApp Us', href: whatsappHref, external: true },
            { label: 'Update Contact', href: '/dashboard/portal/contact' },
            { label: 'Directions', href: mapsHref, external: true },
          ].map(({ label, href, external }) => (
            <Link
              key={label}
              href={href}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              className="bg-transparent py-4 group flex items-center justify-between border-t border-sand-50/10 hover:bg-white/[0.03] transition-colors"
            >
              <span className="text-sm font-medium text-sand-50 group-hover:text-turq-300 transition-colors">
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
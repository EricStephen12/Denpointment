import React from 'react';
import Link from 'next/link';
import { getCurrentPerson } from '@/lib/auth';
import { getSiteContent } from '@/lib/site';
import { redirect } from 'next/navigation';
import { CheckCircle, Calendar as CalendarIcon, Clock, MapPin, ArrowRight, CalendarPlus, MessageCircle } from 'lucide-react';
import { formatAppointmentDate } from "@/lib/clinic-date";

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; hour?: string; room?: string; service?: string }>;
}) {
  const [dbUser, site] = await Promise.all([
    getCurrentPerson(),
    getSiteContent(),
  ]);

  if (!dbUser) redirect("/");

  const { date, hour, room, service } = await searchParams;

  if (!date || !hour) {
    redirect("/dashboard/appointments");
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    redirect("/dashboard/appointments");
  }
  const friendlyDate = formatAppointmentDate({
    year: parseInt(match[1], 10),
    month: parseInt(match[2], 10),
    day: parseInt(match[3], 10),
  });

  const h = parseInt(hour, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const friendlyTime = `${displayHour}:00 ${ampm}`;

  // Google Calendar URL generation (UTC+1 offset)
  const yyyy = match[1];
  const mm = match[2];
  const dd = match[3];
  const startUtcHour = String((h - 1 + 24) % 24).padStart(2, "0");
  const endUtcHour = String((h + 24) % 24).padStart(2, "0");
  const gcalDates = `${yyyy}${mm}${dd}T${startUtcHour}0000Z/${yyyy}${mm}${dd}T${endUtcHour}0000Z`;
  const gcalTitle = encodeURIComponent(`${service || 'Dental Appointment'} — ${site.clinicName}`);
  const gcalDetails = encodeURIComponent(`Dental appointment with ${site.clinicName} (Room ${room || '1'}).\nAddress: ${site.address}\nContact: ${site.phone}`);
  const gcalLocation = encodeURIComponent(site.address);
  const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${gcalTitle}&dates=${gcalDates}&details=${gcalDetails}&location=${gcalLocation}`;

  // WhatsApp follow-up link
  const rawPhone = site.phone.replace(/[^0-9]/g, "");
  const whatsappNumber = rawPhone.startsWith("0") ? `234${rawPhone.slice(1)}` : rawPhone;
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Hello ${site.clinicName}, I just booked an appointment for ${service || 'dental treatment'} on ${friendlyDate} at ${friendlyTime}.`
  )}`;

  return (
    <div className="max-w-lg mx-auto pt-6 text-center animate-fade-up">
      <div className="w-20 h-20 bg-turq-600/20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
        <div className="absolute inset-0 rounded-full bg-turq-400/20 animate-ping" style={{ animationDuration: '3s' }} />
        <CheckCircle className="h-10 w-10 text-turq-400 relative z-10" />
      </div>

      <h1 className="text-3xl md:text-4xl font-display text-sand-50 mb-3">
        You&apos;re all set, {dbUser.firstName}!
      </h1>
      <p className="text-sand-50/60 text-sm mb-8">
        Your appointment has been confirmed. A receipt and confirmation email have been sent to your inbox.
      </p>

      {/* Details Card */}
      <div className="dash-card p-6 md:p-8 text-left mb-6 space-y-5 rounded-2xl border border-sand-50/10 bg-ink-900/90 shadow-xl">
        {service && (
          <>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-turq-600/15 border border-turq-500/20 rounded-2xl shrink-0">
                <CheckCircle className="h-5 w-5 text-turq-400" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-turq-300 uppercase tracking-widest mb-0.5">Procedure</p>
                <p className="font-semibold text-sand-50 text-base">{service}</p>
              </div>
            </div>
            <div className="w-full h-px bg-sand-50/8" />
          </>
        )}

        <div className="flex items-start gap-4">
          <div className="p-3 bg-sand-50/8 rounded-2xl shrink-0">
            <CalendarIcon className="h-5 w-5 text-turq-400" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-sand-50/40 uppercase tracking-widest mb-0.5">Date</p>
            <p className="font-semibold text-sand-50">{friendlyDate}</p>
          </div>
        </div>
        
        <div className="w-full h-px bg-sand-50/8" />

        <div className="flex items-start gap-4">
          <div className="p-3 bg-sand-50/8 rounded-2xl shrink-0">
            <Clock className="h-5 w-5 text-turq-400" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-sand-50/40 uppercase tracking-widest mb-0.5">Time</p>
            <p className="font-semibold text-sand-50">{friendlyTime}</p>
          </div>
        </div>

        {room && (
          <>
            <div className="w-full h-px bg-sand-50/8" />
            <div className="flex items-start gap-4">
              <div className="p-3 bg-sand-50/8 rounded-2xl shrink-0">
                <MapPin className="h-5 w-5 text-turq-400" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-sand-50/40 uppercase tracking-widest mb-0.5">Location &amp; Room</p>
                <p className="font-medium text-sand-50">Room {room} — {site.address}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Quick Calendar & WhatsApp Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        <a
          href={gcalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-sand-50/15 text-xs font-semibold text-sand-50 hover:bg-sand-50/8 transition-colors"
        >
          <CalendarPlus className="h-4 w-4 text-turq-400" />
          <span>Add to Google Calendar</span>
        </a>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-xs font-semibold text-emerald-300 hover:bg-emerald-950/40 transition-colors"
        >
          <MessageCircle className="h-4 w-4 text-emerald-400" />
          <span>Message on WhatsApp</span>
        </a>
      </div>

      {/* Bottom Navigation Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link 
          href="/dashboard"
          className="w-full sm:w-auto px-6 py-3 rounded-xl font-medium text-xs text-sand-50/80 border border-sand-50/15 hover:bg-sand-50/8 transition-colors"
        >
          Return to Dashboard
        </Link>
        <Link 
          href="/dashboard/appointments"
          className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-xs bg-turq-600 text-ink-950 hover:bg-turq-500 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-turq-600/20"
        >
          <span>View My Appointments</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

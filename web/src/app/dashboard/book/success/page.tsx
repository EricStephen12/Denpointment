import React from 'react';
import Link from 'next/link';
import { getCurrentPerson } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CheckCircle, Calendar as CalendarIcon, Clock, MapPin, ArrowRight } from 'lucide-react';
import { formatAppointmentDate } from "@/lib/clinic-date";

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; hour?: string; room?: string; service?: string }>;
}) {
  const dbUser = await getCurrentPerson();
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

  return (
    <div className="max-w-lg mx-auto pt-10 text-center animate-fade-up">
      <div className="w-20 h-20 bg-turq-600/20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
        <div className="absolute inset-0 rounded-full bg-turq-400/20 animate-ping" style={{ animationDuration: '3s' }} />
        <CheckCircle className="h-10 w-10 text-turq-400 relative z-10" />
      </div>

      <h1 className="text-4xl font-display text-sand-50 mb-4">
        You&apos;re all set, {dbUser.firstName}!
      </h1>
      <p className="text-sand-50/50 mb-10">
        Your appointment has been confirmed. We&apos;ve sent the details to your email.
      </p>

      {/* Details Card */}
      <div className="dash-card p-8 text-left mb-10 space-y-6">
        {service && (
          <>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-turq-600/15 border border-turq-500/20 rounded-2xl shrink-0">
                <CheckCircle className="h-6 w-6 text-turq-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-turq-300 uppercase tracking-widest mb-1">Procedure</p>
                <p className="font-semibold text-sand-50 text-base">{service}</p>
              </div>
            </div>
            <div className="w-full h-px bg-sand-50/8" />
          </>
        )}

        <div className="flex items-start gap-4">
          <div className="p-3 bg-sand-50/8 rounded-2xl shrink-0">
            <CalendarIcon className="h-6 w-6 text-turq-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-sand-50/40 uppercase tracking-widest mb-1">Date</p>
            <p className="font-medium text-sand-50">{friendlyDate}</p>
          </div>
        </div>
        
        <div className="w-full h-px bg-sand-50/8" />

        <div className="flex items-start gap-4">
          <div className="p-3 bg-sand-50/8 rounded-2xl shrink-0">
            <Clock className="h-6 w-6 text-turq-400" />
          </div>
          <div>
            <p className="text-xs font-medium text-sand-50/40 uppercase tracking-widest mb-1">Time</p>
            <p className="font-medium text-sand-50">{friendlyTime}</p>
          </div>
        </div>

        {room && (
          <>
            <div className="w-full h-px bg-sand-50/8" />
            <div className="flex items-start gap-4">
              <div className="p-3 bg-sand-50/8 rounded-2xl shrink-0">
                <MapPin className="h-6 w-6 text-turq-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-sand-50/40 uppercase tracking-widest mb-1">Location</p>
                <p className="font-medium text-sand-50">Room {room}</p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link 
          href="/dashboard"
          className="w-full sm:w-auto px-8 py-3.5 rounded-full font-medium text-sm text-sand-50 border border-sand-50/15 hover:bg-sand-50/8 transition-colors"
        >
          Return to Dashboard
        </Link>
        <Link 
          href="/dashboard/appointments"
          className="w-full sm:w-auto px-8 py-3.5 rounded-full font-medium text-sm bg-turq-600 text-ink-950 hover:bg-turq-500 transition-colors flex items-center justify-center gap-2"
        >
          View Appointments <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

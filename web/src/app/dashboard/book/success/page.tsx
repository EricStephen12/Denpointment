import React from "react";
import Link from "next/link";
import { getCurrentPerson } from "@/lib/auth";
import { getSiteContent } from "@/lib/site";
import { redirect } from "next/navigation";
import {
  CheckCircle,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  ArrowRight,
  CalendarPlus,
  MessageCircle,
  CalendarCheck,
  User,
  LayoutDashboard,
  Stethoscope,
} from "lucide-react";
import { formatAppointmentDate } from "@/lib/clinic-date";
import ClinicWorkflowTracker from "@/components/dashboard/ClinicWorkflowTracker";

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string;
    hour?: string;
    room?: string;
    service?: string;
    staff?: string;
    patientName?: string;
    patientId?: string;
    dentistName?: string;
  }>;
}) {
  const [dbUser, site] = await Promise.all([
    getCurrentPerson(),
    getSiteContent(),
  ]);

  if (!dbUser) redirect("/");

  const { date, hour, room, service, staff, patientName, patientId, dentistName } = await searchParams;

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

  const isStaffBooking = staff === "1";

  // Google Calendar URL generation (UTC+1 offset)
  const yyyy = match[1];
  const mm = match[2];
  const dd = match[3];
  const startUtcHour = String((h - 1 + 24) % 24).padStart(2, "0");
  const endUtcHour = String((h + 24) % 24).padStart(2, "0");
  const gcalDates = `${yyyy}${mm}${dd}T${startUtcHour}0000Z/${yyyy}${mm}${dd}T${endUtcHour}0000Z`;
  const gcalTitle = encodeURIComponent(`${service || "Dental Appointment"} — ${site.clinicName}`);
  const gcalDetails = encodeURIComponent(`Dental appointment with ${site.clinicName} (Room ${room || "1"}).\nAddress: ${site.address}\nContact: ${site.phone}`);
  const gcalLocation = encodeURIComponent(site.address);
  const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${gcalTitle}&dates=${gcalDates}&details=${gcalDetails}&location=${gcalLocation}`;

  // WhatsApp follow-up link
  const rawPhone = site.phone.replace(/[^0-9]/g, "");
  const whatsappNumber = rawPhone.startsWith("0") ? `234${rawPhone.slice(1)}` : rawPhone;
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Hello ${site.clinicName}, I just booked an appointment for ${service || "dental treatment"} on ${friendlyDate} at ${friendlyTime}.`
  )}`;

  return (
    <div className="max-w-2xl mx-auto pt-4 space-y-6 animate-fade-up">
      {/* Workflow Tracker Banner */}
      <ClinicWorkflowTracker currentStep={1} />

      <div className="text-center pt-2">
        <div className="w-16 h-16 bg-turq-600/20 rounded-full flex items-center justify-center mx-auto mb-4 relative">
          <div className="absolute inset-0 rounded-full bg-turq-400/20 animate-ping" style={{ animationDuration: "3s" }} />
          <CheckCircle className="h-8 w-8 text-turq-400 relative z-10" />
        </div>

        <h1 className="text-2xl md:text-3xl font-display font-bold text-sand-50 mb-2">
          {isStaffBooking
            ? `Appointment Booked for ${patientName || "Patient"}!`
            : `You're all set, ${dbUser.firstName}!`}
        </h1>
        <p className="text-sand-50/60 text-xs sm:text-sm max-w-lg mx-auto">
          {isStaffBooking
            ? `The visit has been added to the clinic schedule and assigned to ${dentistName || "the dentist"}.`
            : "Your appointment has been confirmed. A confirmation receipt has been sent to your email."}
        </p>
      </div>

      {/* Appointment Summary Card */}
      <div className="dash-card p-6 text-left rounded-2xl border border-sand-50/10 bg-ink-900/90 shadow-xl space-y-4">
        {isStaffBooking && patientName && (
          <div className="flex items-start gap-3.5 pb-4 border-b border-sand-50/10">
            <div className="p-2.5 bg-turq-500/10 border border-turq-500/20 rounded-xl shrink-0">
              <User className="h-4 w-4 text-turq-400" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-sand-50/40 uppercase tracking-wider">Patient Name</p>
              <p className="font-semibold text-sand-50 text-sm">{patientName}</p>
            </div>
          </div>
        )}

        {service && (
          <div className="flex items-start gap-3.5 pb-4 border-b border-sand-50/10">
            <div className="p-2.5 bg-turq-600/15 border border-turq-500/20 rounded-xl shrink-0">
              <CheckCircle className="h-4 w-4 text-turq-400" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-turq-300 uppercase tracking-wider">Procedure / Reason</p>
              <p className="font-semibold text-sand-50 text-sm">{service}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-sand-50/10">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-sand-50/8 rounded-xl shrink-0">
              <CalendarIcon className="h-4 w-4 text-turq-400" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-sand-50/40 uppercase tracking-wider">Date</p>
              <p className="font-semibold text-sand-50 text-xs sm:text-sm">{friendlyDate}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-sand-50/8 rounded-xl shrink-0">
              <Clock className="h-4 w-4 text-turq-400" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-sand-50/40 uppercase tracking-wider">Time</p>
              <p className="font-semibold text-sand-50 text-xs sm:text-sm">{friendlyTime}</p>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 bg-sand-50/8 rounded-xl shrink-0">
            <Stethoscope className="h-4 w-4 text-turq-400" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-sand-50/40 uppercase tracking-wider">Doctor & Room</p>
            <p className="font-medium text-sand-50 text-xs sm:text-sm">
              {dentistName || "Assigned Dentist"} · Room {room || "1"}
            </p>
          </div>
        </div>
      </div>

      {/* Staff Connected Next Steps */}
      {isStaffBooking ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-sand-50/45 text-center font-display">
            Connected Next Actions for Staff
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/dashboard/reception/checkin"
              className="flex items-center gap-3 p-3.5 rounded-xl border border-turq-500/30 bg-turq-500/10 hover:bg-turq-500/15 text-sand-50 transition-colors group"
            >
              <CalendarCheck className="h-5 w-5 text-turq-400 shrink-0" />
              <div className="text-left min-w-0 flex-1">
                <p className="text-xs font-semibold text-sand-50 group-hover:text-turq-300">
                  Open Check-in Desk
                </p>
                <p className="text-[10px] text-sand-50/50">
                  Step 2: Mark arrival when patient walks in
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-sand-50/40 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {patientId && (
              <Link
                href={`/dashboard/patients/${patientId}`}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-sand-50/15 bg-white/[0.03] hover:bg-white/[0.06] text-sand-50 transition-colors group"
              >
                <User className="h-5 w-5 text-blue-400 shrink-0" />
                <div className="text-left min-w-0 flex-1">
                  <p className="text-xs font-semibold text-sand-50 group-hover:text-blue-300">
                    Open Patient Record
                  </p>
                  <p className="text-[10px] text-sand-50/50">
                    View medical history, chart & contacts
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-sand-50/40 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}

            <Link
              href="/dashboard/book"
              className="flex items-center gap-3 p-3.5 rounded-xl border border-sand-50/15 bg-white/[0.03] hover:bg-white/[0.06] text-sand-50 transition-colors group"
            >
              <CalendarPlus className="h-5 w-5 text-sand-50/70 shrink-0" />
              <div className="text-left min-w-0 flex-1">
                <p className="text-xs font-semibold text-sand-50">
                  Book Another Visit
                </p>
                <p className="text-[10px] text-sand-50/50">
                  Schedule appointment for another patient
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-sand-50/40 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/dashboard"
              className="flex items-center gap-3 p-3.5 rounded-xl border border-sand-50/15 bg-white/[0.03] hover:bg-white/[0.06] text-sand-50 transition-colors group"
            >
              <LayoutDashboard className="h-5 w-5 text-purple-400 shrink-0" />
              <div className="text-left min-w-0 flex-1">
                <p className="text-xs font-semibold text-sand-50">
                  Practice Command Center
                </p>
                <p className="text-[10px] text-sand-50/50">
                  Return to clinic overview & pipeline
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-sand-50/40 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      ) : (
        /* Patient view */
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <span>Message Clinic on WhatsApp</span>
            </a>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-medium text-xs text-sand-50/80 border border-sand-50/15 hover:bg-sand-50/8 transition-colors"
            >
              Return to Dashboard
            </Link>
            <Link
              href="/dashboard/appointments"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-xs bg-turq-600 text-ink-950 hover:bg-turq-500 transition-colors flex items-center justify-center gap-2"
            >
              <span>View My Appointments</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

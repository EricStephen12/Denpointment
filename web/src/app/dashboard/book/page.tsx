import React from 'react';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isPatient, isReceptionist } from "@/lib/auth";
import { bookAppointment } from "@/app/actions/appointments";
import { getSiteContent } from "@/lib/site";
import { Calendar } from 'lucide-react';
import Link from "next/link";
import BookingCalendar from "@/components/dashboards/BookingCalendar";
import {
  addCalendarDays,
  getClinicDay,
  toDateKey,
  type CalendarDay,
} from "@/lib/clinic-date";

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Pre-compute availability for the next 3 months:
 * For every working day, check each hour against existing appointments
 * and dentist holidays to build a { "YYYY-MM-DD": [hours] } map.
 */
async function buildSlotMap(
  dentists: { dentistId: number }[],
  openHour: number,
  closeHour: number,
  workingDays: number[],
) {
  const today = getClinicDay();
  const endDay = addCalendarDays(today, 92);
  const rangeStart = new Date(Date.UTC(today.year, today.month - 1, today.day));
  const rangeEnd = new Date(Date.UTC(endDay.year, endDay.month - 1, endDay.day));

  // Fetch all appointments and holidays in the range at once
  const [allAppointments, allHolidays] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        year: { gte: today.year },
      },
      select: { year: true, month: true, day: true, hour: true, dId: true },
    }),
    prisma.holidayDate.findMany({
      where: {
        restDate: { gte: rangeStart, lte: rangeEnd },
      },
      select: { restDate: true, restingId: true },
    }),
  ]);

  // Build lookup maps
  const appointmentMap = new Map<string, Map<number, number>>();
  for (const app of allAppointments) {
    const key = toDateKey(app);
    if (!appointmentMap.has(key)) appointmentMap.set(key, new Map());
    const hourMap = appointmentMap.get(key)!;
    hourMap.set(app.hour, (hourMap.get(app.hour) || 0) + 1);
  }

  const holidayMap = new Map<string, Set<number>>();
  for (const h of allHolidays) {
    const d = h.restDate;
    // Holidays are date-only; read as UTC calendar day to avoid TZ drift.
    const key = toDateKey({
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate(),
    });
    if (!holidayMap.has(key)) holidayMap.set(key, new Set());
    holidayMap.get(key)!.add(h.restingId);
  }

  const slots: Record<string, number[]> = {};
  let cursor: CalendarDay = today;

  while (toDateKey(cursor) <= toDateKey(endDay)) {
    const weekday = new Date(Date.UTC(cursor.year, cursor.month - 1, cursor.day, 12)).getUTCDay();
    if (workingDays.includes(weekday)) {
      const key = toDateKey(cursor);

      const dentistsOnHoliday = holidayMap.get(key) || new Set<number>();
      const availableDentistCount = dentists.filter(
        (d) => !dentistsOnHoliday.has(d.dentistId),
      ).length;

      if (availableDentistCount > 0) {
        const hourMap = appointmentMap.get(key) || new Map<number, number>();
        const hours: number[] = [];

        for (let h = openHour; h < closeHour; h++) {
          const booked = hourMap.get(h) || 0;
          if (booked < availableDentistCount) {
            hours.push(h);
          }
        }

        if (hours.length > 0) {
          slots[key] = hours;
        }
      }
    }

    cursor = addCalendarDays(cursor, 1);
  }

  return slots;
}

export default async function BookAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>;
}) {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");

  const staffBooking = isReceptionist(dbUser);
  if (!isPatient(dbUser) && !staffBooking) {
    redirect("/dashboard");
  }

  const { patientId } = await searchParams;

  const [dentists, settings] = await Promise.all([
    prisma.dentist.findMany({ select: { dentistId: true } }),
    prisma.clinicSettings.findUnique({ where: { id: 1 } }),
  ]);

  const openHour = settings?.openHour ?? 8;
  const closeHour = settings?.closeHour ?? 18;
  const workingDays = settings?.workingDays ?? [1, 2, 3, 4, 5];
  const workingDayNames = workingDays
    .slice()
    .sort((a, b) => a - b)
    .map((d) => WEEKDAY_NAMES[d])
    .join(", ");

  const slots = await buildSlotMap(dentists, openHour, closeHour, workingDays);

  const patients = staffBooking
    ? (await prisma.patient.findMany({
        include: { person: true },
        orderBy: { person: { lastName: "asc" } },
      })).map((p) => ({
        patientId: p.patientId,
        name: `${p.person.firstName} ${p.person.lastName}`,
        email: p.person.email,
      }))
    : undefined;

  const site = await getSiteContent();

  // Patients must complete address + phone before they can book.
  let profileIncomplete = false;
  if (!staffBooking && isPatient(dbUser)) {
    const profile = await prisma.person.findUnique({
      where: { personId: dbUser.personId },
      include: { addresses: true, contacts: true },
    });
    profileIncomplete = !profile || profile.addresses.length === 0 || profile.contacts.length === 0;
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8 animate-fade-up">
        <p className="text-xs font-medium text-turq-400 uppercase tracking-widest mb-3">
          {staffBooking ? "Staff Booking" : "Your Next Visit"}
        </p>
        <h1 className="text-3xl md:text-4xl font-display text-sand-50 leading-tight">
          Book an Appointment
        </h1>
        <p className="mt-2 text-sand-50/50 text-sm">
          {staffBooking
            ? "Book a visit on behalf of a patient."
            : "Pick a day that works for you — we'll handle the rest."}
        </p>
        <p className="text-xs text-sand-50/30 mt-3">
          Open {openHour > 12 ? openHour - 12 : openHour}:00{openHour >= 12 ? " PM" : " AM"} –{" "}
          {closeHour > 12 ? closeHour - 12 : closeHour}:00{closeHour >= 12 ? " PM" : " AM"},{" "}
          {workingDayNames}.
        </p>
      </div>

      {profileIncomplete ? (
        <div className="dash-surface p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="dash-icon-badge">
              <Calendar className="h-5 w-5 text-turq-400" />
            </div>
            <div>
              <h2 className="text-lg font-display text-sand-50">Complete your profile first</h2>
              <p className="text-sm text-sand-50/50 mt-1">
                Add an address and a phone number so the clinic can reach you about your visit.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/profile/add-address"
              className="bg-turq-600 text-ink-950 py-2.5 px-4 rounded-lg font-semibold text-sm hover:bg-turq-500 transition-colors"
            >
              Add address
            </Link>
            <Link
              href="/dashboard/profile/add-phone"
              className="border border-sand-50/20 text-sand-50 py-2.5 px-4 rounded-lg font-semibold text-sm hover:bg-sand-50/8 transition-colors"
            >
              Add phone
            </Link>
          </div>
        </div>
      ) : dentists.length === 0 ? (
        <div className="dash-surface p-6 space-y-2">
          <h2 className="text-lg font-display text-sand-50">No dentists available</h2>
          <p className="text-sm text-sand-50/50">
            An admin needs to add at least one dentist under Dashboard → Staff before patients can book.
          </p>
        </div>
      ) : (
        <BookingCalendar
          slots={slots}
          workingDays={workingDays}
          openHour={openHour}
          closeHour={closeHour}
          clinicAddress={site.address}
          patientId={patientId}
          isStaffBooking={staffBooking}
          patients={patients}
          bookAction={bookAppointment}
        />
      )}
    </div>
  );
}


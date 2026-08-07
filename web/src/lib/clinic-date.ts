/** Clinic calendar timezone — Kubwa, Abuja (WAT, UTC+1). */
export const CLINIC_TIMEZONE = "Africa/Lagos";

export type CalendarDay = {
  year: number;
  month: number; // 1–12
  day: number;
};

function partValue(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): number {
  const value = parts.find((p) => p.type === type)?.value;
  if (!value) throw new Error(`Missing date part: ${type}`);
  return parseInt(value, 10);
}

/** Calendar Y/M/D in the clinic timezone. */
export function getClinicDay(date: Date = new Date()): CalendarDay {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CLINIC_TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);

  return {
    year: partValue(parts, "year"),
    month: partValue(parts, "month"),
    day: partValue(parts, "day"),
  };
}

/** Hour (0–23) in the clinic timezone. */
export function getClinicHour(date: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CLINIC_TIMEZONE,
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  return partValue(parts, "hour");
}

export function sameCalendarDay(a: CalendarDay, b: CalendarDay): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

/** Add days to a calendar date (month/year overflow safe). */
export function addCalendarDays(day: CalendarDay, delta: number): CalendarDay {
  const utc = new Date(Date.UTC(day.year, day.month - 1, day.day + delta));
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  };
}

export function compareCalendarDays(a: CalendarDay, b: CalendarDay): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

export function toDateKey(day: CalendarDay): string {
  const m = String(day.month).padStart(2, "0");
  const d = String(day.day).padStart(2, "0");
  return `${day.year}-${m}-${d}`;
}

/** Format a stored appointment date without timezone shifting the day. */
export function formatAppointmentDate(
  day: CalendarDay,
  options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  },
): string {
  return new Date(Date.UTC(day.year, day.month - 1, day.day)).toLocaleDateString("en-US", {
    ...options,
    timeZone: "UTC",
  });
}

/** "Today" / "Tomorrow" / full date — relative to the clinic clock. */
export function relativeAppointmentLabel(day: CalendarDay, now: Date = new Date()): string {
  const today = getClinicDay(now);
  const tomorrow = addCalendarDays(today, 1);
  if (sameCalendarDay(day, today)) return "Today";
  if (sameCalendarDay(day, tomorrow)) return "Tomorrow";
  return formatAppointmentDate(day, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/**
 * Whether an appointment slot is still upcoming on the clinic clock.
 * Stored `hour` is clinic-local wall time (not UTC).
 */
export function isAppointmentUpcoming(
  app: CalendarDay & { hour: number },
  now: Date = new Date(),
): boolean {
  const today = getClinicDay(now);
  const cmp = compareCalendarDays(app, today);
  if (cmp > 0) return true;
  if (cmp < 0) return false;
  return app.hour >= getClinicHour(now);
}

export function isAppointmentToday(
  app: CalendarDay,
  now: Date = new Date(),
): boolean {
  return sameCalendarDay(app, getClinicDay(now));
}

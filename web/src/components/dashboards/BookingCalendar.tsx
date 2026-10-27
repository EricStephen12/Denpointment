"use client";

import React, { useState, useMemo, useTransition } from "react";
import { ChevronLeft, ChevronRight, Clock, MapPin, Loader2, Tag, UserCheck, Stethoscope, Phone, FileText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatNaira } from "@/lib/currency";
import { compareCalendarDays, formatAppointmentDate, type CalendarDay } from "@/lib/clinic-date";

/* ── Types ── */
interface SlotMap {
  /** "YYYY-MM-DD" → array of available hours (e.g. [8,9,10,...]) */
  [dateKey: string]: number[];
}

export interface BookingService {
  serviceId: number;
  name: string;
  price: number;
}

interface BookingCalendarProps {
  /** Pre-computed available slots for the next N months */
  slots: SlotMap;
  clinicToday: CalendarDay;
  clinicAddress: string;
  /** For staff booking on behalf of a patient */
  patientId?: string;
  isStaffBooking?: boolean;
  patients?: { patientId: number; name: string; email: string }[];
  /** Available clinical services for selection */
  services?: BookingService[];
  /** Available dentists for preferred doctor selection */
  dentists?: { dentistId: number; name: string; roomNumber: string }[];
  /** Initial pre-selected service name (e.g. from price list click) */
  initialServiceName?: string;
  /** Existing contact phone if already on file */
  defaultPhone?: string;
  /** Server action to call on form submit */
  bookAction: (formData: FormData) => Promise<void>;
}

/* ── Helpers ── */
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function toDateKey(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function formatTime(h: number): string {
  const ampm = h >= 12 ? "PM" : "AM";
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}:00 ${ampm}`;
}

/** Clean up any redundant "Dr." or "Dentist" prefixes in provider names */
function formatDentistName(rawName: string): string {
  if (!rawName) return "";
  const clean = rawName.replace(/^(Dr\.?|Dentist)\s+/gi, "").trim();
  return clean ? `Dr. ${clean}` : rawName;
}

export default function BookingCalendar({
  slots,
  clinicToday,
  clinicAddress,
  patientId,
  isStaffBooking,
  patients,
  services = [],
  dentists = [],
  initialServiceName,
  defaultPhone,
  bookAction,
}: BookingCalendarProps) {
  const [viewYear, setViewYear] = useState(clinicToday.year);
  const [viewMonth, setViewMonth] = useState(clinicToday.month - 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState(patientId || "");
  const [selectedDentistId, setSelectedDentistId] = useState("");
  const [room, setRoom] = useState("");
  const [phone, setPhone] = useState(defaultPhone || "");

  // Find initial service matching name if provided
  const defaultServiceId = useMemo(() => {
    if (!services || services.length === 0) return "";
    if (initialServiceName) {
      const match = services.find(
        (s) =>
          s.name.toLowerCase() === initialServiceName.toLowerCase() ||
          s.name.toLowerCase().includes(initialServiceName.toLowerCase()) ||
          initialServiceName.toLowerCase().includes(s.name.toLowerCase()),
      );
      if (match) return match.serviceId.toString();
    }
    const consultation = services.find(
      (s) => s.name.toLowerCase() === "consultation",
    );
    return consultation ? consultation.serviceId.toString() : services[0].serviceId.toString();
  }, [services, initialServiceName]);

  const [selectedServiceId, setSelectedServiceId] = useState<string>(defaultServiceId);
  const selectedService = useMemo(
    () => services.find((s) => s.serviceId.toString() === selectedServiceId),
    [services, selectedServiceId],
  );

  const selectedDentist = useMemo(
    () => dentists.find((d) => d.dentistId.toString() === selectedDentistId),
    [dentists, selectedDentistId],
  );

  const [bookingNotes, setBookingNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Calendar grid computation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

    const cells: { day: number; month: number; year: number; isCurrentMonth: boolean }[] = [];

    // Previous month trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = viewMonth - 1;
      const y = m < 0 ? viewYear - 1 : viewYear;
      cells.push({ day: d, month: (m + 12) % 12, year: y, isCurrentMonth: false });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, month: viewMonth, year: viewYear, isCurrentMonth: true });
    }

    // Next month leading days (fill to 42 cells = 6 rows)
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const m = viewMonth + 1;
      const y = m > 11 ? viewYear + 1 : viewYear;
      cells.push({ day: d, month: m % 12, year: y, isCurrentMonth: false });
    }

    return cells;
  }, [viewYear, viewMonth]);

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Can't go before current month
  const canGoPrev =
    viewYear > clinicToday.year ||
    (viewYear === clinicToday.year && viewMonth > clinicToday.month - 1);

  // Available hours for selected date
  const availableHours = selectedDate ? (slots[selectedDate] || []) : [];

  // Friendly date label
  const selectedCalendarDay = selectedDate
    ? (() => {
        const [year, month, day] = selectedDate.split("-").map(Number);
        return { year, month, day };
      })()
    : null;
  const friendlyDate = selectedCalendarDay
    ? formatAppointmentDate(selectedCalendarDay, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const handleDayClick = (key: string) => {
    setSelectedDate(key);
    setSelectedHour(null);
  };

  const handleSubmit = () => {
    if (!selectedDate || selectedHour === null) return;
    if (isStaffBooking && !selectedPatientId) return;

    if (!isStaffBooking && !phone.trim()) {
      setError("Please enter your contact phone number to confirm your booking.");
      return;
    }

    const formData = new FormData();
    formData.set("date", selectedDate);
    formData.set("hour", selectedHour.toString());
    if (selectedServiceId) formData.set("serviceId", selectedServiceId);
    if (selectedDentistId) formData.set("dentistId", selectedDentistId);
    if (room) formData.set("room", room);
    if (bookingNotes.trim()) formData.set("notes", bookingNotes.trim());
    if (isStaffBooking && selectedPatientId) formData.set("patientId", selectedPatientId);
    if (!isStaffBooking && phone.trim()) formData.set("phone", phone.trim());

    setError(null);
    startTransition(async () => {
      try {
        await bookAction(formData);
      } catch (err) {
        if (
          typeof err === "object" &&
          err !== null &&
          "digest" in err &&
          typeof (err as { digest?: unknown }).digest === "string" &&
          String((err as { digest: string }).digest).startsWith("NEXT_REDIRECT")
        ) {
          throw err;
        }
        const message =
          err instanceof Error ? err.message : "Booking failed. Please try another slot.";
        setError(message);
      }
    });
  };

  const hasAnySlots = Object.keys(slots).length > 0;

  return (
    <div className="space-y-6">
      {!hasAnySlots && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-900/20 px-4 py-3 text-sm text-amber-200">
          No bookable slots currently available. Please check clinic schedule settings.
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-900/20 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* ── STEP 1: Clinical Procedure & Dentist Setup ── */}
      <div className="dash-card p-5 space-y-4">
        {/* Staff: patient selector */}
        {isStaffBooking && patients && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-turq-400 uppercase tracking-widest flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-turq-400" />
              Patient
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              style={{ colorScheme: "dark" }}
              className="input-premium !bg-ink-900 !text-sand-50"
            >
              <option value="" className="bg-ink-900 text-sand-50">Select a patient…</option>
              {patients.map((p) => (
                <option key={p.patientId} value={p.patientId} className="bg-ink-900 text-sand-50">
                  {p.name} ({p.email})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Procedure / Treatment Selector */}
        {services && services.length > 0 && (
          <div id="booking-procedure-selector" className="space-y-1.5 scroll-mt-20">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-turq-400 uppercase tracking-widest flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-turq-400" />
                Procedure
              </label>
              {selectedService && (
                <span className="text-xs font-display text-turq-300">
                  {formatNaira(selectedService.price)}
                </span>
              )}
            </div>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              style={{ colorScheme: "dark" }}
              className="input-premium !bg-ink-900 !text-sand-50 py-3 text-sm font-medium border-sand-50/15 focus:border-turq-400"
            >
              {services.map((s) => (
                <option key={s.serviceId} value={s.serviceId} className="bg-ink-900 text-sand-50 py-2">
                  {s.name} — {formatNaira(s.price)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Attending Dentist Selection (Single clear selection) */}
        {dentists && dentists.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-turq-400 uppercase tracking-widest flex items-center gap-1.5">
                <Stethoscope className="h-3.5 w-3.5 text-turq-400" />
                Dentist
              </label>
              <span className="text-xs text-sand-50/40">
                {isStaffBooking ? "Assign provider" : "Optional"}
              </span>
            </div>
            <div className={`grid grid-cols-1 ${isStaffBooking ? "sm:grid-cols-2" : ""} gap-3`}>
              <select
                value={selectedDentistId}
                onChange={(e) => {
                  setSelectedDentistId(e.target.value);
                  const d = dentists.find((dx) => dx.dentistId.toString() === e.target.value);
                  if (d) setRoom(d.roomNumber.toString());
                }}
                style={{ colorScheme: "dark" }}
                className="input-premium !bg-ink-900 !text-sand-50 py-3 text-sm font-medium border-sand-50/15 focus:border-turq-400"
              >
                <option value="" className="bg-ink-900 text-sand-50">
                  Any Available Dentist
                </option>
                {dentists.map((d) => (
                  <option key={d.dentistId} value={d.dentistId.toString()} className="bg-ink-900 text-sand-50">
                    {formatDentistName(d.name)} {d.roomNumber ? `(Room ${d.roomNumber})` : ""}
                  </option>
                ))}
              </select>

              {isStaffBooking && (
                <div>
                  <input
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="Operatory Room"
                    maxLength={10}
                    className="input-premium !bg-ink-900 !text-sand-50 py-3 text-sm font-medium border-sand-50/15 focus:border-turq-400 w-full"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── STEP 2: Calendar & Times ── */}
      <div className="dash-card overflow-hidden">
        {/* Month header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sand-50/8">
          <button
            onClick={goToPrevMonth}
            disabled={!canGoPrev}
            className="p-2 rounded-xl hover:bg-sand-50/8 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5 text-sand-50" />
          </button>
          <h2 className="font-display text-lg text-sand-50">
            {MONTHS[viewMonth]} {viewYear}
          </h2>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-xl hover:bg-sand-50/8 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5 text-sand-50" />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 px-4 pt-3 pb-1">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-[11px] font-semibold text-sand-50/30 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 px-4 pb-4">
          {calendarDays.map((cell, i) => {
            const key = toDateKey(cell.year, cell.month, cell.day);
            const cellDay = { year: cell.year, month: cell.month + 1, day: cell.day };
            const isToday = compareCalendarDays(cellDay, clinicToday) === 0;
            const isPast = compareCalendarDays(cellDay, clinicToday) < 0;
            const isAvailable = key in slots && slots[key].length > 0;
            const isSelected = key === selectedDate;
            const isDisabled = !cell.isCurrentMonth || isPast || !isAvailable;

            return (
              <button
                key={i}
                onClick={() => !isDisabled && handleDayClick(key)}
                disabled={isDisabled}
                className={`
                  relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-all duration-150
                  ${!cell.isCurrentMonth ? "text-sand-50/15" : ""}
                  ${cell.isCurrentMonth && isPast ? "text-sand-50/20 cursor-not-allowed" : ""}
                  ${cell.isCurrentMonth && !isPast && !isAvailable ? "text-sand-50/25 cursor-not-allowed" : ""}
                  ${cell.isCurrentMonth && !isPast && isAvailable && !isSelected
                    ? "text-sand-50/80 hover:bg-turq-600/20 hover:text-turq-300 cursor-pointer"
                    : ""
                  }
                  ${isSelected
                    ? "bg-turq-600 text-ink-950 font-semibold shadow-md shadow-turq-600/25 scale-105"
                    : ""
                  }
                  ${isToday && !isSelected ? "ring-1.5 ring-turq-400/50 ring-inset" : ""}
                `}
              >
                {cell.day}
                {cell.isCurrentMonth && isAvailable && !isPast && !isSelected && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-turq-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Time Slots & Summary ── */}
      <AnimatePresence mode="wait">
        {selectedDate && (
          <motion.div
            key={selectedDate}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Selected date label */}
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-sand-50/40 font-medium">
                Available Times on {friendlyDate}
              </p>
            </div>

            {availableHours.length > 0 ? (
              <div className="space-y-5">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {availableHours.map((h) => (
                    <button
                      key={h}
                      onClick={() => setSelectedHour(h)}
                      className={`
                        py-2.5 px-3 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer
                        ${selectedHour === h
                          ? "bg-turq-600 text-ink-950 font-semibold shadow-md shadow-turq-600/20 scale-[1.02]"
                          : "bg-sand-50/5 border border-sand-50/10 text-sand-50/70 hover:border-turq-400/40 hover:text-turq-300"
                        }
                      `}
                    >
                      {formatTime(h)}
                    </button>
                  ))}
                </div>

                {/* ── STEP 3: Single Clean Review Card & Submission ── */}
                <AnimatePresence>
                  {selectedHour !== null && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-sand-50/[0.03] border border-turq-500/25 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-sand-50/8 pb-3">
                          <p className="text-xs font-semibold text-turq-400 uppercase tracking-widest">
                            Appointment Summary
                          </p>
                          {selectedService && (
                            <span className="text-xs font-display text-turq-300">
                              {formatNaira(selectedService.price)}
                            </span>
                          )}
                        </div>

                        {/* Readable summary list — no duplicate dropdowns */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {selectedService && (
                            <div className="flex items-start gap-2.5">
                              <Tag className="h-4 w-4 text-turq-400 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-sand-50/40">Procedure</p>
                                <p className="font-medium text-sand-50">{selectedService.name}</p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-start gap-2.5">
                            <Clock className="h-4 w-4 text-turq-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sand-50/40">Schedule</p>
                              <p className="font-medium text-sand-50">{friendlyDate}</p>
                              <p className="text-sand-50/60 font-mono text-[11px]">{formatTime(selectedHour)}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2.5">
                            <Stethoscope className="h-4 w-4 text-turq-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sand-50/40">Attending Dentist</p>
                              <p className="font-medium text-sand-50">
                                {selectedDentist
                                  ? formatDentistName(selectedDentist.name)
                                  : "Any Available Dentist"}
                              </p>
                              {selectedDentist && (room || selectedDentist.roomNumber) && (
                                <p className="text-sand-50/60 text-[11px]">
                                  Operatory Room {room || selectedDentist.roomNumber}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-start gap-2.5">
                            <MapPin className="h-4 w-4 text-turq-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sand-50/40">Location</p>
                              <p className="font-medium text-sand-50 truncate max-w-[200px]" title={clinicAddress}>
                                {clinicAddress}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Optional notes */}
                        <div className="pt-2 border-t border-sand-50/8 space-y-1.5">
                          <label className="block text-xs uppercase tracking-wider text-sand-50/50 font-medium flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-sand-50/40" />
                            Notes for Clinic (Optional)
                          </label>
                          <input
                            type="text"
                            value={bookingNotes}
                            onChange={(e) => setBookingNotes(e.target.value)}
                            maxLength={250}
                            placeholder="e.g., toothache on upper left, routine clean, first-time patient"
                            className="w-full bg-sand-50/5 border border-sand-50/15 rounded-xl px-3.5 py-2 text-xs text-sand-50 placeholder:text-sand-50/30 focus:border-turq-400 focus:outline-none transition-colors"
                          />
                        </div>

                        {/* Patient phone if patient booking */}
                        {!isStaffBooking && (
                          <div className="pt-2 border-t border-sand-50/8 space-y-1.5">
                            <label className="block text-xs uppercase tracking-wider text-sand-50/70 font-medium flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 text-turq-400" />
                              Contact Phone
                            </label>
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="+234 801 234 5678"
                              required
                              className="w-full bg-sand-50/5 border border-sand-50/15 rounded-xl px-3.5 py-2 text-xs text-sand-50 placeholder:text-sand-50/30 focus:border-turq-400 focus:outline-none transition-colors"
                            />
                          </div>
                        )}

                        <button
                          onClick={handleSubmit}
                          disabled={isPending || (isStaffBooking && !selectedPatientId)}
                          className="w-full bg-turq-600 text-ink-950 py-3 rounded-xl font-medium text-xs hover:bg-turq-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-turq-600/20"
                        >
                          {isPending ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Confirming Booking…
                            </>
                          ) : (
                            "Confirm Appointment"
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="dash-card p-5 text-center">
                <p className="text-sand-50/40 text-xs">
                  No open appointment slots on this date. Please select another day.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


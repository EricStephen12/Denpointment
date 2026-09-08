"use client";

import React, { useState, useMemo, useTransition } from "react";
import { ChevronLeft, ChevronRight, Clock, MapPin, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatNaira } from "@/lib/currency";

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
  clinicAddress: string;
  /** For staff booking on behalf of a patient */
  patientId?: string;
  isStaffBooking?: boolean;
  patients?: { patientId: number; name: string; email: string }[];
  /** Available clinical services for selection */
  services?: BookingService[];
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

export default function BookingCalendar({
  slots,
  clinicAddress,
  patientId,
  isStaffBooking,
  patients,
  services = [],
  initialServiceName,
  defaultPhone,
  bookAction,
}: BookingCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState(patientId || "");
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
      (s) => s.name.toLowerCase() === "consultation"
    );
    return consultation ? consultation.serviceId.toString() : services[0].serviceId.toString();
  }, [services, initialServiceName]);

  const [selectedServiceId, setSelectedServiceId] = useState<string>(defaultServiceId);
  const selectedService = useMemo(
    () => services.find((s) => s.serviceId.toString() === selectedServiceId),
    [services, selectedServiceId],
  );

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
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  // Available hours for selected date
  const availableHours = selectedDate ? (slots[selectedDate] || []) : [];

  // Friendly date label
  const selectedDateObj = selectedDate ? new Date(selectedDate + "T00:00:00") : null;
  const friendlyDate = selectedDateObj
    ? selectedDateObj.toLocaleDateString("en-US", {
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
      setError("Please enter your phone number so we can confirm your appointment.");
      return;
    }

    const formData = new FormData();
    formData.set("date", selectedDate);
    formData.set("hour", selectedHour.toString());
    if (selectedServiceId) {
      formData.set("serviceId", selectedServiceId);
    }
    if (isStaffBooking && selectedPatientId) {
      formData.set("patientId", selectedPatientId);
    }
    if (!isStaffBooking && phone.trim()) {
      formData.set("phone", phone.trim());
    }

    setError(null);
    startTransition(async () => {
      try {
        await bookAction(formData);
      } catch (err) {
        // Next.js redirect() throws a special error — let it through.
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
    <div className="space-y-8">
      {!hasAnySlots && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-900/20 px-4 py-3 text-sm text-amber-200">
          No bookable slots right now. The clinic needs at least one dentist on staff
          (Dashboard → Staff), and open hours must include working days.
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-900/20 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Staff: patient selector */}
      {isStaffBooking && patients && (
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-turq-300 uppercase tracking-widest">
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
        <div id="booking-procedure-selector" className="space-y-2 scroll-mt-20">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-turq-300 uppercase tracking-widest">
              Procedure / Reason for Visit
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
            className="input-premium !bg-ink-900 !text-sand-50 py-3.5 text-sm font-medium border-sand-50/15 focus:border-turq-400"
          >
            {services.map((s) => (
              <option key={s.serviceId} value={s.serviceId} className="bg-ink-900 text-sand-50 py-2">
                {s.name} — {formatNaira(s.price)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ── Calendar ── */}
      <div className="dash-card overflow-hidden">
        {/* Month header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-sand-50/8">
          <button
            onClick={goToPrevMonth}
            disabled={!canGoPrev}
            className="p-2 rounded-xl hover:bg-sand-50/8 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5 text-sand-50" />
          </button>
          <h2 className="font-display text-xl text-sand-50">
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
        <div className="grid grid-cols-7 px-4 pt-4 pb-2">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-[11px] font-semibold text-sand-50/30 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 px-4 pb-5">
          {calendarDays.map((cell, i) => {
            const key = toDateKey(cell.year, cell.month, cell.day);
            const isToday =
              cell.day === today.getDate() &&
              cell.month === today.getMonth() &&
              cell.year === today.getFullYear();
            const isPast =
              new Date(cell.year, cell.month, cell.day) <
              new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const isAvailable = key in slots && slots[key].length > 0;
            const isSelected = key === selectedDate;
            const isDisabled = !cell.isCurrentMonth || isPast || !isAvailable;

            return (
              <button
                key={i}
                onClick={() => !isDisabled && handleDayClick(key)}
                disabled={isDisabled}
                className={`
                  relative aspect-square flex flex-col items-center justify-center rounded-2xl text-sm font-medium transition-all duration-200
                  ${!cell.isCurrentMonth ? "text-sand-50/15" : ""}
                  ${cell.isCurrentMonth && isPast ? "text-sand-50/20 cursor-not-allowed" : ""}
                  ${cell.isCurrentMonth && !isPast && !isAvailable ? "text-sand-50/25 cursor-not-allowed" : ""}
                  ${cell.isCurrentMonth && !isPast && isAvailable && !isSelected
                    ? "text-sand-50/80 hover:bg-turq-600/20 hover:text-turq-300 cursor-pointer"
                    : ""
                  }
                  ${isSelected
                    ? "bg-turq-600 text-ink-950 shadow-lg shadow-turq-600/25 scale-105"
                    : ""
                  }
                  ${isToday && !isSelected ? "ring-2 ring-turq-400/40 ring-inset" : ""}
                `}
              >
                {cell.day}
                {/* Availability dot */}
                {cell.isCurrentMonth && isAvailable && !isPast && !isSelected && (
                  <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-turq-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Time Slots ── */}
      <AnimatePresence mode="wait">
        {selectedDate && (
          <motion.div
            key={selectedDate}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {/* Selected date label */}
            <p className="text-sm font-medium text-sand-50/50 mb-4">
              {friendlyDate}
            </p>

            {availableHours.length > 0 ? (
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-medium text-sand-50/40 uppercase tracking-widest mb-3">
                    Available Times
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                    {availableHours.map((h) => (
                      <motion.button
                        key={h}
                        onClick={() => setSelectedHour(h)}
                        whileTap={{ scale: 0.96 }}
                        className={`
                          py-3 px-4 rounded-2xl text-sm font-medium transition-all duration-200 cursor-pointer
                          ${selectedHour === h
                            ? "bg-turq-600 text-ink-950 shadow-lg shadow-turq-600/25 scale-[1.03]"
                            : "bg-ink-900 border border-sand-50/10 text-sand-50/70 hover:border-turq-400/50 hover:text-turq-300 hover:shadow-sm"
                          }
                        `}
                      >
                        {formatTime(h)}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Booking summary + submit */}
                <AnimatePresence>
                  {selectedHour !== null && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-turq-600/10 border border-turq-600/20 rounded-2xl p-5 space-y-3">
                        <p className="text-xs font-medium text-turq-400 uppercase tracking-widest">
                          Booking Summary
                        </p>
                        {selectedService && (
                          <div className="flex items-start gap-3 pb-3 border-b border-sand-50/10">
                            <Sparkles className="h-4 w-4 text-turq-400 mt-0.5 shrink-0" />
                            <div className="flex-1 flex items-baseline justify-between gap-2">
                              <div>
                                <p className="text-xs uppercase tracking-wider text-sand-50/50">Procedure</p>
                                <p className="text-sm font-medium text-sand-50">{selectedService.name}</p>
                              </div>
                              <span className="text-sm font-display text-turq-300">
                                {formatNaira(selectedService.price)}
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          <Clock className="h-4 w-4 text-turq-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-sand-50">{friendlyDate}</p>
                            <p className="text-sm text-sand-50/50">{formatTime(selectedHour!)}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 text-turq-400 mt-0.5 shrink-0" />
                          <p className="text-sm text-sand-50/50">{clinicAddress}</p>
                        </div>

                        {!isStaffBooking && (
                          <div className="pt-3 border-t border-sand-50/10 space-y-1.5">
                            <label className="block text-xs uppercase tracking-wider text-sand-50/70 font-medium">
                              Contact Phone Number
                            </label>
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="+234 801 234 5678"
                              required
                              className="w-full bg-sand-50/5 border border-sand-50/15 rounded-xl px-4 py-2.5 text-sm text-sand-50 placeholder:text-sand-50/30 focus:border-turq-400 focus:outline-none transition-colors"
                            />
                            <p className="text-[11px] text-sand-50/40">
                              We&apos;ll send your booking confirmation & reminder to this number.
                            </p>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={handleSubmit}
                        disabled={isPending || (isStaffBooking && !selectedPatientId)}
                        className="mt-4 w-full bg-turq-600 text-ink-950 py-4 rounded-full font-medium text-sm hover:bg-turq-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Booking…
                          </>
                        ) : (
                          "Confirm Booking"
                        )}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="dash-card p-6 text-center">
                <p className="text-sand-50/40 text-sm">
                  No open slots on this day — try another date.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

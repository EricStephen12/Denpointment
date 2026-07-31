"use client";

import React, { useState, useMemo, useTransition } from "react";
import { ChevronLeft, ChevronRight, Clock, MapPin, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

/* ── Types ── */
interface SlotMap {
  /** "YYYY-MM-DD" → array of available hours (e.g. [8,9,10,...]) */
  [dateKey: string]: number[];
}

interface BookingCalendarProps {
  /** Pre-computed available slots for the next N months */
  slots: SlotMap;
  /** Clinic working days (0=Sun … 6=Sat) */
  workingDays: number[];
  openHour: number;
  closeHour: number;
  clinicAddress: string;
  /** For staff booking on behalf of a patient */
  patientId?: string;
  isStaffBooking?: boolean;
  patients?: { patientId: number; name: string; email: string }[];
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
  workingDays,
  openHour,
  closeHour,
  clinicAddress,
  patientId,
  isStaffBooking,
  patients,
  bookAction,
}: BookingCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState(patientId || "");
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

    const formData = new FormData();
    formData.set("date", selectedDate);
    formData.set("hour", selectedHour.toString());
    if (isStaffBooking && selectedPatientId) {
      formData.set("patientId", selectedPatientId);
    }

    startTransition(() => {
      bookAction(formData);
    });
  };

  return (
    <div className="space-y-8">
      {/* Staff: patient selector */}
      {isStaffBooking && patients && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-sand-50/60 tracking-wide">
            Patient
          </label>
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="input-premium"
          >
            <option value="">Select a patient…</option>
            {patients.map((p) => (
              <option key={p.patientId} value={p.patientId}>
                {p.name} ({p.email})
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

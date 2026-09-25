"use client";

import React, { useState, useTransition } from "react";
import { rescheduleAppointment } from "@/app/actions/appointments";
import { CalendarClock, X, Check, Loader2 } from "lucide-react";

type Props = {
  appointmentId: number;
  currentDate: string; // YYYY-MM-DD
  currentHour: number;
  openHour: number;
  closeHour: number;
};

export default function RescheduleModal({ appointmentId, currentDate, currentHour, openHour, closeHour }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const hours = Array.from({ length: closeHour - openHour }, (_, i) => openHour + i);

  function formatHour(h: number) {
    const ampm = h >= 12 ? "PM" : "AM";
    const d = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${d}:00 ${ampm}`;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("appointmentId", String(appointmentId));
    setError(null);
    startTransition(async () => {
      try {
        await rescheduleAppointment(fd);
        setSuccess(true);
        setTimeout(() => { setOpen(false); setSuccess(false); }, 800);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not reschedule.");
      }
    });
  }

  // Today's min date
  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); setError(null); }}
        className="inline-flex items-center gap-1.5 text-xs border border-sand-50/15 hover:border-turq-400/30 text-sand-50/50 hover:text-turq-400 px-3 py-1.5 rounded-lg transition-colors"
      >
        <CalendarClock className="h-3.5 w-3.5" /> Reschedule
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !pending && setOpen(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-sm bg-ink-900 border border-sand-50/15 rounded-2xl shadow-2xl p-6 animate-fade-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-display text-sand-50">Reschedule Appointment</h2>
              <button
                type="button"
                onClick={() => !pending && setOpen(false)}
                className="text-sand-50/40 hover:text-sand-50 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-sand-50/40 mb-1.5">New Date</label>
                <input
                  type="date"
                  name="date"
                  defaultValue={currentDate}
                  min={minDate}
                  required
                  className="dash-input w-full"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-sand-50/40 mb-1.5">New Time</label>
                <select name="hour" defaultValue={currentHour} required className="dash-input w-full">
                  {hours.map((h) => (
                    <option key={h} value={h}>{formatHour(h)}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={pending || success}
                className="w-full inline-flex items-center justify-center gap-2 bg-turq-600 hover:bg-turq-500 text-ink-950 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : success ? <Check className="h-4 w-4" /> : <CalendarClock className="h-4 w-4" />}
                {pending ? "Moving…" : success ? "Done!" : "Confirm Reschedule"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

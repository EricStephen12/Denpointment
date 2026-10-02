"use client";

import React, { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { reassignAppointment } from "@/app/actions/appointments";
import {
  UserCheck,
  DoorOpen,
  Calendar,
  Clock,
  X,
  Check,
  Loader2,
  AlertCircle,
  ArrowRightLeft,
} from "lucide-react";

export interface DentistOption {
  dentistId: number;
  name: string;
  defaultRoom: string;
}

interface Props {
  appointmentId: number;
  currentDentistId: number;
  currentDentistName: string;
  currentRoom: string;
  currentDate: string; // YYYY-MM-DD
  currentHour: number;
  patientName?: string;
  dentists: DentistOption[];
  openHour?: number;
  closeHour?: number;
  clinicToday?: string;
  buttonLabel?: string;
  compact?: boolean;
}

export default function ReassignAppointmentModal({
  appointmentId,
  currentDentistId,
  currentDentistName,
  currentRoom,
  currentDate,
  currentHour,
  patientName,
  dentists = [],
  openHour = 8,
  closeHour = 18,
  clinicToday,
  buttonLabel = "Reassign Doctor / Room",
  compact = false,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Form states
  const [selectedDentistId, setSelectedDentistId] = useState<number>(currentDentistId);
  const [selectedRoom, setSelectedRoom] = useState<string>(String(currentRoom));
  const [selectedDate, setSelectedDate] = useState<string>(currentDate);
  const [selectedHour, setSelectedHour] = useState<number>(currentHour);
  const [showReschedule, setShowReschedule] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // When opening, reset to current values
  const handleOpen = () => {
    setSelectedDentistId(currentDentistId);
    setSelectedRoom(String(currentRoom));
    setSelectedDate(currentDate);
    setSelectedHour(currentHour);
    setShowReschedule(false);
    setError(null);
    setSuccess(false);
    setOpen(true);
  };

  const handleDentistChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dId = parseInt(e.target.value, 10);
    setSelectedDentistId(dId);
    // Auto-suggest the new dentist's default room
    const targetDentist = dentists.find((d) => d.dentistId === dId);
    if (targetDentist && targetDentist.defaultRoom) {
      setSelectedRoom(String(targetDentist.defaultRoom));
    }
  };

  const hours = Array.from({ length: closeHour - openHour }, (_, i) => openHour + i);

  function formatHour(h: number) {
    const ampm = h >= 12 ? "PM" : "AM";
    const d = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${d}:00 ${ampm}`;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const fd = new FormData();
    fd.set("appointmentId", String(appointmentId));
    fd.set("dentistId", String(selectedDentistId));
    fd.set("room", String(selectedRoom));

    if (showReschedule) {
      fd.set("date", selectedDate);
      fd.set("hour", String(selectedHour));
    }

    startTransition(async () => {
      try {
        await reassignAppointment(fd);
        setSuccess(true);
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
          router.refresh();
        }, 600);
      } catch (err: any) {
        setError(err?.message || "Failed to reassign appointment.");
      }
    });
  };

  const modal = open ? (
    <div
      className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={() => !pending && setOpen(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md bg-ink-900 border border-sand-50/15 rounded-2xl shadow-2xl p-6 relative my-auto max-h-[90vh] flex flex-col overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-sand-50/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-turq-500/15 text-turq-400 border border-turq-500/25">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-sand-50 font-display">
                Assign Doctor &amp; Room
              </h2>
              <p className="text-xs text-sand-50/50 mt-0.5">
                {patientName ? `For ${patientName}` : "Update visit assignment"}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg text-sand-50/40 hover:text-sand-50 hover:bg-sand-50/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current status pill */}
        <div className="mt-4 p-3 rounded-xl bg-sand-50/5 border border-sand-50/10 text-xs flex items-center justify-between gap-2">
          <span className="text-sand-50/60">Current Assignment:</span>
          <span className="font-semibold text-sand-50">
            {currentDentistName} · <span className="text-turq-300">Room {currentRoom}</span>
          </span>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-3 p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-xs text-red-300 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 flex-1">
          {/* Doctor / Dentist Dropdown */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-sand-50/60 font-medium mb-1.5 flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5 text-turq-400" />
              Select Attending Doctor / Dentist
            </label>
            <select
              value={selectedDentistId}
              onChange={handleDentistChange}
              className="dash-input w-full font-medium"
              required
            >
              {dentists.map((d) => (
                <option key={d.dentistId} value={d.dentistId}>
                  Dr. {d.name} (Default Room {d.defaultRoom})
                </option>
              ))}
            </select>
          </div>

          {/* Room Number Selection */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-sand-50/60 font-medium mb-1.5 flex items-center gap-1.5">
              <DoorOpen className="h-3.5 w-3.5 text-turq-400" />
              Treatment Room
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="dash-input w-28 text-center font-bold text-turq-300"
                required
              />
              <div className="flex flex-wrap gap-1.5">
                {["1", "2", "3", "4", "5"].map((rm) => (
                  <button
                    key={rm}
                    type="button"
                    onClick={() => setSelectedRoom(rm)}
                    className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                      selectedRoom === rm
                        ? "bg-turq-600 text-ink-950 border-turq-500 font-bold"
                        : "border-sand-50/10 text-sand-50/60 hover:border-sand-50/30"
                    }`}
                  >
                    Room {rm}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-sand-50/40 mt-1">
              Patient will be directed to this clinical room upon check-in.
            </p>
          </div>

          {/* Optional Date & Time change */}
          <div className="pt-3 border-t border-sand-50/10">
            <button
              type="button"
              onClick={() => setShowReschedule(!showReschedule)}
              className="text-xs text-turq-400 hover:text-turq-300 font-medium flex items-center gap-1.5 transition-colors"
            >
              <Calendar className="h-3.5 w-3.5" />
              {showReschedule ? "Hide date & time change" : "Also move date or time slot?"}
            </button>

            {showReschedule && (
              <div className="mt-3 p-3.5 rounded-xl bg-black/40 border border-sand-50/10 space-y-3 animate-fade-up">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-sand-50/40 mb-1">
                    New Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    min={clinicToday}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="dash-input w-full text-xs"
                    required={showReschedule}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-sand-50/40 mb-1">
                    New Time Slot
                  </label>
                  <select
                    value={selectedHour}
                    onChange={(e) => setSelectedHour(parseInt(e.target.value, 10))}
                    className="dash-input w-full text-xs"
                    required={showReschedule}
                  >
                    {hours.map((h) => (
                      <option key={h} value={h}>
                        {formatHour(h)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-sand-50/10 shrink-0">
            <button
              type="button"
              disabled={pending}
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-sand-50/70 hover:text-sand-50 hover:bg-sand-50/10 border border-sand-50/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending || success}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-turq-600 hover:bg-turq-500 text-ink-950 shadow-lg shadow-turq-600/25 transition-all disabled:opacity-50 active:scale-[0.98] cursor-pointer"
            >
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Assigning…</span>
                </>
              ) : success ? (
                <>
                  <Check className="h-4 w-4 text-emerald-950" />
                  <span>Assigned!</span>
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4" />
                  <span>Confirm Assignment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        title="Change assigned doctor or treatment room"
        className={
          compact
            ? "inline-flex items-center gap-1 text-xs text-turq-400 hover:text-turq-300 font-medium px-2 py-1 rounded bg-turq-950/40 hover:bg-turq-900/50 border border-turq-500/20 transition-colors cursor-pointer"
            : "inline-flex items-center gap-1.5 text-xs text-turq-400 hover:text-turq-300 font-medium px-3 py-1.5 rounded-lg bg-turq-950/40 hover:bg-turq-900/50 border border-turq-500/25 transition-colors cursor-pointer"
        }
      >
        <ArrowRightLeft className="h-3.5 w-3.5" />
        <span>{buttonLabel}</span>
      </button>

      {mounted && modal && createPortal(modal, document.body)}
    </>
  );
}

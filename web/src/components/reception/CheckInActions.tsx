"use client";

import React, { useTransition, useState } from "react";
import { checkInAppointment, markNoShow, confirmAppointment } from "@/app/actions/appointments";
import { UserCheck, UserX, CheckCheck, Loader2 } from "lucide-react";

type Props = {
  appointmentId: number;
  status: string;
  confirmedAt: string | null;
};

export default function CheckInActions({ appointmentId, status, confirmedAt }: Props) {
  const [pending, startTransition] = useTransition();
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run(action: (fd: FormData) => Promise<void>, label: string) {
    const fd = new FormData();
    fd.set("appointmentId", String(appointmentId));
    setLastAction(label);
    setError(null);
    startTransition(async () => {
      try {
        await action(fd);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLastAction(null);
      }
    });
  }

  const isLoading = (label: string) => pending && lastAction === label;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {error && (
        <p className="w-full text-xs text-red-400">{error}</p>
      )}

      {/* Confirm — only when scheduled and not yet confirmed */}
      {status === "scheduled" && !confirmedAt && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(confirmAppointment, "confirm")}
          className="inline-flex items-center gap-1.5 text-xs border border-sand-50/20 hover:border-turq-400/40 text-sand-50/60 hover:text-turq-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoading("confirm") ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
          {isLoading("confirm") ? "Confirming…" : "Confirm"}
        </button>
      )}

      {/* Check In */}
      {(status === "scheduled" || status === "checked_in") && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(checkInAppointment, "checkin")}
          className="inline-flex items-center gap-1.5 text-xs bg-turq-600 hover:bg-turq-500 text-ink-950 px-3 py-1.5 rounded-lg font-semibold transition-colors disabled:opacity-50"
        >
          {isLoading("checkin") ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
          {isLoading("checkin") ? "Checking in…" : status === "checked_in" ? "Re-check In" : "Check In"}
        </button>
      )}

      {/* No Show */}
      {status === "scheduled" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(markNoShow, "noshow")}
          className="inline-flex items-center gap-1.5 text-xs border border-red-500/20 text-red-400/70 hover:text-red-400 hover:border-red-400/40 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoading("noshow") ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserX className="h-3.5 w-3.5" />}
          {isLoading("noshow") ? "Marking…" : "No-show"}
        </button>
      )}
    </div>
  );
}

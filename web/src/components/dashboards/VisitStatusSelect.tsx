"use client";

import React, { useState, useTransition } from "react";
import type { AppointmentStatus } from "@prisma/client";
import { setAppointmentStatus } from "@/app/actions/visit";
import { APPOINTMENT_STATUSES, statusMeta } from "@/lib/appointment-status";
import { Loader2 } from "lucide-react";

export default function VisitStatusSelect({
  appointmentId,
  status,
}: {
  appointmentId: number;
  status: AppointmentStatus;
}) {
  const [current, setCurrent] = useState<AppointmentStatus>(status);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as AppointmentStatus;
    const prev = current;
    setCurrent(next);
    setError(null);

    const fd = new FormData();
    fd.set("appointmentId", String(appointmentId));
    fd.set("status", next);

    startTransition(async () => {
      try {
        await setAppointmentStatus(fd);
      } catch (err) {
        setCurrent(prev); // revert on error
        setError(err instanceof Error ? err.message : "Could not update status.");
      }
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      {pending && <Loader2 className="h-3 w-3 animate-spin text-turq-400 shrink-0" />}
      <div>
        <select
          value={current}
          disabled={pending}
          onChange={handleChange}
          className={`dash-input !py-1 !px-2 !text-xs !w-auto transition-opacity ${
            pending ? "opacity-50" : ""
          } ${statusMeta(current).tone}`}
        >
          {APPOINTMENT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        {error && <p className="text-[10px] text-red-400 mt-0.5">{error}</p>}
      </div>
    </div>
  );
}

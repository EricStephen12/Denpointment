"use client";

import type { AppointmentStatus } from "@prisma/client";
import { setAppointmentStatus } from "@/app/actions/visit";
import { APPOINTMENT_STATUSES, statusMeta } from "@/lib/appointment-status";

export default function VisitStatusSelect({
  appointmentId,
  status,
}: {
  appointmentId: number;
  status: AppointmentStatus;
}) {
  return (
    <form action={setAppointmentStatus} className="flex items-center gap-2">
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <select
        name="status"
        defaultValue={status}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className={`dash-input !py-1 !px-2 !text-xs !w-auto ${statusMeta(status).tone}`}
      >
        {APPOINTMENT_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </form>
  );
}

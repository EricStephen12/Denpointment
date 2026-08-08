import type { AppointmentStatus } from "@prisma/client";

export const APPOINTMENT_STATUSES: {
  value: AppointmentStatus;
  label: string;
  tone: string;
}[] = [
  { value: "scheduled", label: "Scheduled", tone: "bg-sand-50/8 text-sand-50/50" },
  { value: "checked_in", label: "Checked in", tone: "bg-amber-900/40 text-amber-300" },
  { value: "in_chair", label: "In chair", tone: "bg-sky-900/40 text-sky-300" },
  { value: "completed", label: "Completed", tone: "bg-turq-600/20 text-turq-300" },
  { value: "no_show", label: "No-show", tone: "bg-red-900/40 text-red-300" },
  { value: "cancelled", label: "Cancelled", tone: "bg-sand-50/10 text-sand-50/40" },
];

export function parseAppointmentStatus(raw: string): AppointmentStatus | null {
  return APPOINTMENT_STATUSES.find((s) => s.value === raw)?.value ?? null;
}

export function statusMeta(status: AppointmentStatus) {
  return APPOINTMENT_STATUSES.find((s) => s.value === status) ?? APPOINTMENT_STATUSES[0];
}

/** Keep legacy `checkedIn` boolean aligned with workflow status. */
export function checkedInFromStatus(status: AppointmentStatus): boolean {
  return status === "checked_in" || status === "in_chair" || status === "completed";
}

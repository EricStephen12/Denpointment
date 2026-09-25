"use client";

import React, { useTransition, useState } from "react";
import { sendManualReminder } from "@/app/actions/appointments";
import { Bell, Check, Loader2 } from "lucide-react";

export default function SendReminderButton({
  appointmentId,
  alreadySent,
}: {
  appointmentId: number;
  alreadySent: boolean;
}) {
  const [pending, start] = useTransition();
  const [sent, setSent]  = useState(alreadySent);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    const fd = new FormData();
    fd.set("appointmentId", String(appointmentId));
    setError(null);
    start(async () => {
      try {
        await sendManualReminder(fd);
        setSent(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed.");
      }
    });
  }

  if (sent && !pending) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-turq-400/60 px-2 py-1.5">
        <Check className="h-3.5 w-3.5" /> Reminder sent
      </span>
    );
  }

  return (
    <div className="flex flex-col items-start">
      <button
        type="button"
        disabled={pending}
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 text-xs border border-sand-50/15 hover:border-turq-400/30 text-sand-50/40 hover:text-turq-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
        {pending ? "Sending…" : "Send Reminder"}
      </button>
      {error && <p className="text-[10px] text-red-400 mt-0.5">{error}</p>}
    </div>
  );
}

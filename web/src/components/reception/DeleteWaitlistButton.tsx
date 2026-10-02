"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteWaitlistEntry } from "@/app/actions/appointments";
import { Trash2, Loader2 } from "lucide-react";

export default function DeleteWaitlistButton({
  waitlistId,
  patientName,
}: {
  waitlistId: number;
  patientName?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const msg = patientName
      ? `Permanently remove ${patientName} from the waiting list?`
      : "Permanently delete this waiting-list entry?";

    if (!window.confirm(msg)) {
      return;
    }

    const formData = new FormData();
    formData.set("waitlistId", String(waitlistId));

    startTransition(async () => {
      try {
        await deleteWaitlistEntry(formData);
        router.refresh();
      } catch (err: any) {
        alert(err?.message || "Failed to remove entry from waitlist.");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      aria-label="Delete waiting-list entry"
      title={isPending ? "Deleting from waitlist..." : "Delete waiting-list entry"}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/20 text-red-300 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin text-red-400" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </button>
  );
}
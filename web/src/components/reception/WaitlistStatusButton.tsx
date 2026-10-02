"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateWaitlistStatus } from "@/app/actions/appointments";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function WaitlistStatusButton({
  waitlistId,
  status,
}: {
  waitlistId: number;
  status: "booked" | "expired";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleUpdate = () => {
    const formData = new FormData();
    formData.set("waitlistId", String(waitlistId));
    formData.set("status", status);

    startTransition(async () => {
      try {
        await updateWaitlistStatus(formData);
        router.refresh();
      } catch (err: any) {
        alert(err?.message || "Failed to update status.");
      }
    });
  };

  if (status === "booked") {
    return (
      <button
        type="button"
        disabled={isPending}
        onClick={handleUpdate}
        className="inline-flex items-center gap-1 text-xs border border-turq-500/20 text-turq-400/70 hover:text-turq-400 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
      >
        {isPending ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Updating...</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Booked</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleUpdate}
      className="inline-flex items-center gap-1 text-xs text-sand-50/30 hover:text-red-400 transition-colors px-2 py-1.5 disabled:opacity-50 cursor-pointer"
    >
      {isPending ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-red-400" />
          <span>Expiring...</span>
        </>
      ) : (
        <>
          <XCircle className="h-3.5 w-3.5" />
          <span>Mark expired</span>
        </>
      )}
    </button>
  );
}

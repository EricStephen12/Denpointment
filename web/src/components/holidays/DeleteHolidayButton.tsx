"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteHoliday } from "@/app/actions/holidays";
import { Trash2, Loader2 } from "lucide-react";

export default function DeleteHolidayButton({
  holidayId,
  dateLabel,
}: {
  holidayId: number;
  dateLabel?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const msg = dateLabel
      ? `Remove holiday block on ${dateLabel}?`
      : "Remove this holiday block?";

    if (!window.confirm(msg)) {
      return;
    }

    const formData = new FormData();
    formData.set("holidayId", String(holidayId));

    startTransition(async () => {
      try {
        await deleteHoliday(formData);
        router.refresh();
      } catch (err: any) {
        alert(err?.message || "Failed to remove holiday.");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-medium disabled:opacity-50 cursor-pointer transition-colors"
    >
      {isPending ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin text-red-400" />
          <span>Deleting...</span>
        </>
      ) : (
        <>
          <Trash2 className="h-3 w-3" />
          <span>Delete</span>
        </>
      )}
    </button>
  );
}

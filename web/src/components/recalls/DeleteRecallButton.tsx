"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteRecall } from "@/app/actions/clinical-care";
import { Trash2, Loader2 } from "lucide-react";

export default function DeleteRecallButton({
  recallId,
  patientName,
  reason,
}: {
  recallId: number;
  patientName?: string;
  reason?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const prompt = patientName
      ? `Permanently delete recall "${reason || "Follow-up"}" for ${patientName}?`
      : "Permanently delete this recall?";

    if (!window.confirm(prompt)) return;

    const formData = new FormData();
    formData.set("recallId", String(recallId));

    startTransition(async () => {
      try {
        await deleteRecall(formData);
        router.refresh();
      } catch (err: any) {
        alert(err?.message || "Failed to delete recall.");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      aria-label="Delete recall"
      title={isPending ? "Deleting recall..." : "Delete recall"}
      className="inline-flex items-center gap-1 text-xs text-sand-50/40 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50 cursor-pointer"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-red-400" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

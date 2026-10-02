"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteLabCase } from "@/app/actions/clinical-care";
import { Trash2, Loader2 } from "lucide-react";

export default function DeleteLabCaseButton({
  labCaseId,
  caseTitle,
}: {
  labCaseId: number;
  caseTitle?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const msg = caseTitle
      ? `Permanently delete lab case "${caseTitle}"? This cannot be undone.`
      : "Delete this lab case? This cannot be undone.";

    if (!window.confirm(msg)) {
      return;
    }

    const formData = new FormData();
    formData.set("labCaseId", String(labCaseId));

    startTransition(async () => {
      try {
        await deleteLabCase(formData);
        router.refresh();
      } catch (err: any) {
        alert(err?.message || "Failed to delete lab case.");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      aria-label="Delete lab case"
      title={isPending ? "Deleting lab case..." : "Delete lab case"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/20 text-red-300 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin text-red-400" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </button>
  );
}
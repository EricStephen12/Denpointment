"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { deleteTreatmentProcedure } from "@/app/actions/billing";

interface DeleteTreatmentProcedureButtonProps {
  treatmentId: number;
  treatmentName: string;
}

export default function DeleteTreatmentProcedureButton({
  treatmentId,
  treatmentName,
}: DeleteTreatmentProcedureButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Remove "${treatmentName}" from this bill?`)) {
      return;
    }

    const formData = new FormData();
    formData.set("treatmentId", String(treatmentId));

    startTransition(async () => {
      try {
        await deleteTreatmentProcedure(formData);
        router.refresh();
      } catch (err: any) {
        alert(err?.message || "Failed to remove procedure.");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      title={`Remove ${treatmentName} from this bill`}
      className="p-1 rounded text-sand-50/30 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="h-3 w-3 animate-spin text-red-400" />
      ) : (
        <Trash2 className="h-3 w-3" />
      )}
    </button>
  );
}

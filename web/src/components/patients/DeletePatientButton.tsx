"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, X, Loader2 } from "lucide-react";
import { deletePatient } from "@/app/actions/patients";

interface DeletePatientButtonProps {
  patientId: number;
  patientName: string;
  variant?: "button" | "icon" | "table";
  redirectAfterDelete?: boolean;
}

export default function DeletePatientButton({
  patientId,
  patientName,
  variant = "button",
  redirectAfterDelete = false,
}: DeletePatientButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setConfirmName("");
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isPending) return;
    setIsOpen(false);
    setError(null);
  };

  const handleDelete = () => {
    setError(null);
    const formData = new FormData();
    formData.set("patientId", String(patientId));

    startTransition(async () => {
      try {
        await deletePatient(formData);
        setIsOpen(false);
        if (redirectAfterDelete) {
          router.push("/dashboard/patients");
        } else {
          router.refresh();
        }
      } catch (err: any) {
        setError(err?.message || "Failed to delete patient record.");
      }
    });
  };

  return (
    <>
      {variant === "button" && (
        <button
          type="button"
          onClick={handleOpen}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 border border-red-500/20 px-3.5 py-2 rounded-xl transition-all"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete Patient</span>
        </button>
      )}

      {variant === "table" && (
        <button
          type="button"
          onClick={handleOpen}
          title={`Delete ${patientName}`}
          className="inline-flex items-center gap-1 text-xs text-sand-50/40 hover:text-red-400 font-medium transition-colors p-1 rounded hover:bg-red-950/20"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Delete</span>
        </button>
      )}

      {variant === "icon" && (
        <button
          type="button"
          onClick={handleOpen}
          title={`Delete ${patientName}`}
          className="p-2 text-sand-50/40 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}

      {/* Confirmation Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={handleClose}
        >
          <div
            className="w-full max-w-md bg-ink-900 border border-red-500/30 rounded-2xl shadow-2xl p-6 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-sand-50/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-500/15 text-red-400 border border-red-500/25">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-sand-50 font-display">
                    Delete Patient Record
                  </h2>
                  <p className="text-xs text-red-400/80 mt-0.5 font-medium">
                    Permanent and Irreversible
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={handleClose}
                className="p-1 rounded-lg text-sand-50/40 hover:text-sand-50 hover:bg-sand-50/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mt-4 p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-xs text-red-300">
                {error}
              </div>
            )}

            {/* Content */}
            <div className="py-4 space-y-3">
              <p className="text-xs text-sand-50/70 leading-relaxed">
                Are you sure you want to completely remove{" "}
                <span className="font-semibold text-sand-50">{patientName}</span> from the practice database?
              </p>
              <div className="p-3.5 rounded-xl bg-black/40 border border-sand-50/10 text-[11px] text-sand-50/60 space-y-1.5">
                <div className="font-semibold text-sand-50/80 uppercase tracking-wider text-[10px]">
                  What will be removed:
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-sand-50/50">
                  <li>Appointment history &amp; schedule slots</li>
                  <li>Clinical treatments, notes &amp; prescriptions</li>
                  <li>2D dental chart tooth findings</li>
                  <li>Billing transactions &amp; insurance claims</li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-sand-50/10">
              <button
                type="button"
                disabled={isPending}
                onClick={handleClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-sand-50/70 hover:text-sand-50 hover:bg-sand-50/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleDelete}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30 transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Record</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

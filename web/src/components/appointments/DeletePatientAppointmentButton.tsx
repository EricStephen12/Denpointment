"use client";

import React, { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, X, Loader2 } from "lucide-react";
import { deletePatientOwnAppointment } from "@/app/actions/billing";

interface DeletePatientAppointmentButtonProps {
  appointmentId: number;
  title?: string;
  label?: string;
  className?: string;
  compact?: boolean;
}

export default function DeletePatientAppointmentButton({
  appointmentId,
  title,
  label = "Delete Appointment",
  className,
  compact = false,
}: DeletePatientAppointmentButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
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
    formData.set("appointmentId", String(appointmentId));

    startTransition(async () => {
      try {
        await deletePatientOwnAppointment(formData);
        setIsOpen(false);
        router.refresh();
      } catch (err: any) {
        setError(err?.message || "Failed to delete appointment.");
      }
    });
  };

  const modalContent = isOpen ? (
    <div
      className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={handleClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="w-full max-w-md bg-ink-900 border border-red-500/40 rounded-2xl shadow-2xl p-6 relative my-auto max-h-[90vh] flex flex-col overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-sand-50/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/15 text-red-400 border border-red-500/25">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-sand-50 font-display">
                Delete Appointment
              </h2>
              <p className="text-xs text-red-400/90 mt-0.5 font-medium">
                Remove from your schedule
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={handleClose}
            className="p-1.5 rounded-lg text-sand-50/40 hover:text-sand-50 hover:bg-sand-50/10 transition-colors"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="py-4 space-y-3.5 flex-1">
          <p className="text-xs text-sand-50/80 leading-relaxed">
            Are you sure you want to permanently delete this appointment record{title ? ` (${title})` : ""}?
          </p>

          <div className="p-3.5 rounded-xl bg-black/50 border border-sand-50/10 text-xs space-y-1.5 text-sand-50/70">
            <p className="text-red-400/90 font-medium text-[11px]">
              ⚠️ This will completely remove this visit from your appointments list.
            </p>
            <p className="text-[11px] text-sand-50/50">
              Any treatments, notes, or schedule bookings linked to this visit will be deleted.
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-300 font-medium">
            👉 Click <strong>"Confirm &amp; Delete Appointment"</strong> below to proceed.
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-sand-50/10 shrink-0">
          <button
            type="button"
            disabled={isPending}
            onClick={handleClose}
            className="px-4 py-2.5 rounded-xl text-xs font-medium text-sand-50/70 hover:text-sand-50 hover:bg-sand-50/10 border border-sand-50/10 transition-colors"
          >
            Cancel (Keep)
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-all disabled:opacity-50 active:scale-[0.98] cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>Confirm &amp; Delete Appointment</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const defaultClasses = compact
    ? "inline-flex items-center gap-1.5 text-xs font-medium text-sand-50/40 hover:text-red-400 transition-colors cursor-pointer"
    : "inline-flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-300 transition-colors cursor-pointer px-2.5 py-1.5 rounded-lg border border-red-500/20 bg-red-950/20 hover:bg-red-950/40";

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        title="Delete this appointment"
        className={className || defaultClasses}
      >
        <Trash2 className="h-3.5 w-3.5 shrink-0" />
        <span>{label}</span>
      </button>

      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}

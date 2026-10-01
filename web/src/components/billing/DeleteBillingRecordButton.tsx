"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, X, Loader2 } from "lucide-react";
import { deleteBillingRecord } from "@/app/actions/billing";
import { formatNaira } from "@/lib/currency";

interface DeleteBillingRecordButtonProps {
  appointmentId: number;
  patientName: string;
  totalCharge: number;
  totalPaid: number;
}

export default function DeleteBillingRecordButton({
  appointmentId,
  patientName,
  totalCharge,
  totalPaid,
}: DeleteBillingRecordButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
        await deleteBillingRecord(formData);
        setIsOpen(false);
        router.refresh();
      } catch (err: any) {
        setError(err?.message || "Failed to delete billing record.");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        title="Delete this entire billing record"
        className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-medium px-2.5 py-1.5 rounded-lg border border-red-500/20 bg-red-950/20 hover:bg-red-950/40 transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Delete Bill</span>
      </button>

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
                    Delete Billing Record
                  </h2>
                  <p className="text-xs text-red-400/80 mt-0.5 font-medium">
                    Permanent Removal from Practice Ledger
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
                Are you sure you want to permanently delete this billing record for{" "}
                <span className="font-semibold text-sand-50">{patientName}</span>?
              </p>
              <div className="p-3.5 rounded-xl bg-black/40 border border-sand-50/10 text-xs space-y-2">
                <div className="flex justify-between text-sand-50/60">
                  <span>Visit Total:</span>
                  <span className="font-semibold text-sand-50">{formatNaira(totalCharge)}</span>
                </div>
                {totalPaid > 0 && (
                  <div className="flex justify-between text-sand-50/60">
                    <span>Recorded Payments:</span>
                    <span className="font-semibold text-emerald-400">{formatNaira(totalPaid)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-sand-50/10 text-[11px] text-red-400/80">
                  ⚠️ Deleting this billing record will completely erase the visit appointment, all linked clinical procedures on this bill, and any recorded payments.
                </div>
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
                    <span>Deleting Bill...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Billing Record</span>
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

"use client";

import React, { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AlertTriangle, X, Loader2, CheckCircle2 } from "lucide-react";
import { writeOffPatientBalance } from "@/app/actions/billing";
import { formatNaira } from "@/lib/currency";

interface WriteOffBalanceButtonProps {
  patientId: number;
  patientName: string;
  outstanding: number;
}

export default function WriteOffBalanceButton({
  patientId,
  patientName,
  outstanding,
}: WriteOffBalanceButtonProps) {
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

  const handleConfirm = () => {
    setError(null);
    const formData = new FormData();
    formData.set("patientId", String(patientId));

    startTransition(async () => {
      try {
        await writeOffPatientBalance(formData);
        setIsOpen(false);
        router.refresh();
      } catch (err: any) {
        setError(err?.message || "Failed to write off balance.");
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
        className="w-full max-w-md bg-ink-900 border border-amber-500/40 rounded-2xl shadow-2xl p-6 relative my-auto max-h-[90vh] flex flex-col overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-sand-50/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-sand-50 font-display">
                Write Off Outstanding Balance
              </h2>
              <p className="text-xs text-amber-400/90 mt-0.5 font-medium">
                Management Courtesy Waiver
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
            Are you sure you want to write off the outstanding balance for{" "}
            <span className="font-semibold text-sand-50">{patientName}</span>?
          </p>

          <div className="p-3.5 rounded-xl bg-black/50 border border-sand-50/10 text-xs space-y-2">
            <div className="flex justify-between text-sand-50/70">
              <span>Patient Name:</span>
              <span className="font-medium text-sand-50">{patientName}</span>
            </div>
            <div className="flex justify-between text-sand-50/70">
              <span>Outstanding to Zero Out:</span>
              <span className="font-bold text-red-400">{formatNaira(outstanding)}</span>
            </div>
            <div className="pt-2 border-t border-sand-50/10 text-[11px] text-amber-300/80 leading-normal">
              💡 This records a formal waiver in the practice ledger. All clinical visit history and treatment records remain completely intact.
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-300 font-medium">
            👉 Click <strong>"Confirm &amp; Write Off"</strong> below to clear this balance.
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
            Cancel
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={handleConfirm}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-600 hover:bg-amber-500 text-ink-950 shadow-lg shadow-amber-600/30 transition-all disabled:opacity-50 active:scale-[0.98] cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Writing Off...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirm &amp; Write Off</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        title="Zero out balance via waiver"
        className="text-xs text-red-400/80 hover:text-red-300 px-2.5 py-1 rounded bg-red-900/20 hover:bg-red-900/30 border border-red-500/20 transition-colors cursor-pointer"
      >
        Write Off
      </button>

      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}

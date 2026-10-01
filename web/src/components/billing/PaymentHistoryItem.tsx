"use client";

import React, { useState, useTransition } from "react";
import { formatNaira } from "@/lib/currency";
import { voidPayment, deletePayment } from "@/app/actions/billing";
import { Ban, X, Trash2 } from "lucide-react";

type PaymentProps = {
  payment: {
    paymentId: number;
    amount: number;
    method: string;
    type: string;
    reference: string | null;
    notes: string | null;
  };
  isVoided?: boolean;
};

export default function PaymentHistoryItem({ payment, isVoided = false }: PaymentProps) {
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openVoidModal, setOpenVoidModal] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isRefund = payment.type === "refund";
  const isPayment = payment.type === "payment";
  const isVoidRecord = payment.notes?.startsWith("VOID of payment");

  function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("paymentId", String(payment.paymentId));

    setError(null);
    startTransition(async () => {
      try {
        await deletePayment(fd);
        setOpenDeleteModal(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete payment.");
      }
    });
  }

  function handleVoid(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("paymentId", String(payment.paymentId));
    if (reason.trim()) fd.set("reason", reason.trim());

    setError(null);
    startTransition(async () => {
      try {
        await voidPayment(fd);
        setOpenVoidModal(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to void payment.");
      }
    });
  }

  return (
    <div className="space-y-1.5 py-1.5 border-b border-sand-50/5 last:border-0">
      <div className="flex items-center justify-between text-xs flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="text-sand-50/70 capitalize font-medium">
            {payment.type} · {payment.method.replace("_", " ")}
            {payment.reference ? ` · Ref: ${payment.reference}` : ""}
          </span>
          {isVoidRecord && (
            <span className="text-[10px] bg-red-950/60 border border-red-500/30 text-red-400 px-1.5 py-0.2 rounded font-medium">
              Void Counter-Entry
            </span>
          )}
          {isVoided && (
            <span className="text-[10px] bg-sand-50/10 border border-sand-50/20 text-sand-50/50 px-1.5 py-0.2 rounded font-medium">
              Voided
            </span>
          )}
          {payment.notes && !isVoidRecord && (
            <span className="text-sand-50/40 text-[11px] italic truncate max-w-xs">
              ({payment.notes})
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span
            className={`font-semibold tabular-nums ${
              isRefund
                ? "text-red-400"
                : isVoided
                ? "text-sand-50/30 line-through"
                : "text-turq-400"
            }`}
          >
            {isRefund ? "-" : "+"}{formatNaira(payment.amount)}
          </span>

          <div className="flex items-center gap-1.5">
            {/* Delete button (Permanently removes record) */}
            <button
              type="button"
              onClick={() => {
                setOpenDeleteModal((v) => !v);
                setOpenVoidModal(false);
                setError(null);
              }}
              className="text-[11px] text-sand-50/40 hover:text-red-400 transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-red-500/10"
              title="Permanently delete this payment entry"
            >
              <Trash2 className="h-3 w-3" />
              <span>Delete</span>
            </button>

            {/* Void button (Accounting counter-entry) */}
            {isPayment && !isVoided && (
              <button
                type="button"
                onClick={() => {
                  setOpenVoidModal((v) => !v);
                  setOpenDeleteModal(false);
                  setError(null);
                }}
                className="text-[11px] text-sand-50/40 hover:text-amber-400 transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-amber-500/10"
                title="Void this payment (preserves audit trail)"
              >
                <Ban className="h-3 w-3" />
                <span>Void</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {openDeleteModal && (
        <form
          onSubmit={handleDelete}
          className="mt-2 p-3 rounded-xl border border-red-500/30 bg-red-950/25 space-y-2.5 text-xs animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <span className="text-red-400 font-semibold text-xs flex items-center gap-1.5">
              <Trash2 className="h-3.5 w-3.5" />
              Permanently Delete Payment #{payment.paymentId}?
            </span>
            <button
              type="button"
              onClick={() => setOpenDeleteModal(false)}
              className="text-sand-50/40 hover:text-sand-50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-sand-50/70 leading-relaxed">
            This will <strong className="text-red-300">permanently remove</strong> this {payment.type} entry of{" "}
            <strong className="text-sand-50">{formatNaira(payment.amount)}</strong> ({payment.method}) from the clinic ledger. Any associated procedures will reopen if the balance becomes unpaid.
          </p>
          {error && <p className="text-red-400 text-[11px] font-medium">{error}</p>}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setOpenDeleteModal(false)}
              className="px-2.5 py-1 text-xs text-sand-50/60 hover:text-sand-50 rounded-lg hover:bg-white/[0.05]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="px-3 py-1 text-xs bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
            >
              {pending ? "Deleting…" : "Confirm Delete"}
            </button>
          </div>
        </form>
      )}

      {/* Void Modal */}
      {openVoidModal && (
        <form
          onSubmit={handleVoid}
          className="mt-2 p-3 rounded-xl border border-amber-500/30 bg-amber-950/20 space-y-2.5 text-xs animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <span className="text-amber-400 font-semibold text-xs flex items-center gap-1.5">
              <Ban className="h-3.5 w-3.5" />
              Void Payment #{payment.paymentId} ({formatNaira(payment.amount)})
            </span>
            <button
              type="button"
              onClick={() => setOpenVoidModal(false)}
              className="text-sand-50/40 hover:text-sand-50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-sand-50/60">
            This will record an offsetting refund counter-entry to neutralize the payment while preserving the audit history.
          </p>
          <div>
            <label className="text-[10px] text-sand-50/40 block mb-0.5">Void Reason (optional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Accidental double entry / wrong patient"
              className="dash-input text-xs"
              maxLength={200}
            />
          </div>
          {error && <p className="text-red-400 text-[11px] font-medium">{error}</p>}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setOpenVoidModal(false)}
              className="px-2.5 py-1 text-xs text-sand-50/60 hover:text-sand-50 rounded-lg hover:bg-white/[0.05]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="px-3 py-1 text-xs bg-amber-600 hover:bg-amber-500 text-ink-950 font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {pending ? "Voiding…" : "Confirm Void"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

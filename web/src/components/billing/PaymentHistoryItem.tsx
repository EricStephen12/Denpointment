"use client";

import React, { useState, useTransition } from "react";
import { formatNaira } from "@/lib/currency";
import { voidPayment } from "@/app/actions/billing";
import { Ban, X, Check } from "lucide-react";

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
  const [openVoidModal, setOpenVoidModal] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isRefund = payment.type === "refund";
  const isPayment = payment.type === "payment";
  const isVoidRecord = payment.notes?.startsWith("VOID of payment");

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
    <div className="space-y-1 py-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sand-50/60 capitalize">
            {payment.type} · {payment.method.replace("_", " ")}
            {payment.reference ? ` · ${payment.reference}` : ""}
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
            <span className="text-sand-50/40 text-[11px] italic">
              ({payment.notes})
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`font-medium ${
              isRefund
                ? "text-red-400"
                : isVoided
                ? "text-sand-50/30 line-through"
                : "text-turq-400"
            }`}
          >
            {isRefund ? "-" : "+"}{formatNaira(payment.amount)}
          </span>

          {isPayment && !isVoided && (
            <button
              type="button"
              onClick={() => {
                setOpenVoidModal((v) => !v);
                setError(null);
              }}
              className="text-[11px] text-sand-50/40 hover:text-red-400 transition-colors flex items-center gap-0.5"
              title="Void this payment entry"
            >
              <Ban className="h-3 w-3" />
              Void
            </button>
          )}
        </div>
      </div>

      {openVoidModal && (
        <form
          onSubmit={handleVoid}
          className="mt-2 p-2.5 rounded-lg border border-red-500/30 bg-red-950/20 space-y-2 text-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-red-400 font-semibold text-[11px]">
              Confirm Void of Payment #{payment.paymentId} ({formatNaira(payment.amount)})
            </span>
            <button
              type="button"
              onClick={() => setOpenVoidModal(false)}
              className="text-sand-50/40 hover:text-sand-50"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <p className="text-[11px] text-sand-50/60">
            This will record an offsetting refund to neutralize this entry and reopen any associated procedures.
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
          {error && <p className="text-red-400 text-[11px]">{error}</p>}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setOpenVoidModal(false)}
              className="px-2 py-1 text-[11px] text-sand-50/50 hover:text-sand-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="px-2.5 py-1 text-[11px] bg-red-700 hover:bg-red-600 text-white font-semibold rounded transition-colors disabled:opacity-50"
            >
              {pending ? "Voiding…" : "Confirm Void"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

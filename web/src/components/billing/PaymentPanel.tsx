"use client";

import React, { useState, useTransition } from "react";
import { formatNaira } from "@/lib/currency";
import { CreditCard, Tag, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";

type Insurance = { insuranceId: number; provider: string; policyNumber: string };

type Props = {
  appointmentId: number;
  outstanding: number;
  insurance: Insurance[];
  recordPaymentAction:  (fd: FormData) => Promise<void>;
  recordDiscountAction: (fd: FormData) => Promise<void>;
  recordRefundAction:   (fd: FormData) => Promise<void>;
};

type PanelTab = "payment" | "discount" | "refund";

export default function PaymentPanel({
  appointmentId,
  outstanding,
  insurance,
  recordPaymentAction,
  recordDiscountAction,
  recordRefundAction,
}: Props) {
  const [open, setOpen]     = useState(false);
  const [tab, setTab]       = useState<PanelTab>("payment");
  const [pending, start]    = useTransition();
  const [error, setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function submit(action: (fd: FormData) => Promise<void>, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("appointmentId", String(appointmentId));
    setError(null);
    start(async () => {
      try {
        await action(fd);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
        (e.target as HTMLFormElement).reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save.");
      }
    });
  }

  return (
    <div className="border-t border-sand-50/8">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-5 py-3 text-xs text-sand-50/50 hover:text-turq-400 transition-colors"
      >
        <span className="flex items-center gap-2">
          <CreditCard className="h-3.5 w-3.5" />
          Record payment · <span className="text-red-400">{formatNaira(outstanding)} outstanding</span>
        </span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1">
            {(["payment","discount","refund"] as PanelTab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTab(t); setError(null); }}
                className={`text-xs px-3 py-1.5 rounded-lg capitalize transition-colors ${tab === t ? "bg-turq-600 text-ink-950 font-semibold" : "text-sand-50/50 hover:bg-sand-50/8"}`}
              >
                {t === "payment" ? <><CreditCard className="h-3 w-3 inline mr-1" />Payment</> : t === "discount" ? <><Tag className="h-3 w-3 inline mr-1" />Discount</> : <><RotateCcw className="h-3 w-3 inline mr-1" />Refund</>}
              </button>
            ))}
          </div>

          {error && <p className="text-xs text-red-400 bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
          {success && <p className="text-xs text-turq-400">Saved ✓</p>}

          {tab === "payment" && (
            <form onSubmit={(e) => submit(recordPaymentAction, e)} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-sand-50/40 mb-1">Amount (₦)</label>
                <input type="number" name="amount" required min={1} defaultValue={outstanding} className="dash-input" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-sand-50/40 mb-1">Method</label>
                <select name="method" required className="dash-input">
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="insurance">Insurance</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-sand-50/40 mb-1">Reference</label>
                <input type="text" name="reference" maxLength={100} placeholder="Optional" className="dash-input" />
              </div>
              <div className="flex items-end">
                <button type="submit" disabled={pending} className="w-full bg-turq-600 hover:bg-turq-500 text-ink-950 py-2 px-3 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
                  {pending ? "Saving…" : "Record"}
                </button>
              </div>
            </form>
          )}

          {tab === "discount" && (
            <form onSubmit={(e) => submit(recordDiscountAction, e)} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-sand-50/40 mb-1">Amount (₦)</label>
                <input type="number" name="amount" required min={1} className="dash-input" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-sand-50/40 mb-1">Type</label>
                <select name="type" className="dash-input">
                  <option value="discount">Discount</option>
                  <option value="waiver">Waiver</option>
                </select>
              </div>
              <div className="sm:col-span-1">
                <label className="block text-[10px] uppercase tracking-wider text-sand-50/40 mb-1">Reason</label>
                <input type="text" name="notes" maxLength={300} placeholder="Reason (optional)" className="dash-input" />
              </div>
              <div className="flex items-end">
                <button type="submit" disabled={pending} className="w-full bg-amber-600 hover:bg-amber-500 text-ink-950 py-2 px-3 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
                  {pending ? "Saving…" : "Apply"}
                </button>
              </div>
            </form>
          )}

          {tab === "refund" && (
            <form onSubmit={(e) => submit(recordRefundAction, e)} className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-sand-50/40 mb-1">Refund Amount (₦)</label>
                <input type="number" name="amount" required min={1} className="dash-input" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-sand-50/40 mb-1">Reason</label>
                <input type="text" name="notes" maxLength={300} placeholder="Reason" className="dash-input" />
              </div>
              <div className="flex items-end">
                <button type="submit" disabled={pending} className="w-full bg-red-700 hover:bg-red-600 text-white py-2 px-3 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
                  {pending ? "Saving…" : "Refund"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

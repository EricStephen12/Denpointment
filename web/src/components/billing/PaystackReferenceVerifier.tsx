"use client";

import React, { useState, useTransition } from "react";
import { Search, Loader2, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { reconcilePaystackPaymentAction } from "@/app/actions/billing";
import { useRouter } from "next/navigation";

export default function PaystackReferenceVerifier() {
  const router = useRouter();
  const [reference, setReference] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reference.trim()) return;

    setResult(null);
    startTransition(async () => {
      try {
        const res = await reconcilePaystackPaymentAction(reference.trim());
        setResult(res);
        if (res.success) {
          router.refresh();
        }
      } catch (err) {
        setResult({
          success: false,
          message: err instanceof Error ? err.message : "Lookup failed",
        });
      }
    });
  }

  return (
    <div className="p-4 rounded-2xl bg-ink-950/80 border border-sand-50/10 shadow-lg space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-sand-50 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-turq-400" />
          <span>Direct Paystack Verification (Webhook-Free)</span>
        </span>
        <span className="text-[10px] text-sand-50/40">
          Queries Paystack API directly
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-2">
        <input
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Paste Paystack transaction ref (e.g. treatment-12-1793...)"
          className="w-full sm:flex-1 px-3 py-2 bg-ink-900 border border-sand-50/15 rounded-xl text-xs text-sand-50 placeholder:text-sand-50/30 focus:outline-none focus:border-turq-500 font-mono"
        />
        <button
          type="submit"
          disabled={pending || !reference.trim()}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-turq-500 hover:bg-turq-400 text-ink-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-turq-500/10 disabled:opacity-50 cursor-pointer shrink-0"
        >
          {pending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Search className="w-3.5 h-3.5" />
          )}
          <span>{pending ? "Verifying…" : "Verify Reference"}</span>
        </button>
      </form>

      {result && (
        <div
          className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
            result.success
              ? "bg-emerald-950/50 border border-emerald-500/30 text-emerald-300"
              : "bg-red-950/50 border border-red-500/30 text-red-300"
          }`}
        >
          {result.success ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          )}
          <span>{result.message}</span>
        </div>
      )}
    </div>
  );
}

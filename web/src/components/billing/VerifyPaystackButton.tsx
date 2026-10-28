"use client";

import React, { useState, useTransition } from "react";
import { RefreshCw, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { reconcilePaystackPaymentAction } from "@/app/actions/billing";
import { useRouter } from "next/navigation";

type Props = {
  reference: string;
  label?: string;
  compact?: boolean;
};

export default function VerifyPaystackButton({
  reference,
  label = "Verify Paystack",
  compact = false,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  function handleVerify() {
    setFeedback(null);
    startTransition(async () => {
      try {
        const res = await reconcilePaystackPaymentAction(reference);
        if (res.success) {
          setFeedback({ type: "success", message: res.message });
          router.refresh();
        } else {
          setFeedback({ type: "error", message: res.message });
        }
      } catch (err) {
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "Verification failed",
        });
      }
    });
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleVerify}
        disabled={pending}
        title={`Query Paystack API directly for ref: ${reference}`}
        className={`inline-flex items-center gap-1.5 font-medium transition-all cursor-pointer rounded-lg disabled:opacity-50 ${
          compact
            ? "px-2 py-1 text-[11px] bg-sand-50/10 hover:bg-turq-500/20 text-turq-300 border border-sand-50/15 hover:border-turq-500/40"
            : "px-3 py-1.5 text-xs bg-turq-500/10 hover:bg-turq-500/20 text-turq-300 border border-turq-500/30 font-semibold"
        }`}
      >
        {pending ? (
          <Loader2 className="w-3 h-3 animate-spin text-turq-400" />
        ) : (
          <RefreshCw className="w-3 h-3 text-turq-400" />
        )}
        <span>{pending ? "Checking Paystack…" : label}</span>
      </button>

      {feedback && (
        <span
          className={`text-[10px] flex items-center gap-1 font-medium px-2 py-0.5 rounded ${
            feedback.type === "success"
              ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
              : "bg-red-950/60 text-red-300 border border-red-500/30"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
          ) : (
            <AlertCircle className="w-2.5 h-2.5 shrink-0" />
          )}
          <span className="truncate max-w-[200px]">{feedback.message}</span>
        </span>
      )}
    </div>
  );
}

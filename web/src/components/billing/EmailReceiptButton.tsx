"use client";

import React, { useState, useTransition } from "react";
import { Mail, Check, Loader2 } from "lucide-react";
import { emailReceiptAction } from "@/app/actions/billing";

interface EmailReceiptButtonProps {
  appointmentId: number;
  patientEmail?: string | null;
}

export default function EmailReceiptButton({
  appointmentId,
  patientEmail,
}: EmailReceiptButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = () => {
    if (!patientEmail) {
      alert("This patient does not have an email address on file.");
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.set("appointmentId", String(appointmentId));

    startTransition(async () => {
      try {
        await emailReceiptAction(formData);
        setSent(true);
        setTimeout(() => setSent(false), 4000);
      } catch (err: any) {
        setError(err?.message || "Failed to send receipt email.");
        alert(err?.message || "Failed to send receipt email.");
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleSend}
      disabled={isPending || !patientEmail}
      title={
        !patientEmail
          ? "No email address on file for this patient"
          : sent
          ? "Receipt email sent!"
          : "Email receipt to patient"
      }
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        sent
          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
          : "bg-turq-500/10 text-turq-300 hover:text-turq-200 border-turq-500/25 hover:bg-turq-500/20"
      }`}
    >
      {isPending ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Sending...</span>
        </>
      ) : sent ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-400" />
          <span>Receipt Emailed!</span>
        </>
      ) : (
        <>
          <Mail className="h-3.5 w-3.5" />
          <span>Email Receipt</span>
        </>
      )}
    </button>
  );
}

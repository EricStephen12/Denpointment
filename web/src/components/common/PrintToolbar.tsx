"use client";

import React from "react";
import { Printer, ArrowLeft } from "lucide-react";

import EmailReceiptButton from "@/components/billing/EmailReceiptButton";

interface PrintToolbarProps {
  title: string;
  appointmentId?: number;
  patientEmail?: string | null;
}

export default function PrintToolbar({ title, appointmentId, patientEmail }: PrintToolbarProps) {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleBack = () => {
    if (typeof window !== "undefined") {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = "/dashboard";
      }
    }
  };

  return (
    <div className="print:hidden fixed top-0 inset-x-0 bg-ink-950 border-b border-sand-50/10 px-6 py-3 flex items-center justify-between z-50">
      <span className="text-sm text-sand-50/60 font-medium truncate max-w-md">
        {title}
      </span>
      <div className="flex items-center gap-3">
        {appointmentId && (
          <EmailReceiptButton
            appointmentId={appointmentId}
            patientEmail={patientEmail}
          />
        )}
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 bg-turq-600 hover:bg-turq-500 text-ink-950 text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-sm"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print / Save PDF</span>
        </button>
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1 text-xs text-sand-50/50 hover:text-sand-50 px-3 py-2 transition-colors cursor-pointer rounded-lg hover:bg-sand-50/5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back</span>
        </button>
      </div>
    </div>
  );
}

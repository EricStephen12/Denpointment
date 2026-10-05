"use client";

import React, { useState } from "react";
import { Printer, ArrowLeft, Receipt } from "lucide-react";

import EmailReceiptButton from "@/components/billing/EmailReceiptButton";

interface PrintToolbarProps {
  title: string;
  appointmentId?: number;
  patientEmail?: string | null;
}

export default function PrintToolbar({ title, appointmentId, patientEmail }: PrintToolbarProps) {
  const [receiptMode, setReceiptMode] = useState(false);

  const handlePrintA4 = () => {
    if (typeof window !== "undefined") {
      // Ensure we are in A4 mode before printing
      document.documentElement.removeAttribute("data-receipt-mode");
      window.print();
    }
  };

  const handlePrintReceipt = () => {
    if (typeof window !== "undefined") {
      // Switch to 80mm receipt mode, then print
      document.documentElement.setAttribute("data-receipt-mode", "true");
      setReceiptMode(true);
      // Small timeout to allow React to re-render the receipt layout
      setTimeout(() => {
        window.print();
        // After printing dialog closes, restore A4 mode
        window.addEventListener(
          "afterprint",
          () => {
            document.documentElement.removeAttribute("data-receipt-mode");
            setReceiptMode(false);
          },
          { once: true }
        );
      }, 150);
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
        {/* 80mm Thermal Receipt */}
        <button
          type="button"
          onClick={handlePrintReceipt}
          className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-ink-950 text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-sm"
        >
          <Receipt className="h-3.5 w-3.5" />
          <span>Print Receipt</span>
        </button>
        {/* A4 / Full Invoice */}
        <button
          type="button"
          onClick={handlePrintA4}
          className="inline-flex items-center gap-1.5 bg-turq-600 hover:bg-turq-500 text-ink-950 text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-sm"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Print Invoice</span>
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

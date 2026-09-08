"use client";

import React from "react";
import { Printer } from "lucide-react";

export default function PrintScheduleButton({ title }: { title?: string }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      title="Print Today's Schedule for Clipboard"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sand-50/10 hover:bg-sand-50/15 text-sand-50 border border-sand-50/15 transition-all shadow-sm print:hidden"
    >
      <Printer className="h-3.5 w-3.5 text-turq-400" />
      <span>{title || "Print Day Sheet"}</span>
    </button>
  );
}

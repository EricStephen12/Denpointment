"use client";

import React from "react";
import { updateLabCaseStatus } from "@/app/actions/clinical-care";

export default function LabStatusSelect({
  labCaseId,
  status,
  statusOrder,
}: {
  labCaseId: number;
  status: string;
  statusOrder: string[];
}) {
  return (
    <form action={updateLabCaseStatus}>
      <input type="hidden" name="labCaseId" value={labCaseId} />
      <label className="sr-only" htmlFor={`lab-status-${labCaseId}`}>Case status</label>
      <select
        id={`lab-status-${labCaseId}`}
        name="status"
        defaultValue={status}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="dash-input text-xs py-1 w-auto"
      >
        {statusOrder.map((s) => (
          <option key={s} value={s}>{s.replace("_", " ")}</option>
        ))}
      </select>
    </form>
  );
}
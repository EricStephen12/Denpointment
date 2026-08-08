"use client";

import { useMemo, useState } from "react";

export type RxDraft = {
  name: string;
  dose: string;
  frequency: string;
  duration: string;
  instructions: string;
};

const emptyRow = (): RxDraft => ({
  name: "",
  dose: "",
  frequency: "",
  duration: "",
  instructions: "",
});

/** Hidden JSON field `prescriptions` for the treatment form. */
export default function PrescriptionFields() {
  const [rows, setRows] = useState<RxDraft[]>([emptyRow()]);

  const payload = useMemo(
    () =>
      JSON.stringify(
        rows
          .map((r) => ({
            name: r.name.trim(),
            dose: r.dose.trim(),
            frequency: r.frequency.trim(),
            duration: r.duration.trim(),
            instructions: r.instructions.trim(),
          }))
          .filter((r) => r.name.length > 0),
      ),
    [rows],
  );

  return (
    <div className="sm:col-span-2 space-y-3">
      <input type="hidden" name="prescriptions" value={payload} />
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-sand-50/50">Prescriptions</label>
        <button
          type="button"
          onClick={() => setRows((prev) => [...prev, emptyRow()])}
          className="text-xs text-turq-400 hover:text-turq-300"
        >
          + Add medicine
        </button>
      </div>
      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-lg border border-sand-50/10">
          <input
            value={row.name}
            onChange={(e) =>
              setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, name: e.target.value } : r)))
            }
            placeholder="Medicine name"
            maxLength={80}
            className="dash-input sm:col-span-2"
          />
          <input
            value={row.dose}
            onChange={(e) =>
              setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, dose: e.target.value } : r)))
            }
            placeholder="Dose (e.g. 500mg)"
            maxLength={40}
            className="dash-input"
          />
          <input
            value={row.frequency}
            onChange={(e) =>
              setRows((prev) =>
                prev.map((r, idx) => (idx === i ? { ...r, frequency: e.target.value } : r)),
              )
            }
            placeholder="Frequency (e.g. 3x daily)"
            maxLength={40}
            className="dash-input"
          />
          <input
            value={row.duration}
            onChange={(e) =>
              setRows((prev) =>
                prev.map((r, idx) => (idx === i ? { ...r, duration: e.target.value } : r)),
              )
            }
            placeholder="Duration (e.g. 5 days)"
            maxLength={40}
            className="dash-input"
          />
          <input
            value={row.instructions}
            onChange={(e) =>
              setRows((prev) =>
                prev.map((r, idx) => (idx === i ? { ...r, instructions: e.target.value } : r)),
              )
            }
            placeholder="Instructions (optional)"
            maxLength={200}
            className="dash-input"
          />
          {rows.length > 1 && (
            <button
              type="button"
              onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
              className="text-xs text-sand-50/40 hover:text-red-300 sm:col-span-2 text-left"
            >
              Remove
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

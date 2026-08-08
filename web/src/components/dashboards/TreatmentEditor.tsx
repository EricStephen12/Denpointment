"use client";

import { useState, useTransition } from "react";
import { deleteTreatment, updateTreatment } from "@/app/actions/treatments";
import { formatNaira } from "@/lib/currency";

export type EditableTreatment = {
  treatmentId: number;
  action: string;
  complaint: string;
  description: string | null;
  toothNumber: number | null;
  charge: number;
  paid: boolean;
};

type Props = {
  treatment: EditableTreatment;
};

export default function TreatmentEditor({ treatment }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (treatment.paid) {
    return (
      <span className="text-xs text-sand-50/35">
        {formatNaira(treatment.charge)} · paid
      </span>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-sand-50/70">
          {treatment.toothNumber != null && (
            <span className="text-turq-300 mr-1">#{treatment.toothNumber}</span>
          )}
          {treatment.action} — {formatNaira(treatment.charge)}
        </span>
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            setError(null);
          }}
          className="text-xs text-turq-400 hover:text-turq-300"
        >
          {open ? "Close" : "Edit"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!confirm("Delete this unpaid procedure?")) return;
            const fd = new FormData();
            fd.set("treatmentId", String(treatment.treatmentId));
            setError(null);
            startTransition(async () => {
              try {
                await deleteTreatment(fd);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Delete failed.");
              }
            });
          }}
          className="text-xs text-red-400/80 hover:text-red-300 disabled:opacity-60"
        >
          Delete
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {open && (
        <form
          className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-sand-50/10 rounded-lg p-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            fd.set("treatmentId", String(treatment.treatmentId));
            setError(null);
            startTransition(async () => {
              try {
                await updateTreatment(fd);
                setOpen(false);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Update failed.");
              }
            });
          }}
        >
          <div>
            <label className="block text-[10px] text-sand-50/40 mb-0.5">Complaint</label>
            <input
              name="complaint"
              required
              maxLength={200}
              defaultValue={treatment.complaint}
              className="dash-input"
            />
          </div>
          <div>
            <label className="block text-[10px] text-sand-50/40 mb-0.5">Action</label>
            <input
              name="action"
              required
              maxLength={200}
              defaultValue={treatment.action}
              className="dash-input"
            />
          </div>
          <div>
            <label className="block text-[10px] text-sand-50/40 mb-0.5">Tooth</label>
            <input
              name="toothNumber"
              type="number"
              min={11}
              max={85}
              defaultValue={treatment.toothNumber ?? ""}
              className="dash-input"
            />
          </div>
          <div>
            <label className="block text-[10px] text-sand-50/40 mb-0.5">Charge (₦)</label>
            <input
              name="charge"
              type="number"
              min={0}
              required
              defaultValue={treatment.charge}
              className="dash-input"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[10px] text-sand-50/40 mb-0.5">Notes</label>
            <textarea
              name="description"
              rows={2}
              maxLength={4000}
              defaultValue={treatment.description ?? ""}
              className="dash-input resize-y"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={pending}
              className="bg-turq-600 text-ink-950 py-1.5 px-3 rounded-lg text-xs font-semibold disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

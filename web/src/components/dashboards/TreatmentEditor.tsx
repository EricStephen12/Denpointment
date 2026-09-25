"use client";

import { useState, useTransition } from "react";
import {
  deleteTreatment,
  updateTreatment,
  updateMedicine,
  deleteMedicine,
  addMedicineToTreatment,
} from "@/app/actions/treatments";
import { formatNaira } from "@/lib/currency";
import { Pill, Trash2, Pencil, Plus, X } from "lucide-react";

export type EditableMedicine = {
  medicineId: number;
  medicineName: string;
  dose: string | null;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
};

export type EditableTreatment = {
  treatmentId: number;
  action: string;
  complaint: string;
  description: string | null;
  toothNumber: number | null;
  charge: number;
  paid: boolean;
  medicines?: EditableMedicine[];
};

type Props = {
  treatment: EditableTreatment;
};

export default function TreatmentEditor({ treatment }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // State for editing a specific medicine
  const [editingMedId, setEditingMedId] = useState<number | null>(null);
  // State for adding a new medicine
  const [showAddMed, setShowAddMed] = useState(false);

  if (treatment.paid) {
    return (
      <span className="text-xs text-sand-50/35">
        {formatNaira(treatment.charge)} · paid
      </span>
    );
  }

  function handleSaveMedicine(medicineId: number, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("medicineId", String(medicineId));
    setError(null);
    startTransition(async () => {
      try {
        await updateMedicine(fd);
        setEditingMedId(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update prescription.");
      }
    });
  }

  function handleDeleteMedicine(medicineId: number) {
    if (!confirm("Remove this prescription?")) return;
    const fd = new FormData();
    fd.set("medicineId", String(medicineId));
    setError(null);
    startTransition(async () => {
      try {
        await deleteMedicine(fd);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete prescription.");
      }
    });
  }

  function handleAddMedicine(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("treatmentId", String(treatment.treatmentId));
    setError(null);
    startTransition(async () => {
      try {
        await addMedicineToTreatment(fd);
        setShowAddMed(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add prescription.");
      }
    });
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
          className="text-xs text-turq-400 hover:text-turq-300 font-medium"
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
          className="text-xs text-red-400/80 hover:text-red-300 disabled:opacity-60 font-medium"
        >
          Delete
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {open && (
        <div className="border border-sand-50/10 rounded-lg p-3 space-y-4 bg-sand-900/40">
          {/* Procedure Details Form */}
          <form
            className="grid grid-cols-1 sm:grid-cols-2 gap-2"
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
              <label className="block text-[10px] text-sand-50/40 mb-0.5">Tooth (FDI #)</label>
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
              <label className="block text-[10px] text-sand-50/40 mb-0.5">Clinical Notes</label>
              <textarea
                name="description"
                rows={2}
                maxLength={4000}
                defaultValue={treatment.description ?? ""}
                className="dash-input resize-y"
              />
            </div>
            <div className="sm:col-span-2 flex items-center justify-between pt-1">
              <button
                type="submit"
                disabled={pending}
                className="bg-turq-600 text-ink-950 py-1.5 px-3 rounded-lg text-xs font-semibold disabled:opacity-60 hover:bg-turq-500 transition-colors"
              >
                {pending ? "Saving…" : "Save Procedure"}
              </button>
            </div>
          </form>

          {/* Prescriptions (Medicine) Management */}
          <div className="border-t border-sand-50/10 pt-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-sand-50/80">
                <Pill className="h-3.5 w-3.5 text-turq-400" />
                <span>Prescriptions ({treatment.medicines?.length ?? 0})</span>
              </div>
              {!showAddMed && (
                <button
                  type="button"
                  onClick={() => setShowAddMed(true)}
                  className="inline-flex items-center gap-1 text-[11px] text-turq-400 hover:text-turq-300"
                >
                  <Plus className="h-3 w-3" /> Add Rx
                </button>
              )}
            </div>

            {/* Existing Prescriptions List */}
            {treatment.medicines && treatment.medicines.length > 0 ? (
              <div className="space-y-2 mb-3">
                {treatment.medicines.map((med) => (
                  <div
                    key={med.medicineId}
                    className="p-2.5 rounded-lg bg-ink-950/60 border border-sand-50/10 text-xs"
                  >
                    {editingMedId === med.medicineId ? (
                      <form onSubmit={(e) => handleSaveMedicine(med.medicineId, e)} className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-sand-50/40 block">Medicine Name</label>
                            <input
                              name="medicineName"
                              defaultValue={med.medicineName}
                              required
                              className="dash-input text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-sand-50/40 block">Dosage</label>
                            <input
                              name="dose"
                              defaultValue={med.dose ?? ""}
                              placeholder="e.g. 500mg"
                              className="dash-input text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-sand-50/40 block">Frequency</label>
                            <input
                              name="frequency"
                              defaultValue={med.frequency ?? ""}
                              placeholder="e.g. TDS (3x daily)"
                              className="dash-input text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-sand-50/40 block">Duration</label>
                            <input
                              name="duration"
                              defaultValue={med.duration ?? ""}
                              placeholder="e.g. 5 days"
                              className="dash-input text-xs"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-[10px] text-sand-50/40 block">Instructions</label>
                            <input
                              name="instructions"
                              defaultValue={med.instructions ?? ""}
                              placeholder="e.g. Take after food"
                              className="dash-input text-xs"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setEditingMedId(null)}
                            className="px-2 py-1 text-[11px] text-sand-50/50 hover:text-sand-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={pending}
                            className="px-2.5 py-1 text-[11px] bg-turq-600 text-ink-950 font-semibold rounded hover:bg-turq-500"
                          >
                            Save
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sand-100">
                            {med.medicineName}
                            {med.dose && <span className="font-normal text-sand-50/60 ml-1">({med.dose})</span>}
                          </p>
                          <p className="text-[11px] text-sand-50/50">
                            {[med.frequency, med.duration, med.instructions].filter(Boolean).join(" · ") || "No dosage notes"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingMedId(med.medicineId)}
                            className="p-1 text-sand-50/40 hover:text-turq-400"
                            title="Edit prescription"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => handleDeleteMedicine(med.medicineId)}
                            className="p-1 text-sand-50/40 hover:text-red-400"
                            title="Delete prescription"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-sand-50/40 italic mb-2">No prescriptions attached to this procedure.</p>
            )}

            {/* Add New Prescription Form */}
            {showAddMed && (
              <form onSubmit={handleAddMedicine} className="p-2.5 rounded-lg border border-turq-500/30 bg-turq-950/20 space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-turq-300">Add New Prescription</span>
                  <button
                    type="button"
                    onClick={() => setShowAddMed(false)}
                    className="text-sand-50/40 hover:text-sand-50"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-sand-50/40 block">Medicine Name</label>
                    <input
                      name="medicineName"
                      required
                      placeholder="e.g. Amoxicillin"
                      className="dash-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-sand-50/40 block">Dosage</label>
                    <input
                      name="dose"
                      placeholder="e.g. 500mg"
                      className="dash-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-sand-50/40 block">Frequency</label>
                    <input
                      name="frequency"
                      placeholder="e.g. TDS (3x daily)"
                      className="dash-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-sand-50/40 block">Duration</label>
                    <input
                      name="duration"
                      placeholder="e.g. 5 days"
                      className="dash-input text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-sand-50/40 block">Instructions</label>
                    <input
                      name="instructions"
                      placeholder="e.g. Take with a full glass of water after food"
                      className="dash-input text-xs"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddMed(false)}
                    className="px-2 py-1 text-[11px] text-sand-50/50 hover:text-sand-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="px-2.5 py-1 text-[11px] bg-turq-600 text-ink-950 font-semibold rounded hover:bg-turq-500"
                  >
                    Add Rx
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

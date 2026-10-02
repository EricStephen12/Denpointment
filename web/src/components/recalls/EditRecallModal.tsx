"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateRecall } from "@/app/actions/clinical-care";
import { Pencil, X, Loader2, Check } from "lucide-react";

interface EditRecallModalProps {
  recall: {
    recallId: number;
    reason: string;
    dueDate: Date | string;
    notes: string | null;
  };
}

export default function EditRecallModal({ recall }: EditRecallModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [reason, setReason] = useState(recall.reason);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(recall.dueDate);
    return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState(recall.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  const handleOpen = () => {
    setError(null);
    setReason(recall.reason);
    const d = new Date(recall.dueDate);
    setDueDate(isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10));
    setNotes(recall.notes ?? "");
    setIsOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || !dueDate) return;

    setError(null);
    const formData = new FormData();
    formData.set("recallId", String(recall.recallId));
    formData.set("reason", reason.trim());
    formData.set("dueDate", dueDate);
    if (notes.trim()) formData.set("notes", notes.trim());

    startTransition(async () => {
      try {
        await updateRecall(formData);
        setIsOpen(false);
        router.refresh();
      } catch (err: any) {
        setError(err?.message || "Failed to update recall.");
      }
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleOpen}
        title="Edit recall details"
        className="inline-flex items-center gap-1 text-xs border border-sand-50/15 text-sand-50/70 hover:text-sand-50 px-2.5 py-1.5 rounded-lg hover:bg-sand-50/5 transition-colors cursor-pointer"
      >
        <Pencil className="h-3 w-3" />
        <span>Edit</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => !isPending && setIsOpen(false)}
        >
          <div
            className="w-full max-w-md bg-ink-900 border border-sand-50/15 rounded-2xl shadow-2xl p-6 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-sand-50/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-turq-500/10 text-turq-400 border border-turq-500/20">
                  <Pencil className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-sand-50 font-display">
                    Edit Recall Follow-Up
                  </h2>
                  <p className="text-xs text-sand-50/50 mt-0.5">
                    Adjust reason, due date, or clinical instructions.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-sand-50/40 hover:text-sand-50 hover:bg-sand-50/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5 pt-4">
              <div>
                <label className="block text-xs font-medium text-sand-50/60 mb-1">
                  Reason for Recall <span className="text-turq-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={isPending}
                  className="dash-input text-xs"
                  placeholder="e.g. 6-Month Routine Cleaning, Suture Removal"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-sand-50/60 mb-1">
                  Due Date <span className="text-turq-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={isPending}
                  className="dash-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-sand-50/60 mb-1">
                  Clinical Notes (optional)
                </label>
                <input
                  type="text"
                  maxLength={200}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isPending}
                  className="dash-input text-xs"
                  placeholder="e.g. Remind patient about bleeding on upper molar"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-sand-50/10">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-sand-50/60 hover:text-sand-50 hover:bg-sand-50/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-turq-600 hover:bg-turq-500 text-ink-950 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addRecall } from "@/app/actions/clinical-care";
import { RefreshCw, Loader2, CheckCircle2, AlertCircle, Calendar, Plus } from "lucide-react";

interface AddRecallFormProps {
  patients: { patientId: number; name: string }[];
  dentists: { dentistId: number; name: string }[];
  defaultPatientId?: number;
}

const REASON_PRESETS = [
  "6-Month Routine Cleaning & Exam",
  "3-Month Perio Maintenance",
  "Orthodontic / Retainer Review",
  "Suture Removal & Healing Check",
  "Crown / Bridge Follow-Up",
  "Implant Integration Check",
];

export default function AddRecallForm({
  patients,
  dentists,
  defaultPatientId,
}: AddRecallFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [isOpen, setIsOpen] = useState(false);
  const [patientId, setPatientId] = useState(defaultPatientId ? String(defaultPatientId) : "");
  const [reason, setReason] = useState("");
  const [dentistId, setDentistId] = useState("");
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Default to 6 months from today
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().slice(0, 10);
  });

  const setPresetDate = (months: number, days = 0) => {
    const d = new Date();
    if (months > 0) d.setMonth(d.getMonth() + months);
    if (days > 0) d.setDate(d.getDate() + days);
    setDueDate(d.toISOString().slice(0, 10));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !reason || !dueDate) return;

    setFeedback(null);
    const formData = new FormData();
    formData.set("patientId", patientId);
    formData.set("reason", reason.trim());
    formData.set("dueDate", dueDate);
    if (dentistId) formData.set("dentistId", dentistId);
    if (notes.trim()) formData.set("notes", notes.trim());

    startTransition(async () => {
      try {
        await addRecall(formData);
        setReason("");
        setNotes("");
        if (!defaultPatientId) setPatientId("");
        setFeedback({
          type: "success",
          text: "Patient recall scheduled successfully. They will appear here when due.",
        });
        router.refresh();

        setTimeout(() => {
          setFeedback((prev) => (prev?.type === "success" ? null : prev));
        }, 5000);
      } catch (err: any) {
        setFeedback({
          type: "error",
          text: err?.message || "Failed to schedule recall.",
        });
      }
    });
  };

  return (
    <div className="dash-surface rounded-2xl border border-sand-50/10 overflow-hidden">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="p-5 flex items-center justify-between cursor-pointer hover:bg-sand-50/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-turq-500/10 text-turq-400 border border-turq-500/20">
            <RefreshCw className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-sand-50 font-display">
              Schedule a Patient Recall / Follow-up
            </h2>
            <p className="text-xs text-sand-50/50 mt-0.5">
              Set automated reminders for 6-month checkups, ortho reviews, or post-op visits.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-turq-600/10 hover:bg-turq-600/20 text-turq-300 border border-turq-500/20 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{isOpen ? "Close Form" : "New Recall"}</span>
        </button>
      </div>

      {isOpen && (
        <div className="p-5 border-t border-sand-50/10 bg-black/20 animate-in fade-in duration-200">
          {/* Feedback message */}
          {feedback && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs mb-4 ${
                feedback.type === "success"
                  ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                  : "bg-red-950/40 border-red-500/30 text-red-300"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{feedback.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Patient Selector */}
              <div>
                <label className="block text-xs font-medium text-sand-50/60 mb-1.5">
                  Patient <span className="text-turq-400">*</span>
                </label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  required
                  disabled={isPending}
                  className="dash-input text-xs"
                >
                  <option value="">Select patient…</option>
                  {patients.map((p) => (
                    <option key={p.patientId} value={p.patientId}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dentist Selector (Optional) */}
              <div>
                <label className="block text-xs font-medium text-sand-50/60 mb-1.5">
                  Assigned Dentist (optional)
                </label>
                <select
                  value={dentistId}
                  onChange={(e) => setDentistId(e.target.value)}
                  disabled={isPending}
                  className="dash-input text-xs"
                >
                  <option value="">Any available dentist</option>
                  {dentists.map((d) => (
                    <option key={d.dentistId} value={d.dentistId}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reason with Quick Presets */}
            <div>
              <label className="block text-xs font-medium text-sand-50/60 mb-1.5">
                Reason for Recall <span className="text-turq-400">*</span>
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {REASON_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    disabled={isPending}
                    onClick={() => setReason(preset)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                      reason === preset
                        ? "bg-turq-500/20 text-turq-300 border-turq-500/40 font-medium"
                        : "bg-sand-50/[0.03] text-sand-50/60 border-sand-50/10 hover:text-sand-50 hover:bg-sand-50/[0.06]"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <input
                type="text"
                required
                maxLength={120}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isPending}
                placeholder="Or type a custom reason..."
                className="dash-input text-xs"
              />
            </div>

            {/* Due Date with Quick Date Presets */}
            <div>
              <label className="block text-xs font-medium text-sand-50/60 mb-1.5">
                Due Date <span className="text-turq-400">*</span>
              </label>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-wider text-sand-50/40">Quick intervals:</span>
                <button
                  type="button"
                  onClick={() => setPresetDate(0, 14)}
                  className="text-[11px] px-2 py-0.5 rounded-lg border border-sand-50/10 bg-sand-50/5 hover:bg-sand-50/10 text-sand-50/70"
                >
                  +2 Weeks (Post-Op)
                </button>
                <button
                  type="button"
                  onClick={() => setPresetDate(1)}
                  className="text-[11px] px-2 py-0.5 rounded-lg border border-sand-50/10 bg-sand-50/5 hover:bg-sand-50/10 text-sand-50/70"
                >
                  +1 Month
                </button>
                <button
                  type="button"
                  onClick={() => setPresetDate(3)}
                  className="text-[11px] px-2 py-0.5 rounded-lg border border-sand-50/10 bg-sand-50/5 hover:bg-sand-50/10 text-sand-50/70"
                >
                  +3 Months (Perio)
                </button>
                <button
                  type="button"
                  onClick={() => setPresetDate(6)}
                  className="text-[11px] px-2 py-0.5 rounded-lg border border-turq-500/30 bg-turq-500/10 text-turq-300 font-medium"
                >
                  +6 Months (Routine Cleaning)
                </button>
                <button
                  type="button"
                  onClick={() => setPresetDate(12)}
                  className="text-[11px] px-2 py-0.5 rounded-lg border border-sand-50/10 bg-sand-50/5 hover:bg-sand-50/10 text-sand-50/70"
                >
                  +1 Year
                </button>
              </div>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isPending}
                className="dash-input text-xs"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-sand-50/60 mb-1.5">
                Clinical Instructions / Notes (optional)
              </label>
              <input
                type="text"
                maxLength={200}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isPending}
                placeholder="e.g. Check healing of lower right extraction site"
                className="dash-input text-xs"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-sand-50/60 hover:text-sand-50 hover:bg-sand-50/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !patientId || !reason || !dueDate}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-turq-600 hover:bg-turq-500 text-ink-950 transition-all shadow-md shadow-turq-600/20 disabled:opacity-50 cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Scheduling Recall...</span>
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4" />
                    <span>Schedule Recall</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

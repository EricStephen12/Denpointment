"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addToWaitlist } from "@/app/actions/appointments";
import { UserPlus, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface AddToWaitlistFormProps {
  patients: { patientId: number; name: string }[];
  dentists: { dentistId: number; name: string }[];
}

export default function AddToWaitlistForm({ patients, dentists }: AddToWaitlistFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [patientId, setPatientId] = useState("");
  const [requestedDate, setRequestedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dentistId, setDentistId] = useState("");
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !requestedDate) return;

    setFeedback(null);
    const formData = new FormData();
    formData.set("patientId", patientId);
    formData.set("requestedDate", requestedDate);
    if (dentistId) formData.set("dentistId", dentistId);
    if (notes.trim()) formData.set("notes", notes.trim());

    startTransition(async () => {
      try {
        await addToWaitlist(formData);
        // Reset form to prevent accidental duplicate additions
        setPatientId("");
        setNotes("");
        setDentistId("");
        setFeedback({
          type: "success",
          text: "Patient successfully added to the waiting list.",
        });
        router.refresh();

        // Clear feedback after 4 seconds
        setTimeout(() => {
          setFeedback((prev) => (prev?.type === "success" ? null : prev));
        }, 4000);
      } catch (err: any) {
        setFeedback({
          type: "error",
          text: err?.message || "Failed to add patient to waiting list.",
        });
      }
    });
  };

  return (
    <div className="dash-surface p-5">
      <h2 className="text-sm font-semibold text-sand-50 mb-4 flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-turq-400" /> Add to Waiting List
      </h2>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs mb-4 animate-in fade-in duration-200 ${
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

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-sand-50/50 mb-1">
            Patient <span className="text-turq-400">*</span>
          </label>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            disabled={isPending}
            required
            className="dash-input disabled:opacity-60"
          >
            <option value="">Select patient…</option>
            {patients.map((p) => (
              <option key={p.patientId} value={p.patientId}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-sand-50/50 mb-1">
            Requested Date <span className="text-turq-400">*</span>
          </label>
          <input
            type="date"
            value={requestedDate}
            onChange={(e) => setRequestedDate(e.target.value)}
            disabled={isPending}
            required
            className="dash-input disabled:opacity-60"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-sand-50/50 mb-1">
            Preferred Dentist (optional)
          </label>
          <select
            value={dentistId}
            onChange={(e) => setDentistId(e.target.value)}
            disabled={isPending}
            className="dash-input disabled:opacity-60"
          >
            <option value="">Any dentist</option>
            {dentists.map((d) => (
              <option key={d.dentistId} value={d.dentistId}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-sand-50/50 mb-1">
            Notes (optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isPending}
            maxLength={300}
            className="dash-input disabled:opacity-60"
            placeholder="e.g. Needs morning slot / urgent opening"
          />
        </div>

        <button
          type="submit"
          disabled={isPending || !patientId || !requestedDate}
          className="w-full inline-flex items-center justify-center gap-2 bg-turq-600 hover:bg-turq-500 text-ink-950 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-turq-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-ink-950" />
              <span>Adding to Waitlist...</span>
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              <span>Add to Waitlist</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

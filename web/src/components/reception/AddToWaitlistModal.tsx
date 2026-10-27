"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addToWaitlist } from "@/app/actions/appointments";
import { UserPlus, X, Loader2, Calendar, User, Stethoscope, FileText, CheckCircle2, AlertCircle } from "lucide-react";

interface AddToWaitlistModalProps {
  patients: { patientId: number; name: string }[];
  dentists: { dentistId: number; name: string }[];
}

export default function AddToWaitlistModal({ patients, dentists }: AddToWaitlistModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
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
        setFeedback({
          type: "success",
          text: "Patient successfully added to standby queue.",
        });
        setTimeout(() => {
          setIsOpen(false);
          setPatientId("");
          setNotes("");
          setDentistId("");
          setFeedback(null);
          router.refresh();
        }, 800);
      } catch (err: any) {
        setFeedback({
          type: "error",
          text: err?.message || "Failed to add patient to waiting list.",
        });
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 bg-turq-500 hover:bg-turq-400 text-ink-950 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-turq-500/10 cursor-pointer"
      >
        <UserPlus className="h-4 w-4" />
        Add to Waiting List
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-ink-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => !isPending && setIsOpen(false)}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-lg bg-ink-900 border border-sand-50/10 rounded-2xl shadow-2xl p-6 sm:p-7 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-5 border-b border-sand-50/10 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-turq-500/10 border border-turq-500/20 text-turq-400">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-sand-50">Add Patient to Standby Queue</h3>
                  <p className="text-xs text-sand-50/50 mt-0.5">Queue patient for open or cancelled appointment slots</p>
                </div>
              </div>
              <button
                onClick={() => !isPending && setIsOpen(false)}
                className="text-sand-50/40 hover:text-sand-50 p-1.5 rounded-lg hover:bg-sand-50/5 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Alert */}
            {feedback && (
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs mb-5 ${
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-sand-50/60 mb-1.5">
                  Patient <span className="text-turq-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sand-50/30 pointer-events-none" />
                  <select
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    disabled={isPending}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-ink-950/60 border border-sand-50/10 rounded-xl text-sm text-sand-50 focus:outline-none focus:border-turq-500 focus:ring-1 focus:ring-turq-500"
                  >
                    <option value="">Select a registered patient...</option>
                    {patients.map((p) => (
                      <option key={p.patientId} value={p.patientId}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-sand-50/60 mb-1.5">
                  Requested Date / Preferred Slot <span className="text-turq-400">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sand-50/30 pointer-events-none" />
                  <input
                    type="date"
                    value={requestedDate}
                    onChange={(e) => setRequestedDate(e.target.value)}
                    disabled={isPending}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-ink-950/60 border border-sand-50/10 rounded-xl text-sm text-sand-50 focus:outline-none focus:border-turq-500 focus:ring-1 focus:ring-turq-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-sand-50/60 mb-1.5">
                  Preferred Doctor (Optional)
                </label>
                <div className="relative">
                  <Stethoscope className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sand-50/30 pointer-events-none" />
                  <select
                    value={dentistId}
                    onChange={(e) => setDentistId(e.target.value)}
                    disabled={isPending}
                    className="w-full pl-10 pr-4 py-2.5 bg-ink-950/60 border border-sand-50/10 rounded-xl text-sm text-sand-50 focus:outline-none focus:border-turq-500 focus:ring-1 focus:ring-turq-500"
                  >
                    <option value="">Any Available Dentist</option>
                    {dentists.map((d) => (
                      <option key={d.dentistId} value={d.dentistId}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-sand-50/60 mb-1.5">
                  Standby Notes (Optional)
                </label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3 h-4 w-4 text-sand-50/30 pointer-events-none" />
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Can come on short notice within 30 minutes, prefers morning"
                    disabled={isPending}
                    className="w-full pl-10 pr-4 py-2.5 bg-ink-950/60 border border-sand-50/10 rounded-xl text-sm text-sand-50 placeholder:text-sand-50/30 focus:outline-none focus:border-turq-500 focus:ring-1 focus:ring-turq-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-sand-50/10 mt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="px-4 py-2.5 rounded-xl border border-sand-50/10 text-xs font-semibold text-sand-50/70 hover:text-sand-50 hover:bg-sand-50/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !patientId}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-turq-500 hover:bg-turq-400 disabled:opacity-50 text-ink-950 text-xs font-bold transition-all shadow-md shadow-turq-500/10 cursor-pointer"
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isPending ? "Adding Patient..." : "Add to Waiting List"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

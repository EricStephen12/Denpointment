"use client";

import React, { useState, useTransition } from "react";
import { createPatientAccount } from "@/app/actions/onboarding";
import { Loader2, AlertCircle, Sparkles } from "lucide-react";

export default function OnboardingForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const res = await createPatientAccount(formData);
        if (res?.error) {
          setError(res.error);
        }
      } catch (err: any) {
        // Next.js redirect errors are expected during successful redirects
        if (err?.message?.includes("NEXT_REDIRECT")) return;
        setError("An unexpected error occurred. Please try again.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="gender" className="block text-xs font-semibold text-sand-50/70 tracking-wider uppercase mb-2">
            Gender
          </label>
          <select id="gender" name="gender" required className="dash-input w-full" disabled={isPending}>
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div>
          <label htmlFor="birthDate" className="block text-xs font-semibold text-sand-50/70 tracking-wider uppercase mb-2">
            Date of Birth
          </label>
          <input
            type="date"
            id="birthDate"
            name="birthDate"
            required
            className="dash-input w-full"
            disabled={isPending}
          />
        </div>
      </div>

      <div>
        <label htmlFor="phone" className="block text-xs font-semibold text-sand-50/70 tracking-wider uppercase mb-2">
          Phone Number
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          required
          placeholder="+234 801 234 5678"
          className="dash-input w-full"
          disabled={isPending}
        />
        <p className="mt-1 text-xs text-sand-50/40">Required for instant appointment confirmations & clinic notifications.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="street" className="block text-xs font-semibold text-sand-50/70 tracking-wider uppercase mb-2">
            Street Address / Area
          </label>
          <input
            type="text"
            id="street"
            name="street"
            placeholder="e.g. Plot 12, Wuse 2"
            className="dash-input w-full"
            disabled={isPending}
          />
        </div>
        <div>
          <label htmlFor="city" className="block text-xs font-semibold text-sand-50/70 tracking-wider uppercase mb-2">
            City
          </label>
          <input
            type="text"
            id="city"
            name="city"
            defaultValue="Abuja"
            placeholder="Abuja"
            className="dash-input w-full"
            disabled={isPending}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 bg-turq-600 text-ink-950 py-3.5 rounded-full font-semibold text-xs tracking-wider uppercase hover:bg-turq-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-turq-900/20"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Setting Up Your Account...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>Complete Profile & Start Booking</span>
          </>
        )}
      </button>
    </form>
  );
}

"use client";

import React, { useState } from "react";
import { UserPlus, X, AlertCircle } from "lucide-react";
import { registerWalkInPatient } from "@/app/actions/patients";
import SubmitButton from "@/components/common/SubmitButton";

export default function RegisterPatientModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    try {
      await registerWalkInPatient(formData);
      setIsOpen(false);
    } catch (err: any) {
      setError(err?.message || "Failed to register patient.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setIsOpen(true);
        }}
        className="inline-flex items-center gap-2 bg-turq-500 hover:bg-turq-400 text-ink-950 font-semibold px-4 py-2 rounded-xl text-xs sm:text-sm transition-all shadow-sm active:scale-[0.98]"
      >
        <UserPlus className="h-4 w-4" />
        <span>Register Patient</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div
            className="w-full max-w-lg bg-ink-950 border border-sand-50/15 rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto custom-scrollbar"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-sand-50/10 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-turq-500/10 text-turq-400">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display text-sand-50">
                    Register New Patient
                  </h3>
                  <p className="text-xs text-sand-50/50">
                    Add a walk-in or telephone patient to the registry.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-sand-50/40 hover:text-sand-50 hover:bg-sand-50/10 transition-colors"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Registration Form */}
            <form action={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-firstName" className="block text-xs font-semibold uppercase tracking-wider text-sand-50/50 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="reg-firstName"
                    name="firstName"
                    required
                    placeholder="e.g. Chinelo"
                    className="dash-input text-xs"
                  />
                </div>
                <div>
                  <label htmlFor="reg-lastName" className="block text-xs font-semibold uppercase tracking-wider text-sand-50/50 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="reg-lastName"
                    name="lastName"
                    required
                    placeholder="e.g. Okeke"
                    className="dash-input text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-email" className="block text-xs font-semibold uppercase tracking-wider text-sand-50/50 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="reg-email"
                    name="email"
                    required
                    placeholder="patient@email.com"
                    className="dash-input text-xs"
                  />
                </div>
                <div>
                  <label htmlFor="reg-phone" className="block text-xs font-semibold uppercase tracking-wider text-sand-50/50 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="reg-phone"
                    name="phone"
                    placeholder="080 1234 5678"
                    className="dash-input text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-gender" className="block text-xs font-semibold uppercase tracking-wider text-sand-50/50 mb-1">
                    Gender *
                  </label>
                  <select id="reg-gender" name="gender" required className="dash-input text-xs">
                    <option value="">Select gender</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="reg-occupation" className="block text-xs font-semibold uppercase tracking-wider text-sand-50/50 mb-1">
                    Occupation
                  </label>
                  <input
                    type="text"
                    id="reg-occupation"
                    name="occupation"
                    maxLength={80}
                    placeholder="e.g. Engineer, Student"
                    className="dash-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-referralSource" className="block text-xs font-semibold uppercase tracking-wider text-sand-50/50 mb-1">
                  How did they find us?
                </label>
                <select id="reg-referralSource" name="referralSource" className="dash-input text-xs">
                  <option value="">Select referral source</option>
                  <option value="Walk-in">Walk-in</option>
                  <option value="Referred by patient">Referred by patient</option>
                  <option value="Google">Google Search</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Facebook">Facebook</option>
                  <option value="Doctor referral">Doctor referral</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-sand-50/10">
                <div>
                  <label htmlFor="reg-emergencyName" className="block text-xs font-semibold uppercase tracking-wider text-sand-50/50 mb-1">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    id="reg-emergencyName"
                    name="emergencyContactName"
                    maxLength={80}
                    placeholder="Contact full name"
                    className="dash-input text-xs"
                  />
                </div>
                <div>
                  <label htmlFor="reg-emergencyPhone" className="block text-xs font-semibold uppercase tracking-wider text-sand-50/50 mb-1">
                    Emergency Phone
                  </label>
                  <input
                    type="tel"
                    id="reg-emergencyPhone"
                    name="emergencyContactPhone"
                    maxLength={20}
                    placeholder="Emergency phone number"
                    className="dash-input text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-sand-50/10">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-sand-50/60 hover:text-sand-50 border border-sand-50/15 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <SubmitButton
                  pendingText="Registering..."
                  className="bg-turq-500 hover:bg-turq-400 text-ink-950 px-5 py-2 rounded-xl font-semibold text-xs transition-colors shadow-sm"
                >
                  Register Patient
                </SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import React, { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/app/actions/auth";
import { Loader2, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    formData.set("origin", origin);

    startTransition(async () => {
      const res = await requestPasswordResetAction(formData);
      if (res?.error) {
        setError(res.error);
      } else if (res?.success) {
        setSuccessMessage(
          res.message || "If an account exists with this email, a password reset link has been sent."
        );
      }
    });
  }

  return (
    <div className="w-full">
      {error && (
        <div className="flex items-center gap-3 p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage ? (
        <div className="space-y-6">
          <div className="p-5 bg-turq-500/10 border border-turq-500/20 rounded-xl text-sand-50 space-y-3">
            <div className="flex items-center gap-3 text-turq-400 font-medium">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Reset Link Dispatched</span>
            </div>
            <p className="text-sm text-sand-50/70 leading-relaxed">
              {successMessage} Please check your spam folder if it does not arrive within 2 minutes.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full gap-2 py-3.5 px-5 rounded-xl border border-sand-50/15 bg-sand-50/[0.04] text-sand-50 hover:bg-sand-50/[0.08] hover:border-sand-50/25 transition-all text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <p className="text-sm text-sand-50/60 leading-relaxed">
            Enter the email address associated with your account and we will send you a secure link to reset your password.
          </p>

          <div>
            <label
              htmlFor="email"
              className="block text-xs uppercase tracking-wider text-sand-50/60 font-medium mb-1.5"
            >
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                name="email"
                required
                autoComplete="email"
                placeholder="your.email@example.com"
                disabled={isPending}
                className="w-full rounded-xl border border-sand-50/15 bg-sand-50/[0.04] text-sand-50 placeholder:text-sand-50/30 focus:border-turq-400 focus:bg-sand-50/[0.08] focus:ring-1 focus:ring-turq-400/40 text-sm py-3 px-4 pl-11 transition-all disabled:opacity-50"
              />
              <Mail className="w-4 h-4 text-sand-50/40 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-turq-600 hover:bg-turq-500 active:scale-[0.99] transition-all text-ink-950 font-sans font-semibold text-sm tracking-wide py-3.5 shadow-lg shadow-turq-900/30 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending link...</span>
              </>
            ) : (
              <>
                <span>Send Reset Link</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-2 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-sand-50/60 hover:text-sand-50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Remember your password? Sign In</span>
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

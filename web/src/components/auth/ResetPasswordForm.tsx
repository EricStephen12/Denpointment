"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { resetPasswordAction } from "@/app/actions/auth";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("token", token);

    const password = (formData.get("password") as string) || "";
    const confirmPassword = (formData.get("confirmPassword") as string) || "";

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      const res = await resetPasswordAction(formData);
      if (res?.error) {
        setError(res.error);
      } else if (res?.success) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = res.redirectUrl || "/dashboard";
        }, 1500);
      }
    });
  }

  if (success) {
    return (
      <div className="text-center py-6 space-y-4">
        <div className="w-12 h-12 rounded-full bg-turq-500/20 text-turq-400 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="font-display text-xl uppercase tracking-wider text-sand-50">
          Password Updated
        </h3>
        <p className="text-xs text-sand-50/70">
          Your password has been successfully reset. Redirecting to your dashboard...
        </p>
        <div className="pt-2 flex justify-center">
          <Loader2 className="w-5 h-5 text-turq-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <p className="text-sm text-sand-50/60 leading-relaxed">
        Choose a new, strong password with at least 6 characters.
      </p>

      <div>
        <label
          htmlFor="password"
          className="block text-xs uppercase tracking-wider text-sand-50/60 font-medium mb-1.5"
        >
          New Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            required
            placeholder="••••••••"
            disabled={isPending}
            className="w-full rounded-xl border border-sand-50/15 bg-sand-50/[0.04] text-sand-50 placeholder:text-sand-50/30 focus:border-turq-400 focus:bg-sand-50/[0.08] focus:ring-1 focus:ring-turq-400/40 text-sm py-3 px-4 pr-11 transition-all disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-50/40 hover:text-sand-50 transition-colors p-1"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-xs uppercase tracking-wider text-sand-50/60 font-medium mb-1.5"
        >
          Confirm New Password
        </label>
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            id="confirmPassword"
            name="confirmPassword"
            required
            placeholder="••••••••"
            disabled={isPending}
            className="w-full rounded-xl border border-sand-50/15 bg-sand-50/[0.04] text-sand-50 placeholder:text-sand-50/30 focus:border-turq-400 focus:bg-sand-50/[0.08] focus:ring-1 focus:ring-turq-400/40 text-sm py-3 px-4 pr-11 transition-all disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-50/40 hover:text-sand-50 transition-colors p-1"
            aria-label={showConfirm ? "Hide password" : "Show password"}
          >
            {showConfirm ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
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
            <span>Updating password...</span>
          </>
        ) : (
          <>
            <span>Update Password & Enter</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}

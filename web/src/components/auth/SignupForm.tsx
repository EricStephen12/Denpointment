"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signupAction } from "@/app/actions/auth";
import { Eye, EyeOff, Loader2, AlertCircle, ArrowRight } from "lucide-react";

export default function SignupForm() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url") || "/dashboard";

  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("redirectUrl", redirectUrl);

    startTransition(async () => {
      const res = await signupAction(formData);
      if (res?.error) {
        setError(res.error);
      } else if (res?.success) {
        window.location.href = res.redirectUrl || "/dashboard";
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="firstName"
            className="block text-xs uppercase tracking-wider text-sand-50/60 font-medium mb-1.5"
          >
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            required
            autoComplete="given-name"
            placeholder="Ada"
            disabled={isPending}
            className="w-full rounded-xl border border-sand-50/15 bg-sand-50/[0.04] text-sand-50 placeholder:text-sand-50/30 focus:border-turq-400 focus:bg-sand-50/[0.08] focus:ring-1 focus:ring-turq-400/40 text-sm py-3 px-4 transition-all disabled:opacity-50"
          />
        </div>
        <div>
          <label
            htmlFor="lastName"
            className="block text-xs uppercase tracking-wider text-sand-50/60 font-medium mb-1.5"
          >
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            autoComplete="family-name"
            placeholder="Okafor"
            disabled={isPending}
            className="w-full rounded-xl border border-sand-50/15 bg-sand-50/[0.04] text-sand-50 placeholder:text-sand-50/30 focus:border-turq-400 focus:bg-sand-50/[0.08] focus:ring-1 focus:ring-turq-400/40 text-sm py-3 px-4 transition-all disabled:opacity-50"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-xs uppercase tracking-wider text-sand-50/60 font-medium mb-1.5"
        >
          Email Address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          autoComplete="email"
          placeholder="ada.okafor@example.com"
          disabled={isPending}
          className="w-full rounded-xl border border-sand-50/15 bg-sand-50/[0.04] text-sand-50 placeholder:text-sand-50/30 focus:border-turq-400 focus:bg-sand-50/[0.08] focus:ring-1 focus:ring-turq-400/40 text-sm py-3 px-4 transition-all disabled:opacity-50"
        />
      </div>

      <div>
        <label
          htmlFor="phone"
          className="block text-xs uppercase tracking-wider text-sand-50/60 font-medium mb-1.5"
        >
          Phone Number <span className="text-sand-50/30 lowercase">(optional)</span>
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          autoComplete="tel"
          placeholder="+234 801 234 5678"
          disabled={isPending}
          className="w-full rounded-xl border border-sand-50/15 bg-sand-50/[0.04] text-sand-50 placeholder:text-sand-50/30 focus:border-turq-400 focus:bg-sand-50/[0.08] focus:ring-1 focus:ring-turq-400/40 text-sm py-3 px-4 transition-all disabled:opacity-50"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-xs uppercase tracking-wider text-sand-50/60 font-medium mb-1.5"
        >
          Password <span className="text-sand-50/30 lowercase">(min. 6 characters)</span>
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            required
            minLength={6}
            autoComplete="new-password"
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

      <button
        type="submit"
        disabled={isPending}
        className="w-full mt-2 rounded-xl bg-turq-600 hover:bg-turq-500 active:scale-[0.99] transition-all text-ink-950 font-semibold text-sm tracking-wide py-3.5 shadow-lg shadow-turq-900/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Creating Account...</span>
          </>
        ) : (
          <>
            <span>Create Patient Account</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <p className="text-center text-xs text-sand-50/50 pt-2">
        Already have an account?{" "}
        <Link
          href={`/login${redirectUrl !== "/dashboard" ? `?redirect_url=${encodeURIComponent(redirectUrl)}` : ""}`}
          className="text-turq-400 hover:text-turq-300 font-medium transition-colors"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}

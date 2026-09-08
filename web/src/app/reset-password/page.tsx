import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { CLINIC_NAME } from "@/lib/constants";
import { ArrowLeft, AlertCircle } from "lucide-react";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { verifyPasswordResetToken } from "@/lib/session";

export const metadata = {
  title: `Reset Password | ${CLINIC_NAME}`,
  description: "Set a new password for your clinic account.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let isValid = false;
  if (token) {
    const verified = await verifyPasswordResetToken(token);
    if (verified) {
      isValid = true;
    }
  }

  return (
    <div className="min-h-screen flex w-full bg-ink-950 font-sans selection:bg-turq-400 selection:text-ink-950">
      {/* ── Left panel: Pure Visual Bleed ── */}
      <div className="hidden lg:flex flex-1 relative bg-ink-950 overflow-hidden">
        <Image
          src="/images/dental-smile1.jpg"
          alt={CLINIC_NAME}
          fill
          sizes="50vw"
          className="object-cover object-center grayscale-[30%] opacity-70 scale-105"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent" />

        <div className="absolute top-10 left-12">
          <Link
            href="/"
            className="font-display text-2xl tracking-widest text-sand-50 uppercase hover:text-turq-300 transition-colors"
          >
            {CLINIC_NAME}
          </Link>
        </div>
      </div>

      {/* ── Right panel: Form Design ── */}
      <div className="flex-1 flex flex-col justify-center relative p-6 sm:p-12 lg:p-20 w-full bg-ink-950 min-h-screen">
        {/* Subtle decorative glow */}
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-turq-500/10 rounded-full blur-3xl pointer-events-none" />

        <Link
          href="/login"
          className="absolute top-8 right-8 sm:top-10 sm:right-10 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-sand-50/50 hover:text-sand-50 transition-colors py-2 px-4 rounded-full border border-sand-50/10 hover:border-sand-50/25 bg-sand-50/5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Login</span>
        </Link>

        <div className="w-full max-w-md mx-auto relative z-10">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.25em] text-turq-400 font-medium mb-3">
              Security
            </p>
            <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-tight text-sand-50 leading-[0.95]">
              NEW <br />
              <span className="italic text-turq-400">CREDENTIALS.</span>
            </h1>
          </div>

          <div className="bg-sand-50/[0.03] border border-sand-50/10 rounded-3xl p-7 sm:p-9 shadow-2xl backdrop-blur-xl">
            {isValid && token ? (
              <Suspense fallback={<div className="h-64 animate-pulse bg-sand-50/5 rounded-2xl" />}>
                <ResetPasswordForm token={token} />
              </Suspense>
            ) : (
              <div className="space-y-6">
                <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-sand-50 space-y-3">
                  <div className="flex items-center gap-2.5 text-red-400 font-medium">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>Link Expired or Invalid</span>
                  </div>
                  <p className="text-sm text-sand-50/70 leading-relaxed">
                    This password reset link is invalid or has already expired. Password reset links remain active for 1 hour from creation.
                  </p>
                </div>

                <Link
                  href="/forgot-password"
                  className="w-full inline-flex items-center justify-center rounded-xl bg-turq-600 hover:bg-turq-500 transition-all text-ink-950 font-sans font-semibold text-sm tracking-wide py-3.5 shadow-lg shadow-turq-900/30"
                >
                  Request a New Reset Link
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

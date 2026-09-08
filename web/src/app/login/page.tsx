import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { CLINIC_NAME } from "@/lib/constants";
import { ArrowLeft } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
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

      {/* ── Right panel: Minimalist Form Design ── */}
      <div className="flex-1 flex flex-col justify-center relative p-6 sm:p-12 lg:p-20 w-full bg-ink-950 min-h-screen">
        {/* Subtle decorative glow */}
        <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-turq-500/10 rounded-full blur-3xl pointer-events-none" />

        <Link
          href="/"
          className="absolute top-8 right-8 sm:top-10 sm:right-10 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-sand-50/50 hover:text-sand-50 transition-colors py-2 px-4 rounded-full border border-sand-50/10 hover:border-sand-50/25 bg-sand-50/5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Home</span>
        </Link>

        <div className="w-full max-w-md mx-auto relative z-10">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.25em] text-turq-400 font-medium mb-3">
              Portal Access
            </p>
            <h1 className="font-display text-4xl sm:text-5xl uppercase tracking-tight text-sand-50 leading-[0.95]">
              WELCOME <br />
              <span className="italic text-turq-400">BACK.</span>
            </h1>
          </div>

          <div className="bg-sand-50/[0.03] border border-sand-50/10 rounded-3xl p-7 sm:p-9 shadow-2xl backdrop-blur-xl">
            <Suspense fallback={<div className="h-64 animate-pulse bg-sand-50/5 rounded-2xl" />}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

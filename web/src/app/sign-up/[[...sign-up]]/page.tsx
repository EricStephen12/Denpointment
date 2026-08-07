import { SignUp } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { CLINIC_NAME } from "@/lib/constants";
import { clerkAuthAppearance } from "@/lib/clerk-appearance";
import { ArrowLeft } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex w-full bg-ink-950 font-sans selection:bg-turq-400 selection:text-ink-950">
      {/* ── Left panel: Pure Minimalist Image ── */}
      <div className="hidden lg:flex flex-1 relative bg-ink-950">
        <Image
          src="/images/dental-smile2.jpg"
          alt="Glow Dental"
          fill
          sizes="50vw"
          className="object-cover object-center grayscale-[80%] opacity-70"
          priority
        />
        <div className="absolute inset-0 bg-ink-950/20" />

        <div className="absolute top-10 left-12">
          <Link href="/" className="font-display text-2xl tracking-widest text-sand-50 uppercase">
            {CLINIC_NAME}
          </Link>
        </div>
      </div>

      {/* ── Right panel: Form ── */}
      <div className="flex-1 flex flex-col justify-center relative p-8 sm:p-12 lg:p-24 w-full bg-ink-950 h-screen overflow-y-auto">
        <Link
          href="/"
          className="absolute top-10 right-10 lg:right-12 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-medium text-sand-50/40 hover:text-sand-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="w-full max-w-md mx-auto py-12">
          <div className="mb-6">
            <p className="text-turq-400 text-xs tracking-[0.3em] uppercase">
              Free &middot; No Card Required
            </p>
          </div>

          <h1 className="text-4xl md:text-5xl font-display text-sand-50 leading-tight uppercase mb-8">
            CREATE <br />
            <span className="italic text-turq-400">ACCOUNT.</span>
          </h1>

          <SignUp
            path="/sign-up"
            routing="path"
            signInUrl="/sign-in"
            forceRedirectUrl="/dashboard"
            appearance={clerkAuthAppearance}
          />
        </div>
      </div>
    </div>
  );
}

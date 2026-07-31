import { SignUp } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { CLINIC_NAME } from "@/lib/constants";
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
        
        <Link href="/" className="absolute top-10 right-10 lg:right-12 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-medium text-sand-50/40 hover:text-sand-50 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="w-full max-w-md mx-auto py-12">
          {/* Eyebrow */}
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
            appearance={{
              elements: {
                card: "bg-transparent shadow-none border-0 p-0",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "rounded-none border-sand-50/20 text-sand-50 hover:bg-sand-50/5",
                socialButtonsBlockButtonText: "font-sans uppercase text-[10px] tracking-widest",
                dividerLine: "bg-sand-50/10",
                dividerText: "text-sand-50/40 uppercase tracking-widest text-[10px]",
                formFieldLabel: "uppercase text-[10px] tracking-widest text-sand-50/60 font-sans",
                formFieldInput: "rounded-none border-sand-50/20 bg-transparent text-sand-50 focus:border-turq-400 focus:ring-0 transition-colors",
                formButtonPrimary: "rounded-none bg-sand-50 hover:bg-turq-400 transition-colors text-ink-950 font-sans uppercase text-xs tracking-widest py-4",
                footerActionText: "text-sand-50/60 font-sans text-xs",
                footerActionLink: "text-turq-400 hover:text-turq-300 font-sans uppercase tracking-widest text-[10px]",
                identityPreviewEditButtonIcon: "text-turq-400"
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}


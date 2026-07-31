import Link from "next/link";
import { MapPin, Phone, Mail, Clock, ArrowUpRight } from "lucide-react";
import {
  CLINIC_NAME,
  CLINIC_ADDRESS,
  CLINIC_PHONE,
  CLINIC_HOURS,
  CLINIC_RATING,
  CLINIC_REVIEW_COUNT,
} from "@/lib/constants";
import Reveal from "@/components/marketing/Reveal";
import MarketingHeader from "@/components/marketing/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description: `Reach Glow Dental at ${CLINIC_ADDRESS}. Call us on ${CLINIC_PHONE} or book online.`,
};

const CONTACT_ITEMS = [
  {
    icon: MapPin,
    label: "Visit Us",
    value: CLINIC_ADDRESS,
    link: "https://maps.google.com/?q=Glow+Dental+Clinic+Kubwa+Abuja",
    linkLabel: "Open in Google Maps ↗",
    accent: true,
  },
  {
    icon: Phone,
    label: "Call Us",
    value: CLINIC_PHONE,
    link: `tel:${CLINIC_PHONE.replace(/\s/g, "")}`,
    linkLabel: "Tap to call",
    accent: false,
  },
  {
    icon: Mail,
    label: "Email Us",
    value: "hello@glowdentalclinic.com",
    link: "mailto:hello@glowdentalclinic.com",
    linkLabel: "Send an email",
    accent: false,
  },
  {
    icon: Clock,
    label: "Hours",
    value: "Mon – Sat · Open until 6 PM",
    link: null,
    linkLabel: null,
    accent: false,
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-sand-50 text-ink-950 flex flex-col">
      <MarketingHeader />

      {/* ── Hero band ── */}
      <section className="bg-ink-950 text-sand-50 px-6 md:px-10 py-20 md:py-28 relative overflow-hidden">
        {/* Decorative watermark */}
        <p
          aria-hidden
          className="absolute right-0 top-1/2 -translate-y-1/2 font-display italic text-[18vw] text-sand-50/[0.03] leading-none select-none pointer-events-none whitespace-nowrap pr-6"
        >
          Hello.
        </p>
        <div className="max-w-[1600px] mx-auto relative z-10">
          <Reveal>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-8 h-px bg-turq-600" />
              <p className="text-turq-400 text-xs tracking-[0.25em] uppercase">
                Contact
              </p>
            </div>
            <h1 className="font-display text-6xl md:text-8xl leading-none mb-6">
              Get in{" "}
              <span className="italic text-turq-400">touch.</span>
            </h1>
            <p className="text-sand-300/60 text-lg max-w-lg leading-relaxed">
              We&apos;re on Gado Nasko Road, Kubwa — and our front desk team
              is always happy to help. Call us, email, or book online.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Contact grid ── */}
      <section className="px-6 md:px-10 py-20 md:py-28">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">

          {/* Left: contact details */}
          <Reveal delay={0.05}>
            <div className="space-y-0">
              {CONTACT_ITEMS.map((item, i) => (
                <div
                  key={item.label}
                  className={`flex items-start gap-5 py-8 border-t border-ink-950/10 ${
                    i === CONTACT_ITEMS.length - 1 ? "border-b" : ""
                  } group`}
                >
                  <div className="w-10 h-10 rounded-xl bg-turq-600/10 flex items-center justify-center flex-shrink-0 group-hover:bg-turq-600/20 transition-colors">
                    <item.icon className="h-5 w-5 text-turq-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-ink-950/40 uppercase tracking-widest mb-1">
                      {item.label}
                    </p>
                    <p className="text-ink-950 font-medium text-base leading-snug mb-2">
                      {item.value}
                    </p>
                    {item.link && (
                      <a
                        href={item.link}
                        target={item.link.startsWith("http") ? "_blank" : undefined}
                        rel={item.link.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="inline-flex items-center gap-1.5 text-sm text-turq-600 border-b border-turq-600/30 pb-0.5 hover:border-turq-500 transition-colors"
                      >
                        {item.linkLabel}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Google rating strip */}
            <div className="mt-10 flex items-center gap-5 p-5 bg-sand-100 border border-ink-950/10 rounded-2xl">
              <div>
                <p className="font-display text-4xl text-ink-950">{CLINIC_RATING}</p>
                <div className="flex gap-0.5 mt-1">
                  {[1,2,3,4].map(s => (
                    <svg key={s} className="w-3.5 h-3.5 text-turq-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  ))}
                  <svg className="w-3.5 h-3.5 text-turq-500/40" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>
              </div>
              <div className="w-px h-10 bg-ink-950/10" />
              <div>
                <p className="text-sm font-medium text-ink-950">{CLINIC_REVIEW_COUNT} Google reviews</p>
                <p className="text-xs text-ink-950/50 mt-0.5">Glow Dental · Kubwa</p>
              </div>
            </div>
          </Reveal>

          {/* Right: CTAs */}
          <Reveal delay={0.15}>
            <div className="space-y-5 h-full flex flex-col">
              {/* Book card */}
              <div className="bg-ink-950 text-sand-50 rounded-2xl p-10 flex-1 flex flex-col justify-between relative overflow-hidden">
                {/* Decorative */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-turq-600/10 rounded-full -translate-x-8 -translate-y-16" />
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-turq-600/5 rounded-full translate-x-8 translate-y-8" />

                <div className="relative z-10">
                  <span className="inline-block text-[10px] font-medium tracking-[0.2em] uppercase bg-turq-600/20 text-turq-400 px-3 py-1 rounded-full mb-6">
                    Fastest way
                  </span>
                  <h3 className="font-display text-4xl mb-4 leading-tight">
                    Book online in{" "}
                    <span className="italic text-turq-400">under a minute.</span>
                  </h3>
                  <p className="text-sand-400 text-sm leading-relaxed mb-8 max-w-xs">
                    No phone call needed. Pick your dentist, choose a time,
                    confirm. Done.
                  </p>
                </div>
                <Link
                  href="/sign-up"
                  className="relative z-10 inline-flex items-center gap-2 bg-turq-600 hover:bg-turq-500 text-ink-950 font-medium px-8 py-4 rounded-full text-sm transition-colors w-fit"
                >
                  Book Now <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Call card */}
              <div className="bg-white border border-ink-950/10 rounded-2xl p-7 flex items-center justify-between hover:border-turq-400/50 transition-colors group">
                <div>
                  <p className="text-xs text-ink-950/40 uppercase tracking-widest mb-1">
                    Prefer to call?
                  </p>
                  <p className="font-display text-2xl text-ink-950 group-hover:text-turq-600 transition-colors">
                    {CLINIC_PHONE}
                  </p>
                </div>
                <a
                  href={`tel:${CLINIC_PHONE.replace(/\s/g, "")}`}
                  className="flex-shrink-0 bg-ink-950 hover:bg-turq-600 text-sand-50 hover:text-ink-950 px-5 py-3 rounded-full text-sm font-medium transition-colors"
                >
                  Call now
                </a>
              </div>

              {/* Map tile */}
              <a
                href="https://maps.google.com/?q=Glow+Dental+Clinic+Gado+Nasko+Rd+Kubwa+Abuja"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between bg-sand-100 border border-ink-950/10 hover:border-turq-400/50 rounded-2xl p-7 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-turq-600/10 rounded-xl flex items-center justify-center group-hover:bg-turq-600/20 transition-colors">
                    <MapPin className="h-5 w-5 text-turq-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink-950 group-hover:text-turq-600 transition-colors">
                      Gado Nasko Rd, Kubwa, Abuja
                    </p>
                    <p className="text-xs text-ink-950/40 mt-0.5">Open in Google Maps</p>
                  </div>
                </div>
                <ArrowUpRight className="h-5 w-5 text-ink-950/30 group-hover:text-turq-600 transition-colors" />
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <MarketingFooter />
    </div>
  );
}

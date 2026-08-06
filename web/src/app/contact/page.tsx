import Link from "next/link";
import { MapPin, Phone, Mail, Clock, ArrowUpRight } from "lucide-react";
import { getSiteContent } from "@/lib/site";
import Reveal from "@/components/marketing/Reveal";
import MarketingHeader from "@/components/marketing/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import ContactForm from "@/components/marketing/ContactForm";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteContent();
  return {
    title: "Contact Us",
    description: `Reach ${site.clinicName} at ${site.address}. Call us on ${site.phone} or book online.`,
  };
}

export default async function ContactPage() {
  const site = await getSiteContent();

  const contactItems = [
    {
      icon: MapPin,
      label: "Visit Us",
      value: site.address,
      link: `https://maps.google.com/?q=${encodeURIComponent(site.address)}`,
      linkLabel: "Open in Google Maps ↗",
    },
    {
      icon: Phone,
      label: "Call Us",
      value: site.phone,
      link: `tel:${site.phone.replace(/\s/g, "")}`,
      linkLabel: "Tap to call",
    },
    {
      icon: Mail,
      label: "Email Us",
      value: site.email,
      link: `mailto:${site.email}`,
      linkLabel: "Send an email",
    },
    {
      icon: Clock,
      label: "Hours",
      value: site.hoursLabel,
      link: null as string | null,
      linkLabel: null as string | null,
    },
  ];

  return (
    <div className="min-h-screen bg-sand-50 text-ink-950 flex flex-col">
      <MarketingHeader clinicName={site.clinicName} />

      <section className="bg-ink-950 text-sand-50 px-6 md:px-10 py-20 md:py-28 relative overflow-hidden">
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
              <p className="text-turq-400 text-xs tracking-[0.25em] uppercase">Contact</p>
            </div>
            <h1 className="font-display text-6xl md:text-8xl leading-none mb-6">
              Get in <span className="italic text-turq-400">touch.</span>
            </h1>
            <p className="text-sand-300/60 text-lg max-w-lg leading-relaxed">
              {site.tagline} Call us, email, or send a message below.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="px-6 md:px-10 py-20 md:py-28">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
          <Reveal delay={0.05}>
            <div className="space-y-0">
              {contactItems.map((item, i) => (
                <div
                  key={item.label}
                  className={`flex items-start gap-5 py-8 border-t border-ink-950/10 ${
                    i === contactItems.length - 1 ? "border-b" : ""
                  } group`}
                >
                  <div className="w-10 h-10 rounded-xl bg-turq-600/10 flex items-center justify-center flex-shrink-0 group-hover:bg-turq-600/20 transition-colors">
                    <item.icon className="h-5 w-5 text-turq-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-ink-950/40 uppercase tracking-widest mb-1">{item.label}</p>
                    <p className="text-ink-950 font-medium text-base leading-snug mb-2">{item.value}</p>
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

            <div className="mt-10 flex items-center gap-5 p-5 bg-sand-100 border border-ink-950/10 rounded-2xl">
              <div>
                <p className="font-display text-4xl text-ink-950">{site.rating}</p>
              </div>
              <div className="w-px h-10 bg-ink-950/10" />
              <div>
                <p className="text-sm font-medium text-ink-950">{site.reviewCount} Google reviews</p>
                <p className="text-xs text-ink-950/50 mt-0.5">{site.clinicName} · {site.location}</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="space-y-5 h-full flex flex-col">
              <div className="bg-white border border-ink-950/10 rounded-2xl p-8">
                <h3 className="font-display text-2xl text-ink-950 mb-2">Send a message</h3>
                <p className="text-sm text-ink-950/50 mb-6">
                  We&apos;ll get back to you at the email you provide.
                </p>
                <ContactForm />
              </div>

              <div className="bg-ink-950 text-sand-50 rounded-2xl p-10 flex-1 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-turq-600/10 rounded-full -translate-x-8 -translate-y-16" />
                <div className="relative z-10">
                  <span className="inline-block text-[10px] font-medium tracking-[0.2em] uppercase bg-turq-600/20 text-turq-400 px-3 py-1 rounded-full mb-6">
                    Fastest way
                  </span>
                  <h3 className="font-display text-4xl mb-4 leading-tight">
                    Book online in <span className="italic text-turq-400">under a minute.</span>
                  </h3>
                  <p className="text-sand-400 text-sm leading-relaxed mb-8 max-w-xs">
                    No phone call needed. Pick a time, confirm. Done.
                  </p>
                </div>
                <Link
                  href="/sign-up"
                  className="relative z-10 inline-flex items-center gap-2 bg-turq-600 hover:bg-turq-500 text-ink-950 font-medium px-8 py-4 rounded-full text-sm transition-colors w-fit"
                >
                  Book Now <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="bg-white border border-ink-950/10 rounded-2xl p-7 flex items-center justify-between hover:border-turq-400/50 transition-colors group">
                <div>
                  <p className="text-xs text-ink-950/40 uppercase tracking-widest mb-1">Prefer to call?</p>
                  <p className="font-display text-2xl text-ink-950 group-hover:text-turq-600 transition-colors">
                    {site.phone}
                  </p>
                </div>
                <a
                  href={`tel:${site.phone.replace(/\s/g, "")}`}
                  className="flex-shrink-0 bg-ink-950 hover:bg-turq-600 text-sand-50 hover:text-ink-950 px-5 py-3 rounded-full text-sm font-medium transition-colors"
                >
                  Call now
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <MarketingFooter
        clinicName={site.clinicName}
        address={site.address}
        phone={site.phone}
        hoursLabel={site.hoursLabel}
      />
    </div>
  );
}

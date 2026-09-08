import Link from "next/link";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { getSiteContent } from "@/lib/site";
import Reveal from "@/components/marketing/Reveal";
import LandingNav from "@/components/marketing/LandingNav";
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
      linkLabel: "Open in Google Maps",
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
    <div className="min-h-screen bg-ink-950 text-sand-50 selection:bg-turq-400 selection:text-ink-950 flex flex-col">
      <LandingNav clinicName={site.clinicName} />

      {/* Hero — matches homepage typography language */}
      <section className="relative px-6 md:px-12 pt-40 pb-20 md:pb-28 border-b border-sand-50/10">
        <div className="max-w-[1800px] mx-auto">
          <Reveal>
            <p className="text-turq-300 text-xs tracking-[0.3em] uppercase mb-8">Contact</p>
            <h1 className="font-display text-6xl md:text-8xl leading-[0.9] uppercase mb-8">
              Get in <span className="italic text-turq-400">touch.</span>
            </h1>
            <p className="text-sand-50/50 text-sm md:text-base max-w-lg leading-relaxed">
              {site.tagline} Call us, email, or send a message below.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="px-6 md:px-12 py-20 md:py-32 flex-1">
        <div className="max-w-[1800px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-24">
          {/* Details */}
          <div className="md:col-span-5">
            <Reveal delay={0.05}>
              <div>
                {contactItems.map((item, i) => (
                  <div
                    key={item.label}
                    className={`flex items-start gap-5 py-8 border-t border-sand-50/10 ${
                      i === contactItems.length - 1 ? "border-b" : ""
                    } group`}
                  >
                    <item.icon className="h-5 w-5 text-turq-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-[10px] text-sand-50/40 uppercase tracking-[0.2em] mb-2">
                        {item.label}
                      </p>
                      <p className="text-sand-50 font-medium leading-snug mb-2">{item.value}</p>
                      {item.link && (
                        <a
                          href={item.link}
                          target={item.link.startsWith("http") ? "_blank" : undefined}
                          rel={item.link.startsWith("http") ? "noopener noreferrer" : undefined}
                          className="text-sm text-turq-300 hover:text-turq-200 transition-colors"
                        >
                          {item.linkLabel}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 flex items-end gap-6 border-t border-sand-50/10 pt-10">
                <div>
                  <p className="font-display text-5xl text-sand-50">{site.rating}</p>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-sand-50/40 mt-2">
                    / 5.0
                  </p>
                </div>
                <div className="pb-1">
                  <p className="text-sm text-sand-50/70">{site.reviewCount} Google reviews</p>
                  <p className="text-xs text-sand-50/40 mt-1">
                    {site.clinicName} · {site.location}
                  </p>
                </div>
              </div>

              <div className="mt-10 relative w-full aspect-[16/10] overflow-hidden border border-sand-50/10">
                <iframe
                  title={`${site.clinicName} location`}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(site.address)}&z=16&output=embed`}
                  className="absolute inset-0 h-full w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </Reveal>
          </div>

          {/* Form + book CTA */}
          <div className="md:col-span-6 md:col-start-7 space-y-16">
            <Reveal delay={0.1}>
              <div>
                <h2 className="font-display text-3xl md:text-4xl uppercase text-sand-50 mb-3">
                  Send a <span className="italic text-turq-400">message.</span>
                </h2>
                <p className="text-sand-50/40 text-sm mb-10 max-w-md">
                  We&apos;ll get back to you at the email you provide.
                </p>
                <ContactForm />
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="border-t border-sand-50/10 pt-12">
                <p className="text-turq-300 text-xs tracking-[0.3em] uppercase mb-6">Fastest way</p>
                <h3 className="font-display text-3xl md:text-4xl uppercase leading-tight mb-6">
                  Book online in <span className="italic text-turq-400">under a minute.</span>
                </h3>
                <p className="text-sand-50/40 text-sm mb-8 max-w-sm">
                  No phone call needed. Pick a time, confirm. Done.
                </p>
                <Link href="/sign-up" className="link-cta">
                  Book Now
                </Link>
              </div>
            </Reveal>
          </div>
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

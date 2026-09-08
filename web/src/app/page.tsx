import Link from "next/link";
import Image from "next/image";
import { getSiteContent } from "@/lib/site";
import { getCurrentPerson } from "@/lib/auth";
import LandingNav from "@/components/marketing/LandingNav";
import SmoothScroll from "@/components/marketing/SmoothScroll";
import Reveal from "@/components/marketing/Reveal";
import FAQSection from "@/components/marketing/FAQSection";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import TeamSection from "@/components/marketing/TeamSection";
import Testimonials from "@/components/marketing/Testimonials";
import PriceListSection from "@/components/marketing/PriceListSection";

export const revalidate = 3600;

export default async function Home() {
  const [site, user] = await Promise.all([getSiteContent(), getCurrentPerson()]);

  return (
    <div className="bg-ink-950 text-sand-50 selection:bg-turq-400 selection:text-ink-950">
      <SmoothScroll />
      <LandingNav clinicName={site.clinicName} user={user} />

      {/* ── 1. Hero: Massive Typography & Bleed Image ── */}
      <section className="relative min-h-[90vh] md:min-h-screen flex flex-col justify-end md:justify-center px-6 md:px-12 pt-40 pb-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/dental-smile1.jpg"
            alt="Premium Dental Care"
            fill
            sizes="100vw"
            className="object-cover object-center grayscale-[80%] opacity-50 md:opacity-40 brightness-50"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/70 to-transparent md:bg-ink-950/50" />
        </div>

        <div className="max-w-[1800px] mx-auto w-full relative z-10 flex flex-col items-start md:items-center md:text-center mt-auto md:mt-0">
          <Reveal>
            <h1 className="font-display text-[14vw] md:text-[10vw] leading-[0.85] tracking-tight uppercase text-sand-50">
              {site.heroLine1}
            </h1>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="font-display text-[14vw] md:text-[10vw] leading-[0.85] tracking-tight uppercase text-turq-400 mt-2">
              {site.heroLine2}
            </h1>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="mt-16 md:mt-24 flex flex-col md:flex-row md:items-center gap-6">
              <Link
                href="/dashboard/book"
                className="inline-flex items-center gap-2 bg-turq-600 hover:bg-turq-500 text-ink-950 px-8 py-4 rounded-full text-xs font-semibold uppercase tracking-wider transition-all shadow-lg shadow-turq-900/30"
              >
                Book an Appointment
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
              <a
                href="#services"
                className="text-[10px] tracking-[0.3em] uppercase text-sand-50/70 border border-sand-50/20 px-6 py-3 rounded-full hover:border-turq-400/50 hover:text-turq-300 transition-colors"
              >
                ↓ Explore services
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 2. The Philosophy (Image + Text) ── */}
      <section className="relative py-32 md:py-48 px-6 md:px-12">
        <div className="max-w-[1800px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-24 items-center">
          <div className="md:col-span-6 relative h-[60vh] md:h-[90vh] w-full">
            <Image
              src="/images/dental-smile2.jpg"
              alt="Exceptional Care"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="img-bleed grayscale-[20%]"
            />
          </div>

          <div className="md:col-span-5 md:col-start-8 flex flex-col justify-center">
            <Reveal>
              <p className="font-display italic text-turq-400 text-6xl mb-8">&ldquo;</p>
              <h2 className="font-display text-3xl md:text-5xl leading-tight text-sand-50 mb-10">
                {site.philosophyLine1}
                <br /><br />
                <span className="text-turq-300">{site.philosophyLine2}</span>
              </h2>
              <p className="text-[10px] tracking-[0.2em] uppercase text-sand-50/50">
                {site.clinicName} · {site.location}
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── 3. Services: Bleeding layout ── */}
      <section id="services" className="py-20">
        {[
          {
            title: "PREVENTIVE CARE",
            desc: "Routine exams and gentle, thorough cleanings that keep small issues from becoming big ones.",
            img: "/images/dental-smile1.jpg",
          },
          {
            title: "COSMETIC WHITENING",
            desc: "Clinic-grade whitening and smile design, calibrated to look natural — never overdone.",
            img: "/images/before-and-after.jpg",
          },
          {
            title: "RESTORATIVE DENTISTRY",
            desc: "Fillings, crowns, and repairs built with the same care as our cosmetic work.",
            img: "/images/dental-smile3.jpg",
          },
          {
            title: "BRACES & ALIGNMENT",
            desc: "Straightening that fits your life — braces and clear-aligner pathways planned around comfort and results.",
            img: "/images/dental-smile2.jpg",
          },
          {
            title: "SMILE TRANSFORMATION",
            desc: "Teeth replacement and full makeovers — implants, bridges, and veneers guided by a clear treatment plan.",
            img: "/images/dental.jpg",
          },
        ].map((srv, i) => (
          <div key={srv.title} className="max-w-[1800px] mx-auto px-6 md:px-12 py-16 md:py-32 grid grid-cols-1 md:grid-cols-12 gap-12 items-center hairline border-t-sand-50/10">
            <div className={`md:col-span-6 h-[50vh] md:h-[70vh] w-full relative ${i % 2 !== 0 ? "md:order-last" : ""}`}>
              <Image src={srv.img} alt={srv.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="img-bleed grayscale-[10%]" />
            </div>

            <div className={`md:col-span-5 ${i % 2 !== 0 ? "md:col-start-2" : "md:col-start-8"}`}>
              <Reveal>
                <p className="font-display text-turq-400 text-6xl md:text-8xl italic leading-none mb-6">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="font-display text-4xl md:text-6xl uppercase tracking-wide text-sand-50 mb-8">{srv.title}</h3>
                <p className="text-sand-50/60 text-sm tracking-wide leading-relaxed mb-10 max-w-md">
                  {srv.desc}
                </p>
                <Link href={`/dashboard/book?service=${encodeURIComponent(srv.title)}`} className="link-cta">
                  Book this service
                </Link>
              </Reveal>
            </div>
          </div>
        ))}
      </section>

      {/* ── Family & patients gallery (new photos added alongside dental imagery) ── */}
      <section className="py-28 md:py-40 px-6 md:px-12 border-t border-sand-50/10">
        <div className="max-w-[1800px] mx-auto">
          <Reveal>
            <p className="text-turq-300 text-xs tracking-[0.3em] uppercase mb-8">In the community</p>
            <h2 className="font-display text-4xl md:text-6xl text-sand-50 uppercase leading-tight mb-6 max-w-3xl">
              SMILES THAT GO <span className="italic text-turq-400">HOME.</span>
            </h2>
            <p className="text-sand-50/50 text-sm max-w-md mb-16">
              Real families and patients — the reason we show up every day.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {[
              { src: "/images/family-hero.jpeg", alt: "Happy family", className: "md:row-span-2 min-h-[50vh] md:min-h-full" },
              { src: "/images/children-laugh.jpeg", alt: "Joyful smiles", className: "min-h-[40vh]" },
              { src: "/images/child-portrait.jpeg", alt: "Young patient smile", className: "min-h-[40vh]" },
            ].map((photo) => (
              <div key={photo.src} className={`relative overflow-hidden ${photo.className}`}>
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-center"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Typography Break ── */}
      <section className="py-32 md:py-56 px-6 md:px-12 overflow-hidden flex justify-center">
        <Reveal>
          <div className="text-center">
            <h2 className="font-display text-[8vw] leading-[0.9] text-sand-50 uppercase">
              THE RESULT YOU&apos;VE
            </h2>
            <h2 className="font-display text-[8vw] leading-[0.9] text-turq-400 uppercase italic">
              BEEN WAITING FOR
            </h2>
          </div>
        </Reveal>
      </section>

      {/* ── 5. Full Clinical Fee Schedule ── */}
      <PriceListSection />

      <TeamSection />
      <Testimonials rating={site.rating} reviewCount={site.reviewCount} />

      {/* Visit / map */}
      <section id="visit" className="py-20 md:py-28 px-6 md:px-12 border-t border-sand-50/10">
        <div className="max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="text-turq-300 text-xs tracking-[0.3em] uppercase mb-6">Find us</p>
              <h2 className="font-display text-4xl md:text-5xl uppercase text-sand-50 mb-8 leading-tight">
                Visit <span className="italic text-turq-400">{site.clinicName.split(" ")[0]}.</span>
              </h2>
              <p className="text-sand-50/50 text-sm leading-relaxed mb-2">{site.address}</p>
              <p className="text-sand-50/40 text-sm mb-8">{site.hoursLabel}</p>
              <div className="flex flex-wrap gap-4">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-cta"
                >
                  Open in Google Maps
                </a>
                <a
                  href={`tel:${site.phone.replace(/\s/g, "")}`}
                  className="text-xs tracking-[0.2em] uppercase text-sand-50/60 hover:text-turq-300 self-center transition-colors"
                >
                  Call {site.phone}
                </a>
              </div>
            </Reveal>
          </div>
          <div className="lg:col-span-7">
            <Reveal delay={0.1}>
              <div className="relative w-full aspect-[16/10] overflow-hidden border border-sand-50/10 bg-sand-50/5">
                <iframe
                  title={`${site.clinicName} map`}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(site.address)}&z=16&output=embed`}
                  className="absolute inset-0 h-full w-full grayscale-[30%] contrast-125"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
                {/* Fallback shown behind the iframe for blocked/slow connections */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink-900/80 pointer-events-none" aria-hidden="true">
                  <svg className="w-8 h-8 text-turq-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <p className="text-sand-50/60 text-xs tracking-wider uppercase">{site.address}</p>
                </div>
              </div>
              <p className="text-[10px] text-sand-50/35 mt-3 tracking-wide uppercase">
                Tap the map or button above to navigate
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <FAQSection
        clinicName={site.clinicName}
        phone={site.phone}
        address={site.address}
        hoursLabel={site.hoursLabel}
      />
      <MarketingFooter
        clinicName={site.clinicName}
        address={site.address}
        phone={site.phone}
        hoursLabel={site.hoursLabel}
        user={user}
      />
    </div>
  );
}

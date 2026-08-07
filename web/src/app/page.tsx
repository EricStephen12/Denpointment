import Link from "next/link";
import Image from "next/image";
import { getSiteContent } from "@/lib/site";
import { formatNaira } from "@/lib/currency";
import LandingNav from "@/components/marketing/LandingNav";
import SmoothScroll from "@/components/marketing/SmoothScroll";
import Reveal from "@/components/marketing/Reveal";
import FAQSection from "@/components/marketing/FAQSection";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import TeamSection from "@/components/marketing/TeamSection";
import Testimonials from "@/components/marketing/Testimonials";

export const revalidate = 3600;

export default async function Home() {
  const site = await getSiteContent();

  return (
    <div className="bg-ink-950 text-sand-50 selection:bg-turq-400 selection:text-ink-950">
      <SmoothScroll />
      <LandingNav clinicName={site.clinicName} />

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
            <div className="mt-16 md:mt-24 flex flex-col md:items-center gap-6">
              <span className="text-[10px] tracking-[0.3em] uppercase text-sand-50/70 border border-sand-50/20 px-6 py-3 rounded-full md:border-none md:p-0 md:rounded-none">
                <span className="hidden md:inline">↓ </span>Scroll to explore
              </span>
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
        ].map((srv, i) => (
          <div key={srv.title} className="max-w-[1800px] mx-auto px-6 md:px-12 py-16 md:py-32 grid grid-cols-1 md:grid-cols-12 gap-12 items-center hairline border-t-sand-50/10">
            <div className={`md:col-span-6 h-[50vh] md:h-[70vh] w-full relative ${i % 2 !== 0 ? "md:order-last" : ""}`}>
              <Image src={srv.img} alt={srv.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="img-bleed grayscale-[10%]" />
            </div>

            <div className={`md:col-span-5 ${i % 2 !== 0 ? "md:col-start-2" : "md:col-start-8"}`}>
              <Reveal>
                <p className="font-display text-turq-400 text-6xl md:text-8xl italic leading-none mb-6">0{i + 1}</p>
                <h3 className="font-display text-4xl md:text-6xl uppercase tracking-wide text-sand-50 mb-8">{srv.title}</h3>
                <p className="text-sand-50/60 text-sm tracking-wide leading-relaxed mb-10 max-w-md">
                  {srv.desc}
                </p>
                <Link href="/sign-up" className="link-cta">
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

      {/* ── 5. Pricing (Stripped Back) ── */}
      <section className="py-20 px-6 md:px-12 max-w-[1800px] mx-auto border-t border-sand-50/10">
        <Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-6">
            {site.packages.map((pkg) => (
              <div key={pkg.title} className="flex flex-col border-t border-sand-50/20 pt-8">
                <h3 className="text-xs tracking-[0.2em] uppercase text-turq-300 mb-6">{pkg.title}</h3>
                <p className="font-display text-6xl italic text-sand-50 mb-6">{formatNaira(pkg.price)}</p>
                <p className="text-sand-50/50 text-sm leading-relaxed mb-10 flex-1">{pkg.desc}</p>
                <Link href="/sign-up" className="link-cta self-start">Select Package</Link>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <TeamSection />
      <Testimonials rating={site.rating} reviewCount={site.reviewCount} />
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
      />
    </div>
  );
}

import Link from "next/link";
import Image from "next/image";
import { CLINIC_NAME, CLINIC_PHONE, CLINIC_RATING, CLINIC_REVIEW_COUNT, CLINIC_LOCATION } from "@/lib/constants";
import LandingNav from "@/components/marketing/LandingNav";
import SmoothScroll from "@/components/marketing/SmoothScroll";
import Reveal from "@/components/marketing/Reveal";
import FAQSection from "@/components/marketing/FAQSection";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import TeamSection from "@/components/marketing/TeamSection";
import Testimonials from "@/components/marketing/Testimonials";

export const revalidate = 3600;

export default function Home() {
  return (
    <div className="bg-ink-950 text-sand-50 selection:bg-turq-400 selection:text-ink-950">
      <SmoothScroll />
      <LandingNav />

      {/* ── 1. Hero: Massive Typography & Bleed Image ── */}
      <section className="relative min-h-[90vh] md:min-h-screen flex flex-col justify-end md:justify-center px-6 md:px-12 pt-40 pb-20 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="/images/dental-smile1.jpg" 
            alt="Premium Dental Care" 
            fill 
            className="object-cover object-center grayscale-[80%] opacity-50 md:opacity-40 brightness-50"
            priority
          />
          {/* Dark gradient overlay so text stays legible */}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/70 to-transparent md:bg-ink-950/50" />
        </div>

        <div className="max-w-[1800px] mx-auto w-full relative z-10 flex flex-col items-start md:items-center md:text-center mt-auto md:mt-0">
          <Reveal>
            <h1 className="font-display text-[14vw] md:text-[10vw] leading-[0.85] tracking-tight uppercase text-sand-50">
              YOUR SMILE
            </h1>
          </Reveal>
          
          <Reveal delay={0.1}>
            <h1 className="font-display text-[14vw] md:text-[10vw] leading-[0.85] tracking-tight uppercase text-turq-400 mt-2">
              REFINED.
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
              className="img-bleed grayscale-[20%]"
            />
          </div>

          <div className="md:col-span-5 md:col-start-8 flex flex-col justify-center">
            <Reveal>
              <p className="font-display italic text-turq-400 text-6xl mb-8">&ldquo;</p>
              <h2 className="font-display text-3xl md:text-5xl leading-tight text-sand-50 mb-10">
                WE OFTEN RUSH TO JUDGE BEAUTY AT FIRST GLANCE.
                <br /><br />
                <span className="text-turq-300">ONLY AN EXPERT EYE</span> CAN UNVEIL THE HIDDEN PERFECTION WITHIN.
              </h2>
              <p className="text-[10px] tracking-[0.2em] uppercase text-sand-50/50">
                {CLINIC_NAME} · {CLINIC_LOCATION}
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
            <div className={`md:col-span-6 h-[50vh] md:h-[70vh] w-full relative ${i % 2 !== 0 ? 'md:order-last' : ''}`}>
              <Image src={srv.img} alt={srv.title} fill className="img-bleed grayscale-[10%]" />
            </div>
            
            <div className={`md:col-span-5 ${i % 2 !== 0 ? 'md:col-start-2' : 'md:col-start-8'}`}>
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

      {/* ── 4. Typography Break ── */}
      <section className="py-32 md:py-56 px-6 md:px-12 overflow-hidden flex justify-center">
        <Reveal>
          <div className="text-center">
            <h2 className="font-display text-[8vw] leading-[0.9] text-sand-50 uppercase">
              THE RESULT YOU'VE
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
            {[
              { title: "THE ESSENTIAL", price: "$149", desc: "Exam, x-rays, and a full professional cleaning." },
              { title: "THE RADIANCE", price: "$299", desc: "In-clinic whitening, calibrated to your natural shade." },
              { title: "THE MAKEOVER", price: "$499", desc: "Full consultation for veneers and smile design." },
            ].map((pkg) => (
              <div key={pkg.title} className="flex flex-col border-t border-sand-50/20 pt-8">
                <h3 className="text-xs tracking-[0.2em] uppercase text-turq-300 mb-6">{pkg.title}</h3>
                <p className="font-display text-6xl italic text-sand-50 mb-6">{pkg.price}</p>
                <p className="text-sand-50/50 text-sm leading-relaxed mb-10 flex-1">{pkg.desc}</p>
                <Link href="/sign-up" className="link-cta self-start">Select Package</Link>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── Team Section ── */}
      <TeamSection />

      {/* ── Testimonials ── */}
      <Testimonials />

      {/* ── FAQ ── */}
      <FAQSection />

      {/* ── Footer ── */}
      <MarketingFooter />
    </div>
  );
}

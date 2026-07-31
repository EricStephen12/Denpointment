"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { ArrowDown } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ReactNode } from "react";

gsap.registerPlugin(ScrollTrigger);

interface Panel {
  image: string;
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
}

export default function PinnedIntro({ panels, children }: { panels: Panel[]; children?: ReactNode }) {
  const containerRef = useRef<HTMLElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const els = panelRefs.current.filter(Boolean) as HTMLDivElement[];
      if (els.length < 2 || !containerRef.current) return;

      gsap.set(els.slice(1), { opacity: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: () => `+=${window.innerHeight * (els.length - 1)}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      els.forEach((panel, i) => {
        if (i === 0) return;
        tl.to(els[i - 1].querySelector(".panel-media"), { scale: 1.12, duration: 1, ease: "none" }, i - 1)
          .to(els[i - 1], { opacity: 0, duration: 1, ease: "none" }, i - 1)
          .fromTo(panel, { opacity: 0 }, { opacity: 1, duration: 1, ease: "none" }, i - 1);
      });
    }, containerRef);

    return () => ctx.revert();
  }, [panels.length]);

  return (
    <section ref={containerRef} className="relative h-screen w-full overflow-hidden bg-ink-950">
      {panels.map((panel, i) => (
        <div
          key={i}
          ref={(el) => {
            panelRefs.current[i] = el;
          }}
          className="absolute inset-0"
        >
          <div className="panel-media absolute inset-0 w-full h-full">
            <Image
              src={panel.image}
              alt={panel.eyebrow}
              fill
              priority={i === 0}
              className="object-cover grayscale-[35%] contrast-[1.05] brightness-[0.65]"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-ink-950/60" />

          <div className="relative z-10 h-full w-full flex flex-col items-center justify-center text-center px-6">
            <p className="text-turq-300/80 text-xs tracking-[0.3em] uppercase mb-6">{panel.eyebrow}</p>
            <h2 className="font-display text-sand-50 text-[13vw] md:text-[7vw] leading-[0.95] tracking-tight">
              {panel.title}
            </h2>
            <p className="text-sand-200/70 text-sm md:text-base mt-8 max-w-sm">{panel.subtitle}</p>
          </div>
        </div>
      ))}

      {children}

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-sand-300/50">
        <span className="text-[11px] tracking-[0.2em] uppercase">Scroll</span>
        <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
      </div>
    </section>
  );
}

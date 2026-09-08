"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatNaira } from "@/lib/currency";
import { GLOW_PRICE_CATEGORIES } from "@/lib/constants";
import Reveal from "@/components/marketing/Reveal";

export default function PriceListSection() {
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const categories = ["All", ...GLOW_PRICE_CATEGORIES.map((c) => c.category)];

  const allItems = GLOW_PRICE_CATEGORIES.flatMap((c) =>
    c.items.map((item) => ({ ...item, category: c.category })),
  );

  const filteredItems =
    activeCategory === "All"
      ? allItems
      : allItems.filter((item) => item.category === activeCategory);

  return (
    <section id="pricing" className="py-28 md:py-44 px-6 md:px-12 border-t hairline bg-ink-950">
      <div className="max-w-[1800px] mx-auto">
        {/* Editorial Section Header */}
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div>
              <p className="text-turq-300 text-xs tracking-[0.3em] uppercase mb-4">
                Transparent Fees
              </p>
              <h2 className="font-display text-4xl md:text-6xl uppercase text-sand-50 leading-[0.9]">
                TREATMENTS &amp; <span className="italic text-turq-400">PRICING.</span>
              </h2>
            </div>
            <p className="text-sand-50/50 text-sm max-w-sm leading-relaxed">
              Upfront pricing with zero hidden surcharges. All clinical treatments are conducted with hospital-grade sterilization and modern technology.
            </p>
          </div>
        </Reveal>

        {/* Minimalist Department Filter Tabs */}
        <Reveal delay={0.05}>
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-12 scrollbar-none">
            {categories.map((cat) => {
              const count =
                cat === "All"
                  ? allItems.length
                  : allItems.filter((i) => i.category === cat).length;
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium uppercase tracking-wider transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-turq-600 text-ink-950 shadow-md shadow-turq-900/30"
                      : "bg-sand-50/[0.04] hover:bg-sand-50/[0.08] text-sand-50/60 hover:text-sand-50 border border-sand-50/10"
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? "bg-ink-950/20 text-ink-950"
                        : "bg-sand-50/10 text-sand-50/50"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* Visual Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {filteredItems.map((item, i) => (
            <Reveal key={`${item.name}-${i}`} delay={Math.min(i * 0.02, 0.25)}>
              <div className="group relative bg-sand-50/[0.02] hover:bg-sand-50/[0.05] border border-sand-50/10 hover:border-turq-400/40 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between min-h-[140px] hover:shadow-xl hover:shadow-turq-950/20">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-medium text-sm md:text-base text-sand-50 group-hover:text-turq-300 transition-colors leading-snug">
                      {item.name}
                    </h3>
                    <Link
                      href={`/dashboard/book?service=${encodeURIComponent(item.name)}`}
                      aria-label={`Book ${item.name}`}
                      className="p-1.5 rounded-full border border-sand-50/10 group-hover:border-turq-400/50 group-hover:bg-turq-600/10 text-sand-50/40 group-hover:text-turq-300 transition-all shrink-0 mt-0.5"
                    >
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </Link>
                  </div>

                  {item.note && (
                    <span className="inline-block text-[11px] text-turq-300/80 bg-turq-950/50 border border-turq-500/20 px-2 py-0.5 rounded-md font-light">
                      {item.note}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between pt-4 border-t border-sand-50/5 mt-4">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-sand-50/40">
                    {item.category}
                  </span>
                  <span className="font-display text-xl md:text-2xl text-sand-50 tracking-tight">
                    {formatNaira(item.price)}
                  </span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

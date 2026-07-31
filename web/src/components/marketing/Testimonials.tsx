import Reveal from "@/components/marketing/Reveal";

const TESTIMONIALS = [
  {
    name: "Ikenna Ogu",
    role: "Patient",
    quote: "Doctor is friendly, understanding and very professional. Very satisfactory service.",
  },
  {
    name: "Benjamin Oyemwense",
    role: "Patient",
    quote: "Doctor was really good, calls to check up on you. I'm a lot better today than before.",
  },
  {
    name: "Otue Andrew",
    role: "Patient",
    quote: "Very professional in their services. Really enjoyed my visit.",
  },
  {
    name: "Clinton Chimfurumnnanya",
    role: "Patient",
    quote: "It was a wonderful experience, very polite people.",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-28 md:py-48 px-6 md:px-12 border-t hairline bg-ink-950">
      <div className="max-w-[1800px] mx-auto">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-32">
            <div>
              <p className="text-turq-300 text-xs tracking-[0.3em] uppercase mb-8">
                In Their Words
              </p>
              <h2 className="font-display text-5xl md:text-6xl text-sand-50 uppercase leading-tight">
                WHAT PATIENTS <span className="italic text-turq-400">SAY.</span>
              </h2>
            </div>
            
            <div className="text-right">
              <p className="font-display text-4xl text-sand-50 mb-2">4.6 / 5.0</p>
              <p className="text-[10px] tracking-[0.2em] uppercase text-sand-50/40">
                BASED ON 130+ REVIEWS
              </p>
            </div>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <div className="flex flex-col border-t hairline pt-12">
                <p className="font-display italic text-turq-400 text-6xl leading-none mb-6">
                  &ldquo;
                </p>
                <p className="font-display text-2xl md:text-3xl leading-relaxed text-sand-50 mb-12 flex-1">
                  {t.quote}
                </p>
                <div className="flex items-center gap-4 mt-auto">
                  <div className="w-8 h-px bg-turq-400/30" />
                  <div>
                    <p className="text-sm tracking-widest uppercase text-sand-50 mb-1">{t.name}</p>
                    <p className="text-[10px] tracking-[0.2em] uppercase text-sand-50/40">{t.role}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

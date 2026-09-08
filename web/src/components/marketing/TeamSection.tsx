import { prisma } from "@/lib/prisma";
import Reveal from "@/components/marketing/Reveal";

export default async function TeamSection() {
  const dentists = await prisma.dentist
    .findMany({
      include: { person: true },
      orderBy: { person: { lastName: "asc" } },
    })
    .catch(() => []);

  if (dentists.length === 0) return null;

  return (
    <section id="team" className="py-28 md:py-40 px-6 md:px-12 border-t hairline">
      <div className="max-w-[1800px] mx-auto">
        <Reveal>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-20">
            <div className="md:col-span-5">
              <p className="text-turq-300 text-xs tracking-[0.3em] uppercase mb-8">Our Team</p>
              <h2 className="font-display text-5xl md:text-6xl text-sand-50 leading-tight uppercase">
                MEET THE{" "}
                <span className="italic text-turq-400">SPECIALISTS.</span>
              </h2>
            </div>
            <div className="md:col-span-7 flex items-end">
              <p className="text-sand-50/50 text-lg leading-relaxed max-w-lg">
                Every dentist on staff is chosen as much for their bedside
                manner as their clinical skill. You&apos;re in expert hands.
              </p>
            </div>
          </div>
        </Reveal>

        <div>
          {dentists.map((d, i) => (
            <Reveal key={d.dentistId} delay={i * 0.05}>
              <div className="flex items-center justify-between py-10 border-t hairline group cursor-default">
                <div className="flex items-baseline gap-8">
                  <span className="font-display italic text-turq-400 text-3xl opacity-0 group-hover:opacity-100 transition-opacity -ml-12 group-hover:ml-0 duration-300">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-3xl md:text-5xl uppercase text-sand-50 group-hover:text-turq-300 transition-colors duration-200">
                    DR. {d.person.firstName} {d.person.lastName}
                  </h3>
                </div>
              </div>
            </Reveal>
          ))}
          <div className="border-t hairline" />
        </div>
      </div>
    </section>
  );
}

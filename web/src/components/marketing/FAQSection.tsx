"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { CLINIC_NAME, CLINIC_PHONE, CLINIC_ADDRESS } from "@/lib/constants";
import Reveal from "@/components/marketing/Reveal";

const FAQS = [
  {
    question: "WHERE IS THE CLINIC LOCATED?",
    answer: `We are located at ${CLINIC_ADDRESS}. You can find us easily on Gado Nasko Road — call us on ${CLINIC_PHONE} if you need directions.`,
  },
  {
    question: "HOW DO I BOOK AN APPOINTMENT?",
    answer: `You can book online by creating a free patient account on our portal — choose your preferred dentist, pick a date, and select from available time slots. You'll get instant confirmation. Alternatively, call us on ${CLINIC_PHONE} and our front desk will schedule you.`,
  },
  {
    question: "DO YOU ACCEPT WALK-IN PATIENTS?",
    answer:
      "Yes — walk-ins are welcome. Our front desk team will fit you in wherever possible. We're open Monday to Saturday until 6 PM.",
  },
  {
    question: "WHAT IF I NEED TO CANCEL OR RESCHEDULE?",
    answer:
      "You can cancel or reschedule from your patient portal under \"My Appointments\" at any time. We kindly ask for at least 24 hours' notice so another patient can take your slot.",
  },
  {
    question: "WHAT SERVICES DO YOU OFFER?",
    answer: `${CLINIC_NAME} offers preventive care (exams and cleanings), cosmetic whitening, restorative dentistry (fillings, crowns), and general dental consultations. Contact us to discuss your specific needs.`,
  },
  {
    question: "HOW CAN I PAY FOR TREATMENT?",
    answer: `Payment can be made in-person at the clinic on the day of your visit. Online payment is also available through your patient portal after a treatment. We accept major payment methods.`,
  },
];

export default function FAQSection() {
  const [openIndex, setIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 md:py-32 px-6 md:px-12 max-w-[1800px] mx-auto border-t hairline mt-12 bg-ink-950 text-sand-50">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-16">
        
        {/* Left Sticky */}
        <div className="md:col-span-4">
          <Reveal>
            <p className="text-turq-300 text-xs tracking-[0.3em] uppercase mb-8">
              FAQ
            </p>
            <h2 className="font-display text-4xl md:text-5xl text-sand-50 leading-tight uppercase">
              QUESTIONS, <span className="italic text-turq-400">ANSWERED.</span>
            </h2>
            <p className="text-sand-50/50 text-sm leading-relaxed mt-6 max-w-xs">
              Can't find what you're looking for? Call us directly on{" "}
              <a href={`tel:${CLINIC_PHONE.replace(/\s/g, "")}`} className="text-turq-300 hover:text-turq-200 transition-colors">
                {CLINIC_PHONE}
              </a>.
            </p>
          </Reveal>
        </div>

        {/* Right Accordion */}
        <div className="md:col-span-8 border-t hairline">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <Reveal key={faq.question} delay={i * 0.05}>
                <div className="flex items-start justify-between py-10 border-b hairline cursor-pointer group" onClick={() => setIndex(isOpen ? null : i)}>
                  <div className="flex-1">
                    <span className="font-display text-xl md:text-2xl uppercase tracking-wide leading-snug group-hover:text-turq-300 transition-colors">
                      {faq.question}
                    </span>
                    
                    {isOpen && (
                      <div className="mt-6 text-sand-50/60 leading-relaxed max-w-xl text-[14px]">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                  
                  <span className="flex-shrink-0 w-8 h-8 ml-6 rounded-full border border-sand-50/20 flex items-center justify-center transition-colors hover:border-turq-400">
                    {isOpen ? (
                      <Minus className="h-3 w-3 text-sand-50" />
                    ) : (
                      <Plus className="h-3 w-3 text-sand-50" />
                    )}
                  </span>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

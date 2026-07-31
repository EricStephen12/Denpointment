"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CLINIC_NAME } from "@/lib/constants";
import { Menu, X } from "lucide-react";

export default function LandingNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          scrolled ? "bg-ink-950/90 backdrop-blur-md py-4 border-b border-sand-50/5" : "bg-transparent py-8"
        }`}
      >
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 flex items-center justify-between">
          
          {/* Left: Menu trigger / Links */}
          <div className="flex-1 flex items-center justify-start">
            <button
              onClick={() => setIsOpen(true)}
              className="text-sand-50 hover:text-turq-300 transition-colors flex items-center gap-2 text-xs tracking-[0.2em] uppercase"
            >
              <Menu className="h-4 w-4" />
              <span className="hidden sm:inline">Menu</span>
            </button>
          </div>

          {/* Center: Logo */}
          <div className="flex-1 flex justify-center">
            <Link href="/" className="font-display text-2xl tracking-widest text-sand-50 uppercase">
              {CLINIC_NAME}
            </Link>
          </div>

          {/* Right: Actions */}
          <div className="flex-1 flex items-center justify-end gap-8">
            <Link
              href="/sign-in"
              className="hidden sm:block text-sand-50/70 hover:text-sand-50 transition-colors text-[11px] tracking-[0.15em] uppercase"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="text-sand-50 hover:text-turq-400 transition-colors text-[11px] tracking-[0.15em] uppercase"
            >
              Book Appointment
            </Link>
          </div>
        </div>
      </header>

      {/* Fullscreen Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] bg-ink-950 flex flex-col justify-between animate-fade-in">
          <div className="max-w-[1800px] mx-auto w-full px-6 md:px-12 py-8 flex items-center justify-between">
            <div className="flex-1" />
            <div className="flex-1 flex justify-center">
              <span className="font-display text-2xl tracking-widest text-sand-50 uppercase opacity-50">
                {CLINIC_NAME.split(" ")[0]}
              </span>
            </div>
            <div className="flex-1 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="text-sand-50 hover:text-champagne-300 transition-colors p-2"
              >
                <X className="h-8 w-8 stroke-[1]" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-10">
            {[
              { href: "/#services", label: "Services" },
              { href: "/#team", label: "The Doctors" },
              { href: "/#testimonials", label: "Testimonials" },
              { href: "/#faq", label: "FAQ" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="font-display text-5xl md:text-7xl text-sand-50 hover:text-champagne-400 transition-colors italic tracking-wide"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="py-12 flex justify-center gap-12 text-[10px] tracking-[0.3em] uppercase text-sand-50/50">
            <Link href="/sign-in" onClick={() => setIsOpen(false)} className="hover:text-sand-50 transition-colors">Patient Portal</Link>
            <Link href="/contact" onClick={() => setIsOpen(false)} className="hover:text-sand-50 transition-colors">Contact Clinic</Link>
          </div>
        </div>
      )}
    </>
  );
}

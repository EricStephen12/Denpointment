"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CLINIC_NAME } from "@/lib/constants";
import { Menu, X } from "lucide-react";
import type { PersonWithRoles } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";

export default function LandingNav({
  clinicName = CLINIC_NAME,
  user = null,
}: {
  clinicName?: string;
  user?: PersonWithRoles | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isSignedIn = !!user;

  async function handleSignOut() {
    await logoutAction();
    window.location.href = "/";
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          scrolled
            ? "bg-ink-950/95 backdrop-blur-md py-3 md:py-4 border-b border-sand-50/5 shadow-lg shadow-black/20"
            : "bg-ink-950/40 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none py-3.5 md:py-8"
        }`}
      >
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 md:px-12 flex items-center justify-between">
          {/* Left: Menu trigger with consistent touch-friendly width */}
          <div className="flex items-center justify-start shrink-0 w-24 sm:w-32 md:w-44">
            <button
              onClick={() => setIsOpen(true)}
              className="text-sand-50 hover:text-turq-300 transition-colors flex items-center gap-2 text-xs tracking-[0.2em] uppercase py-1 pr-2"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5 md:h-4 md:w-4 shrink-0" />
              <span className="hidden sm:inline">Menu</span>
            </button>
          </div>

          {/* Center: Brand name, strictly single-line, centered */}
          <div className="flex-1 flex justify-center text-center px-2 min-w-0">
            <Link
              href="/"
              className="font-display text-base sm:text-xl md:text-2xl tracking-[0.16em] md:tracking-widest text-sand-50 uppercase whitespace-nowrap truncate hover:text-turq-300 transition-colors"
            >
              {clinicName}
            </Link>
          </div>

          {/* Right: Compact pill CTA on mobile, expanded actions on desktop */}
          <div className="flex items-center justify-end shrink-0 w-24 sm:w-32 md:w-44 gap-3 md:gap-6">
            {!isSignedIn && (
              <>
                <Link
                  href="/login"
                  className="hidden md:block text-sand-50/70 hover:text-sand-50 transition-colors text-[11px] tracking-[0.15em] uppercase whitespace-nowrap"
                >
                  Sign In
                </Link>
                <Link
                  href="/dashboard/book"
                  className="inline-flex items-center justify-center px-3 py-1.5 md:px-5 md:py-2 rounded-full bg-turq-600 hover:bg-turq-500 text-ink-950 font-semibold text-[10px] md:text-xs tracking-wider uppercase transition-all shadow-md shadow-turq-950/20 whitespace-nowrap"
                >
                  <span className="sm:hidden">Book</span>
                  <span className="hidden sm:inline">Book Appointment</span>
                </Link>
              </>
            )}
            {isSignedIn && (
              <>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center px-3 py-1.5 md:px-5 md:py-2 rounded-full bg-turq-600 hover:bg-turq-500 text-ink-950 font-semibold text-[10px] md:text-xs tracking-wider uppercase transition-all shadow-md shadow-turq-950/20 whitespace-nowrap"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="hidden md:block text-sand-50/70 hover:text-sand-50 transition-colors text-[11px] tracking-[0.15em] uppercase whitespace-nowrap cursor-pointer"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {isOpen && (
        <div className="fixed inset-0 z-[60] bg-ink-950 flex flex-col justify-between overflow-y-auto animate-fade-in">
          <div className="max-w-[1800px] mx-auto w-full px-4 sm:px-6 md:px-12 py-6 md:py-8 flex items-center justify-between shrink-0">
            <div className="flex-1 w-24" />
            <div className="flex-1 flex justify-center text-center">
              <span className="font-display text-lg sm:text-2xl tracking-widest text-sand-50 uppercase opacity-50 whitespace-nowrap">
                {clinicName.split(" ")[0]}
              </span>
            </div>
            <div className="flex-1 flex justify-end w-24">
              <button
                onClick={() => setIsOpen(false)}
                className="text-sand-50 hover:text-champagne-300 transition-colors p-2"
                aria-label="Close menu"
              >
                <X className="h-7 w-7 md:h-8 md:w-8 stroke-[1]" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-5 sm:gap-8 md:gap-10 py-6 px-4">
            {[
              { href: "/#services", label: "Services" },
              { href: "/#pricing", label: "Price List" },
              { href: "/#visit", label: "Visit / Map" },
              { href: "/#team", label: "The Doctors" },
              { href: "/#testimonials", label: "Testimonials" },
              { href: "/#faq", label: "FAQ" },
              { href: "/contact", label: "Contact" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="font-display text-3xl sm:text-5xl md:text-7xl text-sand-50 hover:text-champagne-400 transition-colors italic tracking-wide text-center"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="py-8 md:py-12 flex justify-center gap-8 sm:gap-12 text-[10px] tracking-[0.3em] uppercase text-sand-50/50 shrink-0 px-4">
            {!isSignedIn && (
              <Link href="/login" onClick={() => setIsOpen(false)} className="hover:text-sand-50 transition-colors">
                Patient Portal
              </Link>
            )}
            {isSignedIn && (
              <>
                <Link href="/dashboard" onClick={() => setIsOpen(false)} className="hover:text-sand-50 transition-colors">
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    handleSignOut();
                  }}
                  className="hover:text-sand-50 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </>
            )}
            <Link href="/contact" onClick={() => setIsOpen(false)} className="hover:text-sand-50 transition-colors">
              Contact Clinic
            </Link>
          </div>
        </div>
      )}
    </>
  );
}


"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { CLINIC_NAME } from "@/lib/constants";
import type { PersonWithRoles } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";

const LINKS = [
  { href: "/#services", label: "Services" },
  { href: "/#pricing", label: "Price List" },
  { href: "/#team", label: "Our Dentists" },
  { href: "/#testimonials", label: "Reviews" },
  { href: "/contact", label: "Contact" },
];

export default function MarketingHeader({
  clinicName = CLINIC_NAME,
  user = null,
}: {
  clinicName?: string;
  user?: PersonWithRoles | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isSignedIn = !!user;

  async function handleSignOut() {
    await logoutAction();
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-sand-50/90 backdrop-blur-xl border-b border-ink-950/10">
      <div className="max-w-[1600px] mx-auto px-6 md:px-10">
        <div className="flex items-center justify-between h-18 py-5">
          {/* Logo */}
          <Link
            href="/"
            className="font-display text-2xl tracking-tight text-ink-950 lowercase hover:text-turq-600 transition-colors"
          >
            {clinicName.split(" ")[0]}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors ${
                  pathname === link.href
                    ? "text-ink-950 font-medium"
                    : "text-ink-950/60 hover:text-ink-950"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3 bg-ink-950 rounded-full p-1.5 pl-4">
            {!isSignedIn ? (
              <>
                <Link
                  href="/login"
                  className="text-sand-400 text-sm hover:text-sand-50 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="bg-turq-600 hover:bg-turq-500 text-ink-950 px-5 py-2 rounded-full text-sm font-medium transition-colors"
                >
                  Book Now
                </Link>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-sand-400 text-sm hover:text-sand-50 transition-colors"
                >
                  Sign out
                </button>
                <Link
                  href="/dashboard"
                  className="bg-turq-600 hover:bg-turq-500 text-ink-950 px-5 py-2 rounded-full text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 -mr-2 text-ink-950/70 hover:text-ink-950 transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-ink-950/10 bg-sand-50 shadow-xl">
          <div className="max-w-[1600px] mx-auto px-6 py-4 space-y-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block py-3 text-sm text-ink-950/70 hover:text-ink-950 transition-colors border-b border-ink-950/5 last:border-0"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 flex flex-col gap-3">
              {!isSignedIn ? (
                <>
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="text-center py-3 border border-ink-950/15 rounded-full text-sm text-ink-950 hover:bg-ink-950/5 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setIsOpen(false)}
                    className="text-center py-3 bg-turq-600 hover:bg-turq-500 rounded-full text-sm font-medium text-ink-950 transition-colors"
                  >
                    Book Now
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="text-center py-3 bg-turq-600 hover:bg-turq-500 rounded-full text-sm font-medium text-ink-950 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsOpen(false);
                      await handleSignOut();
                    }}
                    className="text-center py-3 border border-ink-950/15 rounded-full text-sm text-ink-950 hover:bg-ink-950/5 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

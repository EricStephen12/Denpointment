"use client";

import Link from "next/link";
import { CLINIC_NAME, CLINIC_ADDRESS, CLINIC_PHONE, CLINIC_HOURS } from "@/lib/constants";
import type { PersonWithRoles } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";

type Props = {
  clinicName?: string;
  address?: string;
  phone?: string;
  hoursLabel?: string;
  user?: PersonWithRoles | null;
};

export default function MarketingFooter({
  clinicName = CLINIC_NAME,
  address = CLINIC_ADDRESS,
  phone = CLINIC_PHONE,
  hoursLabel = CLINIC_HOURS,
  user = null,
}: Props) {
  const isSignedIn = !!user;

  return (
    <footer className="bg-ink-950 text-sand-50 pt-32 pb-12 px-6 md:px-12 border-t hairline">
      <div className="max-w-[1800px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-32">
          <div className="md:col-span-4">
            <h4 className="text-turq-300 text-xs tracking-[0.3em] uppercase mb-8">Contact</h4>
            <ul className="space-y-4 text-sm tracking-wide text-sand-50/70">
              <li>{address}</li>
              <li>
                <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-turq-400 transition-colors">
                  {phone}
                </a>
              </li>
              <li>{hoursLabel}</li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <h4 className="text-turq-300 text-xs tracking-[0.3em] uppercase mb-8">Explore</h4>
            <ul className="space-y-4 text-sm tracking-wide text-sand-50/70">
              <li><Link href="/#services" className="hover:text-turq-400 transition-colors">Services</Link></li>
              <li><Link href="/#pricing" className="hover:text-turq-400 transition-colors">Price List</Link></li>
              <li><Link href="/#team" className="hover:text-turq-400 transition-colors">Our Dentists</Link></li>
              <li><Link href="/#testimonials" className="hover:text-turq-400 transition-colors">Testimonials</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <h4 className="text-turq-300 text-xs tracking-[0.3em] uppercase mb-8">Portal</h4>
            <ul className="space-y-4 text-sm tracking-wide text-sand-50/70">
              {isSignedIn ? (
                <>
                  <li>
                    <Link href="/dashboard" className="hover:text-turq-400 transition-colors">
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={async () => {
                        await logoutAction();
                        window.location.href = "/";
                      }}
                      className="hover:text-turq-400 transition-colors cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link href="/dashboard/book" className="hover:text-turq-400 transition-colors">
                      Book Appointment
                    </Link>
                  </li>
                  <li>
                    <Link href="/login" className="hover:text-turq-400 transition-colors">
                      Patient Login
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-end justify-between gap-8 border-t hairline pt-12">
          <Link href="/" className="font-display text-[8vw] md:text-[6vw] leading-[0.8] tracking-tight uppercase text-sand-50 hover:text-turq-300 transition-colors">
            {clinicName}
          </Link>

          <div className="text-[10px] tracking-[0.3em] uppercase text-sand-50/40 text-right space-y-2">
            <p>&copy; {new Date().getFullYear()} {clinicName}.</p>
            <p>ALL RIGHTS RESERVED.</p>
            <p className="normal-case tracking-normal">
              <Link href="/privacy" className="hover:text-sand-50/70">Privacy</Link>
              {" · "}
              <Link href="/terms" className="hover:text-sand-50/70">Terms</Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  CalendarPlus,
  ChevronRight,
} from "lucide-react";
import type { PersonWithRoles } from "@/lib/auth";

type TopbarProps = {
  user: PersonWithRoles | null;
  clinicName: string;
  onOpenMobileSidebar: () => void;
};

export default function DashboardTopbar({
  user,
  clinicName,
  onOpenMobileSidebar,
}: TopbarProps) {
  const pathname = usePathname();

  // Determine friendly page title from pathname
  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Overview";
    if (pathname.includes("/admin/staff")) return "Staff & Permissions";
    if (pathname.includes("/admin/automations")) return "Automations & Broadcasts";
    if (pathname.includes("/admin/billing")) return "Billing & Ledger";
    if (pathname.includes("/admin/settings")) return "Clinic Settings";
    if (pathname.includes("/admin/site")) return "Website Branding";
    if (pathname.includes("/treatments/today")) return "Today's Schedule";
    if (pathname.includes("/treatments/upcoming")) return "Upcoming Treatments";
    if (pathname.includes("/treatments/past")) return "Past Treatments";
    if (pathname.includes("/patients")) return "Patient Directory";
    if (pathname.includes("/book")) return "Book Appointment";
    if (pathname.includes("/appointments")) return "My Appointments";
    if (pathname.includes("/holidays")) return "Clinic Holidays";
    if (pathname.includes("/profile")) return "Profile & Account";
    return "Dashboard";
  };

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "U";

  return (
    <header className="sticky top-0 z-30 h-16 w-full backdrop-blur-xl bg-ink-950/70 border-b border-sand-50/10 px-4 md:px-8 flex items-center justify-between">
      {/* Left section: mobile trigger & page breadcrumbs */}
      <div className="flex items-center gap-3 md:gap-4">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 rounded-xl text-sand-50/70 hover:text-sand-50 hover:bg-sand-50/10 transition-colors border border-sand-50/10"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 text-xs md:text-sm">
          <Link
            href="/dashboard"
            className="text-sand-50/40 hover:text-sand-50/70 transition-colors hidden sm:inline"
          >
            Dashboard
          </Link>
          <ChevronRight className="h-3 w-3 text-sand-50/20 hidden sm:inline" />
          <span className="font-semibold text-sand-50 font-display">
            {getPageTitle()}
          </span>
        </div>
      </div>

      {/* Right section: live status & quick actions */}
      <div className="flex items-center gap-3">
        {/* Subtle System Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-sand-50/[0.04] border border-sand-50/10 text-sand-50/50 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>System Online</span>
        </div>

        {/* Quick Book CTA */}
        <Link
          href="/dashboard/book"
          className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/15 text-sand-50 border border-white/10 text-xs font-medium px-3.5 py-1.5 rounded-xl transition-all shadow-sm"
        >
          <CalendarPlus className="h-3.5 w-3.5 text-turq-400" />
          <span className="hidden sm:inline">Book Appointment</span>
          <span className="sm:hidden">Book</span>
        </Link>

        {/* User initials bubble linking to profile */}
        <Link
          href="/dashboard/profile"
          title="View Profile"
          className="w-8 h-8 rounded-full bg-turq-500/15 border border-turq-500/25 text-turq-300 flex items-center justify-center font-semibold text-xs shadow-sm hover:border-turq-400/40 transition-all"
        >
          {initials}
        </Link>
      </div>
    </header>
  );
}

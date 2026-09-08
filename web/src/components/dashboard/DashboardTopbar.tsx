"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  CalendarPlus,
  Clock,
  Sparkles,
  ChevronRight,
  Shield,
  Stethoscope,
  Headset,
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
    if (pathname === "/dashboard") return "Practice Overview";
    if (pathname.includes("/admin/staff")) return "Staff & Roles";
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
    if (pathname.includes("/profile")) return "Profile & Health Record";
    return "Dashboard";
  };

  const isAdmin = (user?.admins?.length ?? 0) > 0;
  const isDentist = (user?.dentists?.length ?? 0) > 0;
  const isReceptionist = (user?.receptionists?.length ?? 0) > 0;

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "U";

  return (
    <header className="sticky top-0 z-30 h-16 w-full backdrop-blur-xl bg-ink-950/80 border-b border-sand-50/10 px-4 md:px-8 flex items-center justify-between">
      {/* Left section: mobile trigger & page breadcrumbs */}
      <div className="flex items-center gap-3 md:gap-4">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 rounded-xl text-sand-50/70 hover:text-sand-50 hover:bg-sand-50/10 transition-colors border border-sand-50/10"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 text-xs md:text-sm">
          <Link
            href="/dashboard"
            className="text-sand-50/40 hover:text-sand-50/70 transition-colors hidden sm:inline"
          >
            Dashboard
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-sand-50/20 hidden sm:inline" />
          <span className="font-semibold text-sand-50 font-display">
            {getPageTitle()}
          </span>
        </div>
      </div>

      {/* Right section: live status & quick actions */}
      <div className="flex items-center gap-3">
        {/* Clinic Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Active Portal</span>
        </div>

        {/* Quick Book CTA */}
        <Link
          href="/dashboard/book"
          className="inline-flex items-center gap-1.5 bg-turq-600 hover:bg-turq-500 text-ink-950 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-md shadow-turq-600/10"
        >
          <CalendarPlus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Book Appointment</span>
          <span className="sm:hidden">Book</span>
        </Link>

        {/* User initials bubble linking to profile */}
        <Link
          href="/dashboard/profile"
          title="View Profile"
          className="w-8 h-8 rounded-full bg-gradient-to-tr from-turq-600 to-turq-400 text-ink-950 flex items-center justify-center font-bold text-xs shadow-sm hover:scale-105 transition-transform"
        >
          {initials}
        </Link>
      </div>
    </header>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarPlus,
  Calendar,
  Clock,
  Users,
  Zap,
  CreditCard,
  Settings,
  Globe,
  User,
  LogOut,
  X,
  ExternalLink,
  Activity,
  Sun,
  Stethoscope,
  CalendarCheck,
  LayoutGrid,
  ClipboardList,
  RefreshCw,
  FlaskConical,
  AlertCircle,
  BarChart2,
  Pill,
  Share2,
} from "lucide-react";
import type { PersonWithRoles } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";

type SidebarProps = {
  user: PersonWithRoles | null;
  clinicName: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function DashboardSidebar({ user, clinicName, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isAdmin        = (user?.admins?.length        ?? 0) > 0;
  const isDentist      = (user?.dentists?.length      ?? 0) > 0;
  const isReceptionist = (user?.receptionists?.length ?? 0) > 0;

  // Strict single role hierarchy: Admin > Dentist > Receptionist > Patient
  const role: "admin" | "dentist" | "receptionist" | "patient" = isAdmin
    ? "admin"
    : isDentist
    ? "dentist"
    : isReceptionist
    ? "receptionist"
    : "patient";

  const roleMeta = {
    admin: { label: "Admin", subtitle: "Administration", badgeClass: "bg-purple-500/10 text-purple-300 border-purple-500/20" },
    dentist: {
      label: `Dentist · Rm ${user?.dentists?.[0]?.roomNumber || "1"}`,
      subtitle: "Clinical Desk",
      badgeClass: "bg-turq-500/10 text-turq-300 border-turq-500/20",
    },
    receptionist: { label: "Receptionist", subtitle: "Front Desk", badgeClass: "bg-blue-500/10 text-blue-300 border-blue-500/20" },
    patient: { label: "Patient", subtitle: "Patient Portal", badgeClass: "bg-sand-50/10 text-sand-50/70 border-sand-50/15" },
  }[role];

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "U";

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logoutAction();
    window.location.href = "/login";
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const NavItem = ({
    href,
    icon: Icon,
    label,
    badge,
    stepNum,
  }: {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    badge?: string;
    stepNum?: number;
  }) => {
    const active = isActive(href);
    return (
      <Link
        href={href}
        onClick={onClose}
        className={`group relative flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs md:text-[13px] font-medium transition-all duration-150 ${
          active
            ? "bg-turq-500/15 text-sand-50 font-semibold border-l-2 border-turq-400 pl-3 shadow-sm"
            : "text-sand-50/65 hover:text-sand-50 hover:bg-white/[0.04]"
        }`}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          {stepNum ? (
            <span
              className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold shrink-0 transition-colors ${
                active ? "bg-turq-400 text-ink-950" : "bg-sand-50/10 text-sand-50/60 group-hover:text-sand-50"
              }`}
            >
              {stepNum}
            </span>
          ) : (
            <Icon
              className={`h-4 w-4 shrink-0 transition-colors ${
                active ? "text-turq-400" : "text-sand-50/40 group-hover:text-sand-50/80"
              }`}
            />
          )}
          <span className="truncate">{label}</span>
        </span>
        {badge && (
          <span className="text-[10px] bg-turq-500/20 text-turq-300 border border-turq-500/30 px-1.5 py-0.5 rounded-full font-semibold shrink-0">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  const SectionLabel = ({ label }: { label: string }) => (
    <div className="px-3.5 pt-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-sand-50/35 font-display">
      {label}
    </div>
  );

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-ink-950/95 border-r border-sand-50/10 flex flex-col backdrop-blur-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-sand-50/10 flex-shrink-0">
          <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2.5 group">
            <div className="p-2 rounded-xl bg-turq-500/10 border border-turq-500/20 text-turq-400 group-hover:bg-turq-500/15 transition-all">
              <Stethoscope className="h-4 w-4" />
            </div>
            <div>
              <span className="font-display text-base font-bold text-sand-50 tracking-tight block leading-none">
                {clinicName}
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-turq-400/80 mt-1 block">
                {roleMeta.subtitle}
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="lg:hidden p-1.5 rounded-lg text-sand-50/50 hover:text-sand-50 hover:bg-sand-50/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav Items (STRICTLY SCOPED TO THIS EXACT ROLE - ZERO OVERLAPS) */}
        <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-1 custom-scrollbar">
          {/* Overview */}
          <NavItem href="/dashboard" icon={LayoutDashboard} label="Overview" />

          {/* ══════════════ 1. ADMIN ONLY ══════════════ */}
          {role === "admin" && (
            <>
              <SectionLabel label="Daily Clinic Flow" />
              <NavItem href="/dashboard/reception/calendar" icon={LayoutGrid} label="Calendar & Schedule" stepNum={1} />
              <NavItem href="/dashboard/reception/checkin" icon={CalendarCheck} label="Check-In Desk" stepNum={2} />
              <NavItem href="/dashboard/treatments/today" icon={Clock} label="Today's Treatments" stepNum={3} />
              <NavItem href="/dashboard/admin/billing" icon={CreditCard} label="Billing & Payments" stepNum={4} />
              <NavItem href="/dashboard/reception/recalls" icon={RefreshCw} label="Recalls & Follow-up" stepNum={5} />

              <SectionLabel label="Practice Management" />
              <NavItem href="/dashboard/patients" icon={Users} label="Patient Registry" />
              <NavItem href="/dashboard/admin/staff" icon={Users} label="Staff & Permissions" />
              <NavItem href="/dashboard/admin/settings" icon={Settings} label="Hours & Pricing" />
              <NavItem href="/dashboard/admin/reports" icon={BarChart2} label="Financial Reports" />
              <NavItem href="/dashboard/admin/outstanding" icon={AlertCircle} label="Outstanding Balances" />
              <NavItem href="/dashboard/admin/site" icon={Globe} label="Website & Branding" />
              <NavItem href="/dashboard/admin/automations" icon={Zap} label="Reminders & Campaigns" />
              <NavItem href="/dashboard/clinical/labs" icon={FlaskConical} label="Dental Lab Cases" />
              <NavItem href="/dashboard/reception/waitlist" icon={ClipboardList} label="Waiting List" />
            </>
          )}

          {/* ══════════════ 2. RECEPTIONIST ONLY ══════════════ */}
          {role === "receptionist" && (
            <>
              <SectionLabel label="Front Desk Flow" />
              <NavItem href="/dashboard/reception/checkin" icon={CalendarCheck} label="Check-In Desk" stepNum={1} />
              <NavItem href="/dashboard/reception/calendar" icon={LayoutGrid} label="Multi-Dentist Calendar" stepNum={2} />
              <NavItem href="/dashboard/treatments/today" icon={Clock} label="Today's Appointments" stepNum={3} />
              <NavItem href="/dashboard/book" icon={CalendarPlus} label="Book Appointment" stepNum={4} />
              <NavItem href="/dashboard/reception/waitlist" icon={ClipboardList} label="Waiting List" stepNum={5} />

              <SectionLabel label="Patients & Cash Desk" />
              <NavItem href="/dashboard/patients" icon={Users} label="Patient Registry" />
              <NavItem href="/dashboard/admin/billing" icon={CreditCard} label="Invoicing & Payments" />
              <NavItem href="/dashboard/admin/outstanding" icon={AlertCircle} label="Outstanding Balances" />
              <NavItem href="/dashboard/reception/recalls" icon={RefreshCw} label="Recall Call List" />
            </>
          )}

          {/* ══════════════ 3. DENTIST ONLY ══════════════ */}
          {role === "dentist" && (
            <>
              <SectionLabel label="My Clinical Chair" />
              <NavItem href="/dashboard/treatments/today" icon={Clock} label="Today's Schedule & Chair" />
              <NavItem href="/dashboard/treatments/upcoming" icon={Calendar} label="Upcoming Visits" />
              <NavItem href="/dashboard/treatments/past" icon={Activity} label="Past Treatments" />
              <NavItem href="/dashboard/patients" icon={Users} label="Patient Dental Charts" />

              <SectionLabel label="Clinical Tools" />
              <NavItem href="/dashboard/clinical/labs" icon={FlaskConical} label="Dental Lab Cases" />
              <NavItem href="/dashboard/clinical/referrals" icon={Share2} label="Specialist Referrals" />
              <NavItem href="/dashboard/holidays" icon={Sun} label="My Time-off & Holidays" />
            </>
          )}

          {/* ══════════════ 4. PATIENT ONLY ══════════════ */}
          {role === "patient" && (
            <>
              <SectionLabel label="Appointments" />
              <NavItem href="/dashboard/book" icon={CalendarPlus} label="Book Appointment" />
              <NavItem href="/dashboard/appointments" icon={Calendar} label="My Appointments" />

              <SectionLabel label="My Dental Care" />
              <NavItem href="/dashboard/portal/plan" icon={ClipboardList} label="Treatment Plan" />
              <NavItem href="/dashboard/portal/prescriptions" icon={Pill} label="Prescriptions" />
              <NavItem href="/dashboard/portal/bills" icon={CreditCard} label="Bills & Payments" />
              <NavItem href="/dashboard/portal/contact" icon={Share2} label="Update Contact Details" />
            </>
          )}

          {/* ══════════════ MY ACCOUNT (All Roles) ══════════════ */}
          <SectionLabel label="My Account" />
          <NavItem href="/dashboard/profile" icon={User} label="Profile & Settings" />
          {role === "admin" && (
            <NavItem href="/dashboard/book" icon={CalendarPlus} label="Book Appointment" />
          )}

          {/* View public website link */}
          <div className="pt-3">
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-sand-50/40 hover:text-sand-50 hover:bg-sand-50/[0.04] transition-colors border border-dashed border-sand-50/10"
            >
              <span className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-turq-400" />
                View Public Website
              </span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </Link>
          </div>
        </div>

        {/* User Footer with Single Explicit Role Badge */}
        <div className="p-3.5 border-t border-sand-50/10 bg-black/40 flex-shrink-0">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-8 h-8 rounded-full bg-turq-500/15 border border-turq-500/25 text-turq-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-sand-50 truncate">
                {user ? `${user.firstName} ${user.lastName}` : "Clinic User"}
              </div>
              <div className="mt-0.5">
                <span className={`inline-block text-[10px] px-2 py-0.2 rounded-full font-semibold border ${roleMeta.badgeClass}`}>
                  {roleMeta.label}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            disabled={isLoggingOut}
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-sand-50/60 hover:text-red-400 hover:bg-red-950/20 border border-sand-50/10 hover:border-red-900/30 transition-all disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            {isLoggingOut ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      </aside>
    </>
  );
}

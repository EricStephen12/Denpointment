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
  Sparkles,
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
} from "lucide-react";
import type { PersonWithRoles } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";

type SidebarProps = {
  user: PersonWithRoles | null;
  clinicName: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function DashboardSidebar({
  user,
  clinicName,
  isOpen,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isAdmin = (user?.admins?.length ?? 0) > 0;
  const isDentist = (user?.dentists?.length ?? 0) > 0;
  const isReceptionist = (user?.receptionists?.length ?? 0) > 0;
  const isPurePatient = !isAdmin && !isDentist && !isReceptionist;

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "U";

  let primaryRoleLabel = "Patient";
  let primaryRoleBadgeClass = "bg-sand-50/5 text-sand-50/60 border-sand-50/10";
  if (isAdmin) {
    primaryRoleLabel = "Admin";
    primaryRoleBadgeClass = "bg-purple-500/10 text-purple-300 border-purple-500/20";
  } else if (isDentist) {
    primaryRoleLabel = `Dentist (Room ${user?.dentists?.[0]?.roomNumber || "1"})`;
    primaryRoleBadgeClass = "bg-turq-500/10 text-turq-300 border-turq-500/20";
  } else if (isReceptionist) {
    primaryRoleLabel = "Receptionist";
    primaryRoleBadgeClass = "bg-blue-500/10 text-blue-300 border-blue-500/20";
  }

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logoutAction();
    window.location.href = "/login";
  };

  const isLinkActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const NavItem = ({
    href,
    icon: Icon,
    label,
  }: {
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
  }) => {
    const active = isLinkActive(href);
    return (
      <Link
        href={href}
        onClick={onClose}
        className={`group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs md:text-[13px] font-medium transition-all duration-150 ${
          active
            ? "bg-white/[0.08] text-sand-50 font-semibold border-l-2 border-turq-400 pl-3 shadow-sm"
            : "text-sand-50/60 hover:text-sand-50 hover:bg-white/[0.04]"
        }`}
      >
        <Icon
          className={`h-4 w-4 transition-colors ${
            active ? "text-turq-400" : "text-sand-50/40 group-hover:text-sand-50/80"
          }`}
        />
        <span>{label}</span>
      </Link>
    );
  };

  const SectionLabel = ({ label }: { label: string }) => (
    <div className="px-3 pt-5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-sand-50/35">
      {label}
    </div>
  );

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-ink-950/95 border-r border-sand-50/10 flex flex-col backdrop-blur-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-18 px-6 flex items-center justify-between border-b border-sand-50/10 flex-shrink-0">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center gap-3 group"
          >
            <div className="p-2 rounded-xl bg-turq-500/10 border border-turq-500/20 text-turq-400 group-hover:bg-turq-500/15 transition-all">
              <Stethoscope className="h-4 w-4" />
            </div>
            <div>
              <span className="font-display text-base font-bold text-sand-50 tracking-tight block leading-none">
                {clinicName}
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-sand-50/40 mt-1 block">
                Practice Portal
              </span>
            </div>
          </Link>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-sand-50/50 hover:text-sand-50 hover:bg-sand-50/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Content (Scrollable with subtle custom scrollbar) */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar">
          {/* Main Group */}
          <SectionLabel label="General" />
          <NavItem href="/dashboard" icon={LayoutDashboard} label="Overview" />
          <NavItem href="/dashboard/book" icon={CalendarPlus} label="Book Appointment" />
          {isPurePatient && (
            <NavItem
              href="/dashboard/appointments"
              icon={Calendar}
              label="My Appointments"
            />
          )}

          {/* Admin Management Group */}
          {isAdmin && (
            <>
              <SectionLabel label="Administration" />
              <NavItem
                href="/dashboard/admin/staff"
                icon={Users}
                label="Staff & Permissions"
              />
              <NavItem
                href="/dashboard/admin/automations"
                icon={Sparkles}
                label="Automations & Email"
              />
              <NavItem
                href="/dashboard/admin/billing"
                icon={CreditCard}
                label="Billing & Ledger"
              />
              <NavItem
                href="/dashboard/admin/settings"
                icon={Settings}
                label="Clinic Hours & Rules"
              />
              <NavItem
                href="/dashboard/admin/site"
                icon={Globe}
                label="Website & Branding"
              />
            </>
          )}

          {/* Clinical / Dentist Group */}
          {isDentist && (
            <>
              <SectionLabel label="Clinical Desk" />
              <NavItem
                href="/dashboard/treatments/today"
                icon={Clock}
                label="Today's Schedule"
              />
              <NavItem
                href="/dashboard/treatments/upcoming"
                icon={Calendar}
                label="Upcoming Appointments"
              />
              <NavItem
                href="/dashboard/treatments/past"
                icon={Activity}
                label="Past Treatments"
              />
              <NavItem
                href="/dashboard/patients"
                icon={Users}
                label="Patients & Records"
              />
              <NavItem
                href="/dashboard/statistics/patients"
                icon={Activity}
                label="Patient Analytics"
              />
              <NavItem
                href="/dashboard/statistics/dentists"
                icon={Activity}
                label="Dentist Analytics"
              />
              <NavItem
                href="/dashboard/holidays"
                icon={Sun}
                label="Holidays & Off-Days"
              />
            </>
          )}

          {/* Receptionist Group */}
          {isReceptionist && !isDentist && (
            <>
              <SectionLabel label="Reception" />
              <NavItem
                href="/dashboard/treatments/today"
                icon={Clock}
                label="Today's Schedule"
              />
              <NavItem
                href="/dashboard/patients"
                icon={Users}
                label="Patient Registry"
              />
              {!isAdmin && (
                <NavItem
                  href="/dashboard/admin/billing"
                  icon={CreditCard}
                  label="Invoicing & Payments"
                />
              )}
            </>
          )}

          {/* Profile & Health Records */}
          <SectionLabel label="My Account" />
          <NavItem href="/dashboard/profile" icon={User} label="Profile & Settings" />

          {/* Jump to public landing page */}
          <div className="pt-4">
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-sand-50/40 hover:text-sand-50 hover:bg-sand-50/[0.04] transition-colors border border-dashed border-sand-50/10"
            >
              <span className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-turq-400" />
                <span>View Public Website</span>
              </span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </Link>
          </div>
        </div>

        {/* User Card & Sign Out Footer */}
        <div className="p-4 border-t border-sand-50/10 bg-black/40 flex-shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-turq-500/15 border border-turq-500/25 text-turq-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-sand-50 truncate">
                {user ? `${user.firstName} ${user.lastName}` : "Signed In User"}
              </div>
              <div className="text-[11px] text-sand-50/40 truncate">
                {user?.email || ""}
              </div>
              <div className="mt-1">
                <span
                  className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium border ${primaryRoleBadgeClass}`}
                >
                  {primaryRoleLabel}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={isLoggingOut}
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-sand-50/60 hover:text-red-400 hover:bg-red-950/20 border border-sand-50/10 hover:border-red-900/30 transition-all disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}

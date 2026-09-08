"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown, Stethoscope, LogOut, User as UserIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { CLINIC_NAME } from '@/lib/constants';
import type { PersonWithRoles } from '@/lib/auth';
import { logoutAction } from '@/app/actions/auth';

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
        isActive
          ? 'bg-sand-50/10 text-sand-50'
          : 'text-sand-50/60 hover:text-sand-50 hover:bg-sand-50/8'
      }`}
    >
      {children}
    </Link>
  );
}

function DropdownMenu({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-sand-50/60 hover:text-sand-50 hover:bg-sand-50/8 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
      >
        {label}
        <ChevronDown className={`h-4 w-4 opacity-50 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 rounded-2xl shadow-xl bg-ink-900 border border-sand-50/10 z-50"
        >
          <div className="p-2">{children}</div>
        </div>
      )}
    </div>
  );
}

function UserMenu({ user }: { user: PersonWithRoles | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const initials =
    `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U";
  const role = user.admins.length
    ? "Admin"
    : user.dentists.length
    ? "Dentist"
    : user.receptionists.length
    ? "Front Desk"
    : "Patient";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-full bg-turq-600/20 hover:bg-turq-600/30 text-turq-300 border border-turq-400/30 flex items-center justify-center font-display text-xs tracking-wider transition-all cursor-pointer"
        aria-label="User account menu"
      >
        {initials}
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="absolute right-0 mt-3 w-56 rounded-2xl shadow-2xl bg-ink-900 border border-sand-50/10 py-2 z-50 animate-fade-in"
        >
          <div className="px-4 py-2 border-b border-sand-50/10">
            <p className="text-sm font-medium text-sand-50 truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-turq-400 uppercase tracking-wider mt-0.5">
              {role}
            </p>
          </div>
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-sand-50/80 hover:text-sand-50 hover:bg-sand-50/5 transition-colors"
          >
            <UserIcon className="w-4 h-4 text-sand-50/40" />
            <span>My Profile</span>
          </Link>
          <button
            onClick={async () => {
              await logoutAction();
              window.location.href = "/";
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar({
  user,
  clinicName = CLINIC_NAME,
}: {
  user: PersonWithRoles | null;
  clinicName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const isAdmin = (user?.admins?.length ?? 0) > 0;
  const isReceptionist = (user?.receptionists?.length ?? 0) > 0;
  const isDentist = (user?.dentists?.length ?? 0) > 0;
  const brandWord = clinicName.split(" ")[0];
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsOpen(false);
  }

  return (
    <nav className="sticky top-0 z-40 w-full backdrop-blur-xl bg-ink-950/80 border-b border-sand-50/10">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="p-2 bg-turq-600/20 rounded-xl group-hover:bg-turq-600/30 transition-colors">
                <Stethoscope className="h-6 w-6 text-turq-400" />
              </div>
              <span className="font-display text-2xl tracking-tight lowercase text-sand-50">{brandWord}</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-2">
              <NavLink href="/dashboard">Home</NavLink>

              {isAdmin && <NavLink href="/dashboard/admin/staff">Staff</NavLink>}
              {isAdmin && <NavLink href="/dashboard/admin/billing">Billing</NavLink>}
              {isAdmin && <NavLink href="/dashboard/admin/automations">Automations</NavLink>}
              {isAdmin && <NavLink href="/dashboard/admin/settings">Settings</NavLink>}
              {isAdmin && <NavLink href="/dashboard/admin/site">Website</NavLink>}
              {isReceptionist && <NavLink href="/dashboard/treatments/today">Today&apos;s Schedule</NavLink>}
              {isReceptionist && <NavLink href="/dashboard/patients">Patients</NavLink>}
              {isReceptionist && <NavLink href="/dashboard/admin/billing">Billing</NavLink>}

              {/* Appointments Dropdown */}
              <DropdownMenu label="Appointments">
                <Link href="/dashboard/book" className="block px-4 py-2.5 rounded-xl text-sm font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50 transition-colors">
                  Book an appointment
                </Link>
                {!isAdmin && !isReceptionist && !isDentist && (
                  <Link href="/dashboard/appointments" className="block px-4 py-2.5 rounded-xl text-sm font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50 transition-colors">
                    My Appointments
                  </Link>
                )}
              </DropdownMenu>

              {isDentist && (
                <>
                  <DropdownMenu label="Treatments">
                    <Link href="/dashboard/treatments/upcoming" className="block px-4 py-2.5 rounded-xl text-sm font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50 transition-colors">Upcoming appointments</Link>
                    <Link href="/dashboard/treatments/today" className="block px-4 py-2.5 rounded-xl text-sm font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50 transition-colors">Today&apos;s appointments</Link>
                    <Link href="/dashboard/treatments/past" className="block px-4 py-2.5 rounded-xl text-sm font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50 transition-colors">Past treatments</Link>
                  </DropdownMenu>

                  <DropdownMenu label="Statistics">
                    <Link href="/dashboard/statistics/patients" className="block px-4 py-2.5 rounded-xl text-sm font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50 transition-colors">Patients</Link>
                    <Link href="/dashboard/statistics/dentists" className="block px-4 py-2.5 rounded-xl text-sm font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50 transition-colors">Dentists</Link>
                  </DropdownMenu>

                  <NavLink href="/dashboard/holidays">Holidays</NavLink>
                  <NavLink href="/dashboard/patients">Patients / Chart</NavLink>
                </>
              )}

              <NavLink href="/dashboard/profile">My Profile</NavLink>
            </div>
          </div>

          {/* User Profile / Auth Button */}
          <div className="hidden md:flex items-center gap-4">
            <div className="h-8 w-px bg-sand-50/10"></div>
            <UserMenu user={user} />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <UserMenu user={user} />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="ml-2 inline-flex items-center justify-center p-2 rounded-xl text-sand-50/60 hover:text-sand-50 hover:bg-sand-50/8 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-sand-50/10 bg-ink-900 absolute w-full shadow-2xl">
          <div className="p-4 space-y-2">
            <Link href="/dashboard" className="block px-4 py-3 rounded-xl text-base font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50">Home</Link>

            {isAdmin && (
              <>
                <Link href="/dashboard/admin/staff" className="block px-4 py-3 rounded-xl text-base font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50">Staff Management</Link>
                <Link href="/dashboard/admin/billing" className="block px-4 py-3 rounded-xl text-base font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50">Billing</Link>
                <Link href="/dashboard/admin/automations" className="block px-4 py-3 rounded-xl text-base font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50">Automations & Marketing</Link>
                <Link href="/dashboard/admin/settings" className="block px-4 py-3 rounded-xl text-base font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50">Clinic Settings</Link>
                <Link href="/dashboard/admin/site" className="block px-4 py-3 rounded-xl text-base font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50">Website</Link>
              </>
            )}

              {isDentist && (
              <>
                <Link href="/dashboard/treatments/today" className="block px-4 py-3 rounded-xl text-base font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50">Today&apos;s Appointments</Link>
                <Link href="/dashboard/treatments/upcoming" className="block px-4 py-3 rounded-xl text-base font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50">Upcoming Appointments</Link>
                <Link href="/dashboard/treatments/past" className="block px-4 py-3 rounded-xl text-base font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50">Past Treatments</Link>
                <Link href="/dashboard/patients" className="block px-4 py-3 rounded-xl text-base font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50">Patients</Link>
                <Link href="/dashboard/statistics/patients" className="block px-4 py-3 rounded-xl text-base font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50">Patient Statistics</Link>
                <Link href="/dashboard/statistics/dentists" className="block px-4 py-3 rounded-xl text-base font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50">Dentist Statistics</Link>
                <Link href="/dashboard/holidays" className="block px-4 py-3 rounded-xl text-base font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50">Holidays</Link>
              </>
            )}

            {isReceptionist && (
              <>
                <Link href="/dashboard/treatments/today" className="block px-4 py-3 rounded-xl text-base font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50">Today&apos;s Schedule</Link>
                <Link href="/dashboard/patients" className="block px-4 py-3 rounded-xl text-base font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50">Patients</Link>
                <Link href="/dashboard/admin/billing" className="block px-4 py-3 rounded-xl text-base font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50">Billing</Link>
              </>
            )}

            <Link href="/dashboard/book" className="block px-4 py-3 rounded-xl text-base font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50">Book Appointment</Link>
            {!isDentist && !isReceptionist && !isAdmin && (
              <Link href="/dashboard/appointments" className="block px-4 py-3 rounded-xl text-base font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50">My Appointments</Link>
            )}
            <Link href="/dashboard/profile" className="block px-4 py-3 rounded-xl text-base font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50">My Profile</Link>
            <button
              onClick={async () => {
                await logoutAction();
                window.location.href = "/";
              }}
              className="w-full text-left px-4 py-3 rounded-xl text-base font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

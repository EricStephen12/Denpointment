"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { UserButton } from "@clerk/nextjs";
import { Menu, X, ChevronDown, Stethoscope } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { CLINIC_NAME } from '@/lib/constants';
import type { PersonWithRoles } from '@/lib/auth';

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

export default function Navbar({ user }: { user: PersonWithRoles | null }) {
  const [isOpen, setIsOpen] = useState(false);

  const isAdmin = (user?.admins?.length ?? 0) > 0;
  const isReceptionist = (user?.receptionists?.length ?? 0) > 0;
  const isDentist = (user?.dentists?.length ?? 0) > 0;

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
              <span className="font-display text-2xl tracking-tight lowercase text-sand-50">{CLINIC_NAME.split(" ")[0]}</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-2">
              <NavLink href="/dashboard">Home</NavLink>

              {isAdmin && <NavLink href="/dashboard/admin/staff">Staff</NavLink>}
              {isAdmin && <NavLink href="/dashboard/admin/billing">Billing</NavLink>}
              {isAdmin && <NavLink href="/dashboard/admin/settings">Settings</NavLink>}
              {isReceptionist && <NavLink href="/dashboard/treatments/today">Today&apos;s Schedule</NavLink>}
              {isReceptionist && <NavLink href="/dashboard/patients">Patients</NavLink>}
              {isReceptionist && <NavLink href="/dashboard/admin/billing">Billing</NavLink>}

              {/* Appointments Dropdown (patients: book + view own; staff: book on behalf of patients) */}
              <div className="relative group">
                <button className="flex items-center gap-1 text-sand-50/60 hover:text-sand-50 hover:bg-sand-50/8 px-3 py-2 rounded-xl text-sm font-medium transition-colors">
                  Appointments
                  <ChevronDown className="h-4 w-4 opacity-50 group-hover:rotate-180 transition-transform duration-200" />
                </button>
                <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 rounded-2xl shadow-xl bg-ink-900 border border-sand-50/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 transform origin-top group-hover:translate-y-1">
                  <div className="p-2">
                    <Link href="/dashboard/book" className="block px-4 py-2.5 rounded-xl text-sm font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50 transition-colors">
                      Book an appointment
                    </Link>
                    {!isAdmin && !isReceptionist && !isDentist && (
                      <Link href="/dashboard/appointments" className="block px-4 py-2.5 rounded-xl text-sm font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50 transition-colors">
                        My Appointments
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {isDentist && (
                <>
                  <div className="relative group">
                    <button className="flex items-center gap-1 text-sand-50/60 hover:text-sand-50 hover:bg-sand-50/8 px-3 py-2 rounded-xl text-sm font-medium transition-colors">
                      Treatments
                      <ChevronDown className="h-4 w-4 opacity-50 group-hover:rotate-180 transition-transform duration-200" />
                    </button>
                    <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 rounded-2xl shadow-xl bg-ink-900 border border-sand-50/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 transform origin-top group-hover:translate-y-1">
                      <div className="p-2">
                        <Link href="/dashboard/treatments/upcoming" className="block px-4 py-2.5 rounded-xl text-sm font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50 transition-colors">Upcoming appointments</Link>
                        <Link href="/dashboard/treatments/today" className="block px-4 py-2.5 rounded-xl text-sm font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50 transition-colors">Today&apos;s appointments</Link>
                        <Link href="/dashboard/treatments/past" className="block px-4 py-2.5 rounded-xl text-sm font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50 transition-colors">Past treatments</Link>
                      </div>
                    </div>
                  </div>

                  <div className="relative group">
                    <button className="flex items-center gap-1 text-sand-50/60 hover:text-sand-50 hover:bg-sand-50/8 px-3 py-2 rounded-xl text-sm font-medium transition-colors">
                      Statistics
                      <ChevronDown className="h-4 w-4 opacity-50 group-hover:rotate-180 transition-transform duration-200" />
                    </button>
                    <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 rounded-2xl shadow-xl bg-ink-900 border border-sand-50/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 transform origin-top group-hover:translate-y-1">
                      <div className="p-2">
                        <Link href="/dashboard/statistics/patients" className="block px-4 py-2.5 rounded-xl text-sm font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50 transition-colors">Patients</Link>
                        <Link href="/dashboard/statistics/dentists" className="block px-4 py-2.5 rounded-xl text-sm font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50 transition-colors">Dentists</Link>
                      </div>
                    </div>
                  </div>

                  <NavLink href="/dashboard/holidays">Holidays</NavLink>
                </>
              )}

              <NavLink href="/dashboard/profile">My Profile</NavLink>
            </div>
          </div>

          {/* User Profile / Auth Button */}
          <div className="hidden md:flex items-center gap-4">
            <div className="h-8 w-px bg-sand-50/10"></div>
            <UserButton appearance={{
              elements: { avatarBox: "w-10 h-10 ring-2 ring-sand-50/10" }
            }}/>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <UserButton />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="ml-4 inline-flex items-center justify-center p-2 rounded-xl text-sand-50/60 hover:text-sand-50 hover:bg-sand-50/8 focus:outline-none"
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
                <Link href="/dashboard/admin/settings" className="block px-4 py-3 rounded-xl text-base font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50">Clinic Settings</Link>
              </>
            )}

            {isDentist && (
              <>
                <Link href="/dashboard/treatments/today" className="block px-4 py-3 rounded-xl text-base font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50">Today&apos;s Appointments</Link>
                <Link href="/dashboard/treatments/upcoming" className="block px-4 py-3 rounded-xl text-base font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50">Upcoming Appointments</Link>
                <Link href="/dashboard/treatments/past" className="block px-4 py-3 rounded-xl text-base font-medium text-sand-50/80 hover:bg-sand-50/8 hover:text-sand-50">Past Treatments</Link>
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
          </div>
        </div>
      )}
    </nav>
  );
}

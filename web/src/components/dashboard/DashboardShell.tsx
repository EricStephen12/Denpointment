"use client";

import React, { useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import type { PersonWithRoles } from "@/lib/auth";

export default function DashboardShell({
  children,
  user,
  clinicName,
  clinicYear,
}: {
  children: React.ReactNode;
  user: PersonWithRoles | null;
  clinicName: string;
  clinicYear: number;
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ink-950 text-sand-50 font-sans relative overflow-x-hidden selection:bg-turq-400 selection:text-ink-950">

      {/* Left Sidebar */}
      <DashboardSidebar
        user={user}
        clinicName={clinicName}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area (Offset by Sidebar Width on Desktop) */}
      <div className="lg:pl-72 flex flex-col min-h-screen relative z-10">
        {/* Topbar */}
        <DashboardTopbar
          user={user}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        {/* Dynamic Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 lg:p-10">
          {children}
        </main>

        {/* Minimalist Dashboard Footer */}
        <footer className="border-t border-sand-50/10 py-5 px-4 sm:px-8 text-xs text-sand-50/30 bg-ink-950/40 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            {clinicName} &copy; {clinicYear}. All clinical records protected.
          </span>
          <span className="text-[11px] uppercase tracking-wider text-sand-50/25">
            Abuja · Nigeria
          </span>
        </footer>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import type { PersonWithRoles } from "@/lib/auth";

export default function DashboardShell({
  children,
  user,
  clinicName,
}: {
  children: React.ReactNode;
  user: PersonWithRoles | null;
  clinicName: string;
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ink-950 text-sand-50 font-sans relative overflow-x-hidden selection:bg-turq-400 selection:text-ink-950">
      {/* Subtle Background Glow Orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-turq-400/[0.03] blur-3xl" />
        <div className="absolute top-1/2 -left-48 w-[500px] h-[500px] rounded-full bg-turq-400/[0.02] blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-500/[0.02] blur-3xl" />
      </div>

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
          clinicName={clinicName}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        {/* Dynamic Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 lg:p-10">
          {children}
        </main>

        {/* Minimalist Dashboard Footer */}
        <footer className="border-t border-sand-50/10 py-6 px-4 sm:px-8 text-center sm:text-left text-xs text-sand-50/40 bg-ink-950/40 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            {clinicName} &copy; {new Date().getFullYear()}. All clinical records protected.
          </span>
          <span className="text-[11px] uppercase tracking-wider text-turq-400/60 font-semibold">
            High-Performance Portal
          </span>
        </footer>
      </div>
    </div>
  );
}

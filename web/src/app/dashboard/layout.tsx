import React from 'react';
import Navbar from '@/components/layout/Navbar';
import { getCurrentPerson } from '@/lib/auth';
import { CLINIC_NAME } from '@/lib/constants';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dbUser = await getCurrentPerson();

  return (
    <div className="bg-ink-950 text-sand-50 min-h-screen flex flex-col font-sans relative overflow-hidden selection:bg-turq-400 selection:text-ink-950">
      {/* Ambient gradient blobs — layered background depth */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-turq-400/[0.04] blur-3xl" />
        <div className="absolute top-1/2 -left-48 w-[500px] h-[500px] rounded-full bg-turq-400/[0.03] blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 w-[400px] h-[400px] rounded-full bg-turq-400/[0.02] blur-3xl" />
      </div>

      <Navbar user={dbUser} />

      <main className="relative z-10 flex-1 w-full pt-12 pb-24">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          {children}
        </div>
      </main>

      <footer className="relative z-10 bg-ink-950/80 backdrop-blur-sm border-t border-sand-50/10 py-10">
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-xs text-sand-50/40 tracking-[0.2em] uppercase">{CLINIC_NAME} &copy; 2026.</span>
          <span className="text-xs text-sand-50/40 tracking-wide uppercase">Premium Patient Portal</span>
        </div>
      </footer>
    </div>
  );
}
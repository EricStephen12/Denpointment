import React from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { getCurrentPerson } from "@/lib/auth";
import { getSiteContent } from "@/lib/site";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dbUser, site] = await Promise.all([
    getCurrentPerson(),
    getSiteContent(),
  ]);

  return (
    <DashboardShell user={dbUser} clinicName={site.clinicName}>
      {children}
    </DashboardShell>
  );
}

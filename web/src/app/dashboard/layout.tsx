import React from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { getCurrentPerson } from "@/lib/auth";
import { getSiteContent } from "@/lib/site";
import { getClinicDay } from "@/lib/clinic-date";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dbUser, site] = await Promise.all([
    getCurrentPerson(),
    getSiteContent(),
  ]);
  const clinicYear = getClinicDay().year;

  return (
    <DashboardShell user={dbUser} clinicName={site.clinicName} clinicYear={clinicYear}>
      {children}
    </DashboardShell>
  );
}

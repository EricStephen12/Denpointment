import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isAdmin } from "@/lib/auth";
import { getAutomationSettings } from "@/lib/automations";
import { isEmailConfigured } from "@/lib/email";
import { getSiteContent } from "@/lib/site";
import AutomationsManager from "@/components/automations/AutomationsManager";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export const metadata = {
  title: "Automations & Broadcasts | Admin Dashboard",
  description: "Manage automated birthday and anniversary greetings, and dispatch broadcasts via Resend.",
};

export default async function AdminAutomationsPage() {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isAdmin(dbUser)) redirect("/dashboard");

  const [settings, campaigns, site] = await Promise.all([
    getAutomationSettings(),
    prisma.broadcastCampaign.findMany({
      orderBy: { sentAt: "desc" },
      take: 50,
    }),
    getSiteContent(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        section="Communications"
        title="Automated Reminders & Campaigns"
        description="Configure automated lifecycle greetings and send clinic-wide broadcast announcements to patients."
      />

      <AutomationsManager
        initialSettings={settings}
        initialCampaigns={campaigns}
        isEmailConfigured={isEmailConfigured()}
        clinicName={site.clinicName}
      />
    </div>
  );
}

import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isAdmin } from "@/lib/auth";
import { getAutomationSettings } from "@/lib/automations";
import { isEmailConfigured } from "@/lib/email";
import { getSiteContent } from "@/lib/site";
import AutomationsManager from "@/components/automations/AutomationsManager";
import { Sparkles } from "lucide-react";

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-turq-500/20 text-turq-400">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h1 className="dash-title font-display text-2xl text-sand-50">Automations & Marketing</h1>
          <p className="dash-body text-xs text-sand-50/60 mt-0.5">
            Automated customer lifecycle emails (Birthdays & Milestones) and Resend broadcast campaigns.
          </p>
        </div>
      </div>

      <AutomationsManager
        initialSettings={settings}
        initialCampaigns={campaigns}
        isEmailConfigured={isEmailConfigured()}
        clinicName={site.clinicName}
      />
    </div>
  );
}

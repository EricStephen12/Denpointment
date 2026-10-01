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
    <div className="space-y-7">
      <AdminPageHeader
        section="Patient communication"
        title="Reminders and campaigns"
        description="Configure routine patient reminders and review one-off clinic announcements."
      />

      {/* Guide Banner */}
      <div className="dash-surface p-4 border border-turq-500/20 bg-turq-500/5 rounded-2xl">
        <h2 className="text-sm font-semibold text-sand-50 flex items-center gap-2">
          💡 How do Patient Reminders &amp; Broadcast Campaigns work?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 text-xs text-sand-50/70 leading-relaxed">
          <div className="p-3 rounded-xl bg-ink-900/60 border border-sand-50/10">
            <p className="font-semibold text-turq-300">1. Automated Lifecycle Greetings</p>
            <p className="mt-1 text-sand-50/60">
              When toggled on, the system automatically checks every morning and sends personalized emails to patients celebrating their <strong className="text-sand-50">Birthday</strong> or their <strong className="text-sand-50">Smile Anniversary</strong> (1 year since their first dental visit).
            </p>
          </div>
          <div className="p-3 rounded-xl bg-ink-900/60 border border-sand-50/10">
            <p className="font-semibold text-turq-300">2. Targeted Broadcast Campaigns</p>
            <p className="mt-1 text-sand-50/60">
              Use the <strong className="text-sand-50">New Broadcast</strong> tab to compose email announcements, holiday clinic closures, or promotional seasonal discounts (e.g., Teeth Whitening special) targeted to all patients, active patients, or lapsed patients.
            </p>
          </div>
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

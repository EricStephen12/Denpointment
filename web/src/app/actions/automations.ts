"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isAdmin } from "@/lib/auth";
import {
  getAutomationSettings,
  runDailyAutomations,
  dispatchBroadcastCampaign,
} from "@/lib/automations";

async function requireAdmin() {
  const person = await getCurrentPerson();
  if (!person || !isAdmin(person)) {
    throw new Error("Unauthorized: Admin privileges required.");
  }
  return person;
}

/**
 * Fetch automation settings for admin dashboard.
 */
export async function getAutomationSettingsAction() {
  await requireAdmin();
  return getAutomationSettings();
}

/**
 * Save updated automation settings.
 */
export async function saveAutomationSettingsAction(formData: FormData) {
  await requireAdmin();

  const birthdayEnabled = formData.get("birthdayEnabled") === "true";
  const birthdaySubject = ((formData.get("birthdaySubject") as string) || "").trim();
  const birthdayMessage = ((formData.get("birthdayMessage") as string) || "").trim();

  const anniversaryEnabled = formData.get("anniversaryEnabled") === "true";
  const anniversarySubject = ((formData.get("anniversarySubject") as string) || "").trim();
  const anniversaryMessage = ((formData.get("anniversaryMessage") as string) || "").trim();

  if (!birthdaySubject || !anniversarySubject) {
    return { error: "Email subject lines cannot be empty." };
  }

  await prisma.automationSettings.upsert({
    where: { id: 1 },
    update: {
      birthdayEnabled,
      birthdaySubject,
      birthdayMessage: birthdayMessage || null,
      anniversaryEnabled,
      anniversarySubject,
      anniversaryMessage: anniversaryMessage || null,
    },
    create: {
      id: 1,
      birthdayEnabled,
      birthdaySubject,
      birthdayMessage: birthdayMessage || null,
      anniversaryEnabled,
      anniversarySubject,
      anniversaryMessage: anniversaryMessage || null,
    },
  });

  revalidatePath("/dashboard/admin/automations");
  return { success: true };
}

/**
 * Manually trigger the daily automations sweep on demand.
 */
export async function triggerDailyAutomationsAction() {
  await requireAdmin();
  try {
    const stats = await runDailyAutomations();
    revalidatePath("/dashboard/admin/automations");
    return { success: true, stats };
  } catch (err: any) {
    console.error("Failed to run automations:", err);
    return { error: err?.message || "Failed to trigger automations." };
  }
}

/**
 * Dispatch a one-to-many broadcast or promo email blast.
 */
export async function sendBroadcastAction(formData: FormData) {
  await requireAdmin();

  const title = ((formData.get("title") as string) || "").trim();
  const subject = ((formData.get("subject") as string) || "").trim();
  const headline = ((formData.get("headline") as string) || "").trim();
  const content = ((formData.get("content") as string) || "").trim();
  const category = (formData.get("category") as "broadcast" | "promo") || "broadcast";
  const targetAudience = (formData.get("targetAudience") as "all" | "active" | "upcoming" | "inactive") || "all";
  const ctaLabel = ((formData.get("ctaLabel") as string) || "").trim();
  const ctaUrl = ((formData.get("ctaUrl") as string) || "").trim();

  if (!title || !subject || !content) {
    return { error: "Campaign title, email subject, and message content are required." };
  }

  try {
    const result = await dispatchBroadcastCampaign({
      title,
      subject,
      headline: headline || undefined,
      content,
      category,
      targetAudience,
      ctaLabel: ctaLabel || undefined,
      ctaUrl: ctaUrl || undefined,
    });

    revalidatePath("/dashboard/admin/automations");
    return { success: true, recipientCount: result.recipientCount };
  } catch (err: any) {
    console.error("Failed to dispatch broadcast campaign:", err);
    return { error: err?.message || "Failed to dispatch campaign." };
  }
}

/**
 * Fetch campaign history logs for admin table.
 */
export async function getCampaignHistoryAction() {
  await requireAdmin();
  return prisma.broadcastCampaign.findMany({
    orderBy: { sentAt: "desc" },
    take: 30,
  });
}

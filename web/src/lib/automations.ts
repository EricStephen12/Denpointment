import { prisma } from "@/lib/prisma";
import {
  sendBirthdayEmail,
  sendAnniversaryEmail,
  sendBroadcastEmail,
  isEmailConfigured,
} from "@/lib/email";
import { getClinicDay } from "@/lib/clinic-date";

export type AutomationSettingsData = {
  id: number;
  birthdayEnabled: boolean;
  birthdaySubject: string;
  birthdayMessage: string | null;
  anniversaryEnabled: boolean;
  anniversarySubject: string;
  anniversaryMessage: string | null;
  updatedAt: Date;
};

/**
 * Fetch or initialize the singleton automation configuration row.
 */
export async function getAutomationSettings(): Promise<AutomationSettingsData> {
  const existing = await prisma.automationSettings.findUnique({
    where: { id: 1 },
  });

  if (existing) return existing;

  return prisma.automationSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      birthdayEnabled: true,
      birthdaySubject: "Wishing You a Very Happy Birthday!",
      birthdayMessage:
        "May your day be filled with joy, laughter, and reasons to smile! Thank you for being a valued part of our clinic family.",
      anniversaryEnabled: true,
      anniversarySubject: "Happy Smile Anniversary!",
      anniversaryMessage:
        "Thank you for trusting our clinical team with your dental health. We celebrate your dental wellness milestone with us today!",
    },
  });
}

/**
 * Executes the daily sweep for Birthday and Anniversary automations.
 * Strictly guarantees that at most ONE greeting per category is sent to each patient per calendar year.
 */
export async function runDailyAutomations(): Promise<{
  birthdaysSent: number;
  anniversariesSent: number;
  eligibleBirthdays: number;
  eligibleAnniversaries: number;
  emailConfigured: boolean;
}> {
  const settings = await getAutomationSettings();
  const clinicDay = getClinicDay();
  const currentYear = clinicDay.year;
  const currentMonth = clinicDay.month;
  const currentDay = clinicDay.day;

  let birthdaysSent = 0;
  let anniversariesSent = 0;
  let eligibleBirthdays = 0;
  let eligibleAnniversaries = 0;

  // 1. Birthday Automation
  if (settings.birthdayEnabled) {
    const patients = await prisma.patient.findMany({
      include: {
        person: true,
      },
    });

    for (const patient of patients) {
      const birth = patient.person.birthDate;
      if (!birth || !patient.person.email) continue;

      // Check if birthday matches today (month 1-12, day 1-31)
      const bMonth = birth.getUTCMonth() + 1;
      const bDay = birth.getUTCDate();

      if (bMonth === currentMonth && bDay === currentDay) {
        eligibleBirthdays++;

        // Deduplication check: Has this person already received a birthday email this year?
        const alreadyDispatched = await prisma.automationDispatchLog.findUnique({
          where: {
            personId_type_year: {
              personId: patient.person.personId,
              type: "birthday",
              year: currentYear,
            },
          },
        });

        if (!alreadyDispatched) {
          await sendBirthdayEmail({
            to: patient.person.email,
            patientName: patient.person.firstName,
            subject: settings.birthdaySubject,
            customMessage: settings.birthdayMessage || undefined,
          });

          await prisma.automationDispatchLog.create({
            data: {
              personId: patient.person.personId,
              type: "birthday",
              year: currentYear,
            },
          });

          birthdaysSent++;
        }
      }
    }
  }

  // 2. Smile Anniversary Automation
  if (settings.anniversaryEnabled) {
    const patients = await prisma.patient.findMany({
      include: {
        person: true,
        appointments: {
          orderBy: [{ year: "asc" }, { month: "asc" }, { day: "asc" }],
          take: 1,
        },
      },
    });

    for (const patient of patients) {
      if (!patient.person.email) continue;
      const firstApp = patient.appointments[0];
      if (!firstApp) continue;

      // Check if first appointment month & day match today, and at least 1 full year has passed
      const yearsDiff = currentYear - firstApp.year;
      if (
        yearsDiff >= 1 &&
        firstApp.month === currentMonth &&
        firstApp.day === currentDay
      ) {
        eligibleAnniversaries++;

        const alreadyDispatched = await prisma.automationDispatchLog.findUnique({
          where: {
            personId_type_year: {
              personId: patient.person.personId,
              type: "anniversary",
              year: currentYear,
            },
          },
        });

        if (!alreadyDispatched) {
          await sendAnniversaryEmail({
            to: patient.person.email,
            patientName: patient.person.firstName,
            years: yearsDiff,
            subject: settings.anniversarySubject,
            customMessage: settings.anniversaryMessage || undefined,
          });

          await prisma.automationDispatchLog.create({
            data: {
              personId: patient.person.personId,
              type: "anniversary",
              year: currentYear,
            },
          });

          anniversariesSent++;
        }
      }
    }
  }

  return {
    birthdaysSent,
    anniversariesSent,
    eligibleBirthdays,
    eligibleAnniversaries,
    emailConfigured: isEmailConfigured(),
  };
}

/**
 * Dispatches a one-to-many broadcast announcement or promotional campaign.
 */
export async function dispatchBroadcastCampaign(params: {
  title: string;
  subject: string;
  headline?: string;
  content: string;
  category?: "broadcast" | "promo";
  targetAudience?: "all" | "active" | "upcoming" | "inactive";
  ctaLabel?: string;
  ctaUrl?: string;
}): Promise<{ campaignId: number; recipientCount: number }> {
  const {
    title,
    subject,
    headline,
    content,
    category = "broadcast",
    targetAudience = "all",
    ctaLabel,
    ctaUrl,
  } = params;

  const clinicDay = getClinicDay();

  // Resolve recipients based on target audience
  let patients = await prisma.patient.findMany({
    include: {
      person: true,
      appointments: true,
    },
  });

  // Filter out any without valid email
  patients = patients.filter((p) => p.person.email && p.person.email.includes("@"));

  if (targetAudience === "upcoming") {
    // Only patients with upcoming appointments today or in future
    patients = patients.filter((p) =>
      p.appointments.some(
        (a) =>
          a.year > clinicDay.year ||
          (a.year === clinicDay.year && a.month > clinicDay.month) ||
          (a.year === clinicDay.year && a.month === clinicDay.month && a.day >= clinicDay.day)
      )
    );
  } else if (targetAudience === "active") {
    // Patients with at least 1 appointment in the last 12 months
    patients = patients.filter((p) =>
      p.appointments.some((a) => a.year >= clinicDay.year - 1)
    );
  } else if (targetAudience === "inactive") {
    // Patients with no appointments in the last 12 months
    patients = patients.filter(
      (p) => !p.appointments.some((a) => a.year >= clinicDay.year - 1)
    );
  }

  let sentCount = 0;
  for (const patient of patients) {
    try {
      await sendBroadcastEmail({
        to: patient.person.email,
        patientName: patient.person.firstName,
        subject,
        headline,
        content,
        category,
        ctaLabel,
        ctaUrl,
      });
      sentCount++;
    } catch (err) {
      console.error(`[campaign] Failed send to ${patient.person.email}:`, err);
    }
  }

  const campaign = await prisma.broadcastCampaign.create({
    data: {
      title,
      subject,
      headline: headline || null,
      content,
      category,
      targetAudience,
      ctaLabel: ctaLabel || null,
      ctaUrl: ctaUrl || null,
      recipientCount: sentCount,
      status: "sent",
    },
  });

  return {
    campaignId: campaign.id,
    recipientCount: sentCount,
  };
}

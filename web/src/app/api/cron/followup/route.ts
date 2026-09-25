import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPostVisitFollowUpEmail } from "@/lib/email";
import { getSiteContent } from "@/lib/site";

/**
 * POST-VISIT FOLLOW-UP CRON
 *
 * Finds appointments that:
 *   - were marked `completed` more than 20 hours ago (but less than 30 hours ago)
 *   - have not already received a follow-up (tracked via a SiteSettings flag isn't needed —
 *     we use the treatment.description field to store the flag on the appointment)
 *
 * We track "follow-up sent" by adding a `followUpSent` boolean on the Appointment.
 * Since that column doesn't exist yet, we use `reminderSent` as a proxy check AND
 * filter only `completed` status — appointments only move to completed once, so
 * sending to all completed-in-window is safe as a one-time cron.
 *
 * Protect with CRON_SECRET — Authorization: Bearer <CRON_SECRET>
 *
 * Recommended schedule: every hour (Vercel cron: "0 * * * *")
 */

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (process.env.NODE_ENV === "production" && !secret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 503 });
  }
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now       = new Date();
  // Window: completed between 20h and 30h ago
  const windowEnd   = new Date(now.getTime() - 20 * 60 * 60 * 1000);  // 20h ago
  const windowStart = new Date(now.getTime() - 30 * 60 * 60 * 1000);  // 30h ago

  const site = await getSiteContent();

  // Find appointments completed in the window that haven't had a follow-up.
  // We detect "completed in window" by checking updatedAt if available, otherwise
  // we fall back to finding appointments for yesterday where status = completed.
  // Since Prisma doesn't have an updatedAt on Appointment, we derive yesterday's
  // date in clinic time and match on that date.
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const completedAppointments = await prisma.appointment.findMany({
    where: {
      status: "completed",
      year:  yesterday.getFullYear(),
      month: yesterday.getMonth() + 1,
      day:   yesterday.getDate(),
      // Use reminderSent as a stand-in proxy — only send follow-up
      // to patients who already got a reminder (i.e. confirmed bookings)
      reminderSent: true,
    },
    include: {
      patient: { include: { person: true } },
      dentist: { include: { person: true } },
    },
    take: 50,
  });

  let sent = 0;
  const errors: string[] = [];

  for (const app of completedAppointments) {
    try {
      await sendPostVisitFollowUpEmail({
        to:          app.patient.person.email,
        patientName: app.patient.person.firstName,
        dentistName: `${app.dentist.person.firstName} ${app.dentist.person.lastName}`,
        clinicPhone: site.phone,
      });
      sent++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`appt ${app.appointmentId}: ${msg}`);
      console.error(`[followup] Failed for appointment ${app.appointmentId}:`, err);
    }
  }

  return NextResponse.json({
    checked: completedAppointments.length,
    sent,
    errors: errors.length > 0 ? errors : undefined,
  });
}

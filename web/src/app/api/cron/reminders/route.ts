import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAppointmentReminderEmail } from "@/lib/email";

/**
 * Sends reminder emails for appointments happening tomorrow that haven't
 * been reminded about yet. Trigger this on a schedule (e.g. once a day)
 * via Vercel Cron, or any external scheduler that can hit a URL.
 *
 * Protect it with a CRON_SECRET env var — set the same value as the
 * scheduler's Authorization header: `Bearer <CRON_SECRET>`.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = tomorrow.getMonth() + 1;
  const day = tomorrow.getDate();

  const appointments = await prisma.appointment.findMany({
    where: { year, month, day, reminderSent: false },
    include: {
      patient: { include: { person: true } },
      dentist: { include: { person: true } },
    },
  });

  let sent = 0;
  for (const app of appointments) {
    try {
      await sendAppointmentReminderEmail({
        to: app.patient.person.email,
        patientName: app.patient.person.firstName,
        dentistName: `${app.dentist.person.firstName} ${app.dentist.person.lastName}`,
        room: app.room,
        date: new Date(app.year, app.month - 1, app.day),
        hour: app.hour,
      });
      await prisma.appointment.update({ where: { appointmentId: app.appointmentId }, data: { reminderSent: true } });
      sent++;
    } catch (error) {
      console.error(`[reminders] Failed for appointment ${app.appointmentId}:`, error);
    }
  }

  return NextResponse.json({ checked: appointments.length, sent });
}

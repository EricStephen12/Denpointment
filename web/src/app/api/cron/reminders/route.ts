import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAppointmentReminderEmail } from "@/lib/email";
import { addCalendarDays, getClinicDay } from "@/lib/clinic-date";

/**
 * Sends reminder emails for appointments happening tomorrow (clinic time)
 * that haven't been reminded about yet.
 *
 * Protect with CRON_SECRET — Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (process.env.NODE_ENV === "production" && !secret) {
    console.error("[reminders] CRON_SECRET is required in production");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 503 });
  }
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const tomorrow = addCalendarDays(getClinicDay(), 1);
  const { year, month, day } = tomorrow;

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
        date: { year: app.year, month: app.month, day: app.day },
        hour: app.hour,
      });
      await prisma.appointment.update({
        where: { appointmentId: app.appointmentId },
        data: { reminderSent: true },
      });
      sent++;
    } catch (error) {
      console.error(`[reminders] Failed for appointment ${app.appointmentId}:`, error);
    }
  }

  return NextResponse.json({ checked: appointments.length, sent });
}

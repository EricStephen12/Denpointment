"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isAdmin, isDentist, isReceptionist } from "@/lib/auth";
import {
  checkedInFromStatus,
  parseAppointmentStatus,
} from "@/lib/appointment-status";

export async function setAppointmentStatus(formData: FormData) {
  const person = await getCurrentPerson();
  if (!person || (!isDentist(person) && !isReceptionist(person) && !isAdmin(person))) {
    throw new Error("You're not authorized to update visit status.");
  }

  const appointmentId = parseInt(formData.get("appointmentId") as string, 10);
  const status = parseAppointmentStatus((formData.get("status") as string) || "");
  if (!appointmentId || !status) {
    throw new Error("Pick a valid visit status.");
  }

  const appointment = await prisma.appointment.findUnique({
    where: { appointmentId },
    select: { dId: true },
  });
  if (!appointment) throw new Error("Appointment not found.");

  // Dentists may only update their own patients' visits.
  if (isDentist(person) && !isAdmin(person) && !isReceptionist(person)) {
    if (appointment.dId !== person.dentists[0].dentistId) {
      throw new Error("You can only update status for your own appointments.");
    }
  }

  await prisma.appointment.update({
    where: { appointmentId },
    data: {
      status,
      checkedIn: checkedInFromStatus(status),
    },
  });

  revalidatePath("/dashboard/treatments/today");
  revalidatePath("/dashboard/treatments/upcoming");
  revalidatePath("/dashboard");
}

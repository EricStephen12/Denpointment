"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isAdmin, isReceptionist } from "@/lib/auth";
import { checkedInFromStatus } from "@/lib/appointment-status";

/** Legacy toggle — flips between scheduled and checked_in. Prefer setAppointmentStatus. */
export async function toggleCheckedIn(formData: FormData) {
  const person = await getCurrentPerson();
  if (!person || (!isAdmin(person) && !isReceptionist(person))) {
    throw new Error("You're not authorized to check in patients.");
  }

  const appointmentId = parseInt(formData.get("appointmentId") as string, 10);
  const currentlyCheckedIn = formData.get("checkedIn") === "true";
  const status = currentlyCheckedIn ? "scheduled" : "checked_in";

  await prisma.appointment.update({
    where: { appointmentId },
    data: {
      status,
      checkedIn: checkedInFromStatus(status),
    },
  });
  revalidatePath("/dashboard/treatments/today");
}

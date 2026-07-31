"use server"

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isAdmin, isReceptionist } from "@/lib/auth";

export async function toggleCheckedIn(formData: FormData) {
  const person = await getCurrentPerson();
  if (!person || (!isAdmin(person) && !isReceptionist(person))) {
    throw new Error("You're not authorized to check in patients.");
  }

  const appointmentId = parseInt(formData.get("appointmentId") as string, 10);
  const checkedIn = formData.get("checkedIn") === "true";

  await prisma.appointment.update({ where: { appointmentId }, data: { checkedIn: !checkedIn } });
  revalidatePath("/dashboard/treatments/today");
}

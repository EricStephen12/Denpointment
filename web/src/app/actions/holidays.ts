"use server"

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isDentist } from "@/lib/auth";

async function requireDentistId() {
  const person = await getCurrentPerson();
  if (!person || !isDentist(person)) {
    throw new Error("You're not authorized to manage holidays.");
  }
  return person.dentists[0].dentistId;
}

export async function addHoliday(formData: FormData) {
  const dentistId = await requireDentistId();

  const dateStr = formData.get("date") as string;
  const reason = (formData.get("reason") as string || "").trim();
  if (!dateStr) throw new Error("Please select a date.");

  await prisma.holidayDate.create({
    data: {
      restingId: dentistId,
      restDate: new Date(dateStr),
      reason: reason || null,
    },
  });

  revalidatePath("/dashboard/holidays");
  redirect("/dashboard/holidays");
}

export async function deleteHoliday(formData: FormData) {
  const dentistId = await requireDentistId();

  const holidayId = parseInt(formData.get("holidayId") as string, 10);
  if (!holidayId) throw new Error("Missing holiday.");

  await prisma.holidayDate.deleteMany({ where: { holidayId, restingId: dentistId } });
  revalidatePath("/dashboard/holidays");
}

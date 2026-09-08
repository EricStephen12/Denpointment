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

  const dateStr = (formData.get("date") as string) || "";
  const reason = ((formData.get("reason") as string) || "").trim();
  const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!dateParts) throw new Error("Please select a valid date.");
  const year = parseInt(dateParts[1], 10);
  const month = parseInt(dateParts[2], 10);
  const day = parseInt(dateParts[3], 10);

  await prisma.holidayDate.create({
    data: {
      restingId: dentistId,
      restDate: new Date(Date.UTC(year, month - 1, day)),
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

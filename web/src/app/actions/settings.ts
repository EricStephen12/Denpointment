"use server"

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isAdmin } from "@/lib/auth";

async function requireAdmin() {
  const person = await getCurrentPerson();
  if (!person || !isAdmin(person)) {
    throw new Error("You're not authorized to manage clinic settings.");
  }
}

export async function updateClinicHours(formData: FormData) {
  await requireAdmin();

  const openHour = parseInt(formData.get("openHour") as string, 10);
  const closeHour = parseInt(formData.get("closeHour") as string, 10);
  const workingDays = formData.getAll("workingDays").map((d) => parseInt(d as string, 10));

  if (Number.isNaN(openHour) || Number.isNaN(closeHour) || openHour >= closeHour) {
    throw new Error("Please provide a valid opening/closing hour range.");
  }
  if (workingDays.length === 0) {
    throw new Error("Select at least one working day.");
  }

  await prisma.clinicSettings.upsert({
    where: { id: 1 },
    update: { openHour, closeHour, workingDays },
    create: { id: 1, openHour, closeHour, workingDays },
  });

  revalidatePath("/dashboard/admin/settings");
  revalidatePath("/dashboard/book");
}

export async function createService(formData: FormData) {
  await requireAdmin();

  const name = (formData.get("name") as string || "").trim();
  const price = parseInt(formData.get("price") as string, 10);

  if (!name || Number.isNaN(price) || price < 0) {
    throw new Error("Please provide a valid service name and price.");
  }

  try {
    await prisma.service.create({ data: { name, price } });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("A service with that name already exists.");
    }
    throw error;
  }

  revalidatePath("/dashboard/admin/settings");
  redirect("/dashboard/admin/settings");
}

export async function toggleServiceActive(formData: FormData) {
  await requireAdmin();

  const serviceId = parseInt(formData.get("serviceId") as string, 10);
  const active = formData.get("active") === "true";

  await prisma.service.update({ where: { serviceId }, data: { active: !active } });
  revalidatePath("/dashboard/admin/settings");
}

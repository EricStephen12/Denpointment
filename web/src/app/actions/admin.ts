"use server"

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, Gender } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isAdmin } from "@/lib/auth";

async function requireAdmin() {
  const person = await getCurrentPerson();
  if (!person || !isAdmin(person)) {
    throw new Error("You're not authorized to manage staff.");
  }
  return person;
}

/**
 * Pre-provisions a staff member (dentist, receptionist, or admin) by email.
 * Creates a Person record with no clerkId yet. When that person signs up
 * or logs in via Clerk with a matching email, `getCurrentPerson()` links
 * their account automatically and routes them to the right dashboard.
 */
export async function createStaffMember(formData: FormData) {
  await requireAdmin();

  const email = (formData.get("email") as string || "").trim().toLowerCase();
  const firstName = (formData.get("firstName") as string || "").trim();
  const lastName = (formData.get("lastName") as string || "").trim();
  const gender = formData.get("gender") as string;
  const role = formData.get("role") as string;
  const roomNumber = (formData.get("roomNumber") as string || "").trim();

  if (!email || !firstName || !lastName || !gender) {
    throw new Error("All fields are required.");
  }
  if (gender !== "male" && gender !== "female") {
    throw new Error("Please select a valid gender.");
  }
  if (!["dentist", "receptionist", "admin"].includes(role)) {
    throw new Error("Please select a valid role.");
  }
  if (role === "dentist" && !roomNumber) {
    throw new Error("Room number is required for dentists.");
  }

  try {
    const person = await prisma.person.create({
      data: {
        email,
        firstName,
        lastName,
        gender: gender as Gender,
        password: "clerk-managed-password",
      },
    });

    if (role === "dentist") {
      await prisma.dentist.create({ data: { personId: person.personId, roomNumber } });
    } else if (role === "receptionist") {
      await prisma.receptionist.create({ data: { personId: person.personId } });
    } else {
      await prisma.admin.create({ data: { personId: person.personId } });
    }
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("A person with that email already exists.");
    }
    throw error;
  }

  revalidatePath("/dashboard/admin/staff");
  redirect("/dashboard/admin/staff");
}

export async function removeStaffMember(formData: FormData) {
  await requireAdmin();

  const personId = parseInt(formData.get("personId") as string, 10);
  if (!personId) throw new Error("Missing person.");

  // Cascade delete removes their role row(s) and contact info too.
  await prisma.person.delete({ where: { personId } });

  revalidatePath("/dashboard/admin/staff");
}

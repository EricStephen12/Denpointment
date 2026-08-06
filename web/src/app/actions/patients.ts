"use server"

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, Gender } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isAdmin, isReceptionist } from "@/lib/auth";

async function requireFrontDeskAccess() {
  const person = await getCurrentPerson();
  if (!person || (!isAdmin(person) && !isReceptionist(person))) {
    throw new Error("You're not authorized to register patients.");
  }
}

/**
 * Registers a walk-in or phone-booking patient at the front desk. If they
 * later sign up online with the same email, their account links to this
 * same patient record automatically (see getCurrentPerson()).
 */
export async function registerWalkInPatient(formData: FormData) {
  await requireFrontDeskAccess();

  const email = (formData.get("email") as string || "").trim().toLowerCase();
  const firstName = (formData.get("firstName") as string || "").trim();
  const lastName = (formData.get("lastName") as string || "").trim();
  const gender = formData.get("gender") as string;
  const phone = (formData.get("phone") as string || "").trim();

  if (!email || !firstName || !lastName || !gender) {
    throw new Error("Name, email, and gender are required.");
  }
  if (gender !== "male" && gender !== "female") {
    throw new Error("Please select a valid gender.");
  }

  try {
    const person = await prisma.person.create({
      data: {
        email,
        firstName,
        lastName,
        gender: gender as Gender,
        patients: { create: {} },
        ...(phone ? { contacts: { create: { contactNumber: phone } } } : {}),
      },
      include: { patients: true },
    });

    revalidatePath("/dashboard/patients");
    redirect(`/dashboard/book?patientId=${person.patients[0].patientId}`);
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("A person with that email already exists.");
    }
    throw error;
  }
}

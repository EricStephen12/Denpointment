"use server"

import { Gender } from "@prisma/client";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createPatientAccount(formData: FormData) {
  const user = await currentUser();
  if (!user) return { error: "Not authenticated" };

  const gender = formData.get("gender") as string;
  const birthDate = formData.get("birthDate") as string;

  if (!gender || !birthDate) {
    return { error: "All fields are required." };
  }

  if (gender !== "male" && gender !== "female") {
    return { error: "Please select a valid gender." };
  }

  const email = user.emailAddresses[0]?.emailAddress || "";
  const firstName = user.firstName || "Unknown";
  const lastName = user.lastName || "Unknown";

  try {
    // 1. Create the Person record
    const newPerson = await prisma.person.create({
      data: {
        clerkId: user.id,
        email,
        firstName,
        lastName,
        gender: gender as Gender,
        birthDate: new Date(birthDate),
      }
    });

    // 2. Create the Patient record linking to the Person
    await prisma.patient.create({
      data: {
        personId: newPerson.personId,
      }
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: unknown) {
    console.error(error);
    return { error: "Something went wrong while creating your account." };
  }
}

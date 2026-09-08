"use server";

import { Gender } from "@prisma/client";
import { getCurrentPerson } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function createPatientAccount(formData: FormData) {
  const currentPerson = await getCurrentPerson();
  if (!currentPerson) return { error: "Not authenticated. Please sign in again." };

  const gender = formData.get("gender") as string;
  const birthDate = formData.get("birthDate") as string;
  const phone = ((formData.get("phone") as string) || "").trim();
  const city = ((formData.get("city") as string) || "Abuja").trim();
  const street = ((formData.get("street") as string) || "Main Area").trim();

  if (!gender || !birthDate) {
    return { error: "Gender and Date of Birth are required." };
  }

  if (gender !== "male" && gender !== "female") {
    return { error: "Please select a valid gender." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.person.update({
        where: { personId: currentPerson.personId },
        data: {
          gender: gender as Gender,
          birthDate: new Date(birthDate),
        },
      });

      const existingPatient = await tx.patient.findUnique({
        where: { personId: currentPerson.personId },
      });
      if (!existingPatient) {
        await tx.patient.create({
          data: { personId: currentPerson.personId },
        });
      }

      if (phone) {
        const cleanPhone = phone.replace(/[^0-9+]/g, "").slice(0, 15);
        const existingPhone = await tx.personContactNumber.findUnique({
          where: {
            contactNumber_personId: {
              contactNumber: cleanPhone,
              personId: currentPerson.personId,
            },
          },
        });
        if (!existingPhone) {
          await tx.personContactNumber.create({
            data: {
              personId: currentPerson.personId,
              contactNumber: cleanPhone,
            },
          });
        }
      }

      if (city && street) {
        await tx.address.create({
          data: {
            personId: currentPerson.personId,
            city: city.slice(0, 20),
            street: street.slice(0, 20),
            zipCode: "900001",
          },
        });
      }
    });

    revalidatePath("/dashboard");
  } catch (error: unknown) {
    console.error("Failed to update patient profile:", error);
    return { error: "Something went wrong while updating your profile. Please try again." };
  }

  redirect("/dashboard");
}

"use server"

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, Gender } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isAdmin, isReceptionist } from "@/lib/auth";

async function requireFrontDeskAccess() {
  const person = await getCurrentPerson();
  if (!person || (!isAdmin(person) && !isReceptionist(person))) {
    throw new Error("You're not authorized to manage patients.");
  }
  return person;
}

/**
 * Registers a walk-in or phone-booking patient at the front desk.
 */
export async function registerWalkInPatient(formData: FormData) {
  await requireFrontDeskAccess();

  const email = (formData.get("email") as string || "").trim().toLowerCase();
  const firstName = (formData.get("firstName") as string || "").trim();
  const lastName = (formData.get("lastName") as string || "").trim();
  const gender = formData.get("gender") as string;
  const phone = (formData.get("phone") as string || "").trim();
  const occupation = (formData.get("occupation") as string || "").trim();
  const referralSource = (formData.get("referralSource") as string || "").trim();
  const emergencyContactName = (formData.get("emergencyContactName") as string || "").trim();
  const emergencyContactPhone = (formData.get("emergencyContactPhone") as string || "").trim();

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
        occupation: occupation || null,
        referralSource: referralSource || null,
        emergencyContactName: emergencyContactName || null,
        emergencyContactPhone: emergencyContactPhone || null,
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

/**
 * Updates demographics for an existing patient (receptionist / admin only).
 */
export async function updatePatientDemographics(formData: FormData) {
  await requireFrontDeskAccess();

  const patientId = parseInt(formData.get("patientId") as string, 10);
  if (!patientId) throw new Error("Patient ID required.");

  const patient = await prisma.patient.findUnique({
    where: { patientId },
    include: { person: true },
  });
  if (!patient) throw new Error("Patient not found.");

  const firstName = (formData.get("firstName") as string || "").trim();
  const lastName = (formData.get("lastName") as string || "").trim();
  const phone = (formData.get("phone") as string || "").trim();
  const occupation = (formData.get("occupation") as string || "").trim();
  const referralSource = (formData.get("referralSource") as string || "").trim();
  const emergencyContactName = (formData.get("emergencyContactName") as string || "").trim();
  const emergencyContactPhone = (formData.get("emergencyContactPhone") as string || "").trim();
  const street = (formData.get("street") as string || "").trim();
  const city = (formData.get("city") as string || "").trim();

  await prisma.$transaction(async (tx) => {
    await tx.person.update({
      where: { personId: patient.personId },
      data: {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        occupation: occupation || null,
        referralSource: referralSource || null,
        emergencyContactName: emergencyContactName || null,
        emergencyContactPhone: emergencyContactPhone || null,
      },
    });

    // Update phone — replace first contact number
    if (phone) {
      const existing = await tx.personContactNumber.findFirst({
        where: { personId: patient.personId },
      });
      if (existing) {
        await tx.personContactNumber.delete({
          where: { contactNumber_personId: { contactNumber: existing.contactNumber, personId: patient.personId } },
        });
      }
      await tx.personContactNumber.create({
        data: { contactNumber: phone, personId: patient.personId },
      });
    }

    // Update address — replace first address
    if (street || city) {
      const existingAddr = await tx.address.findFirst({
        where: { personId: patient.personId },
      });
      if (existingAddr) {
        await tx.address.update({
          where: { addressId: existingAddr.addressId },
          data: {
            street: street || existingAddr.street,
            city: city || existingAddr.city,
          },
        });
      } else {
        await tx.address.create({
          data: {
            personId: patient.personId,
            street: street || "",
            city: city || "",
            zipCode: "",
          },
        });
      }
    }
  });

  revalidatePath(`/dashboard/patients/${patientId}`);
}

/**
 * Add a chronic disease to a patient's person record.
 */
export async function addChronicDisease(formData: FormData) {
  await requireFrontDeskAccess();
  const patientId = parseInt(formData.get("patientId") as string, 10);
  const disease = (formData.get("disease") as string || "").trim().slice(0, 50);
  if (!patientId || !disease) throw new Error("Disease name required.");

  const patient = await prisma.patient.findUnique({ where: { patientId } });
  if (!patient) throw new Error("Patient not found.");

  await prisma.chronicDisease.upsert({
    where: { chronicDisease_personId: { chronicDisease: disease, personId: patient.personId } },
    create: { chronicDisease: disease, personId: patient.personId },
    update: {},
  });
  revalidatePath(`/dashboard/patients/${patientId}`);
}

/**
 * Remove a chronic disease.
 */
export async function removeChronicDisease(formData: FormData) {
  await requireFrontDeskAccess();
  const patientId = parseInt(formData.get("patientId") as string, 10);
  const disease = (formData.get("disease") as string || "").trim();
  if (!patientId || !disease) throw new Error("Required.");

  const patient = await prisma.patient.findUnique({ where: { patientId } });
  if (!patient) throw new Error("Patient not found.");

  await prisma.chronicDisease.delete({
    where: { chronicDisease_personId: { chronicDisease: disease, personId: patient.personId } },
  });
  revalidatePath(`/dashboard/patients/${patientId}`);
}

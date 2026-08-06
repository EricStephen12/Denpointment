"use server"

import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

async function getPersonId() {
  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Not authenticated");
  const dbPerson = await prisma.person.findUnique({
    where: { clerkId: clerkUser.id }
  });
  if (!dbPerson) throw new Error("User not found");
  return dbPerson.personId;
}

export async function deleteAddress(formData: FormData) {
  const addressId = parseInt(formData.get("addressId") as string);
  const personId = await getPersonId();
  await prisma.address.deleteMany({
    where: { addressId, personId }
  });
  revalidatePath('/dashboard/profile');
}

export async function addAddress(formData: FormData) {
  const personId = await getPersonId();
  await prisma.address.create({
    data: {
      personId,
      city: formData.get("city") as string,
      street: formData.get("street") as string,
      zipCode: formData.get("zipCode") as string,
    }
  });
  revalidatePath('/dashboard/profile');
  redirect('/dashboard/profile');
}

export async function deletePhone(formData: FormData) {
  const contactNumber = formData.get("contactNumber") as string;
  const personId = await getPersonId();
  await prisma.personContactNumber.deleteMany({
    where: { contactNumber, personId }
  });
  revalidatePath('/dashboard/profile');
}

export async function addPhone(formData: FormData) {
  const personId = await getPersonId();
  const contactNumber = ((formData.get("contactNumber") as string) || "").trim();
  if (!contactNumber) {
    throw new Error("Please enter a phone number.");
  }

  const existing = await prisma.personContactNumber.findUnique({
    where: {
      contactNumber_personId: { contactNumber, personId },
    },
  });
  if (!existing) {
    await prisma.personContactNumber.create({
      data: { personId, contactNumber },
    });
  }

  revalidatePath("/dashboard/profile");
  redirect("/dashboard/profile");
}

export async function deleteDisease(formData: FormData) {
  const chronicDisease = formData.get("chronicDisease") as string;
  const personId = await getPersonId();
  await prisma.chronicDisease.deleteMany({
    where: { chronicDisease, personId }
  });
  revalidatePath('/dashboard/profile');
}

export async function addDisease(formData: FormData) {
  const personId = await getPersonId();
  await prisma.chronicDisease.create({
    data: {
      personId,
      chronicDisease: formData.get("chronicDisease") as string,
    }
  });
  revalidatePath('/dashboard/profile');
  redirect('/dashboard/profile');
}

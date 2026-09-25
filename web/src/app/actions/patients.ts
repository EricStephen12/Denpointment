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

  const email = (formData.get("email") as string || "").trim().toLowerCase();
  const firstName = (formData.get("firstName") as string || "").trim();
  const lastName = (formData.get("lastName") as string || "").trim();
  const phone = (formData.get("phone") as string || "").trim();
  const occupation = (formData.get("occupation") as string || "").trim();
  const referralSource = (formData.get("referralSource") as string || "").trim();
  const emergencyContactName = (formData.get("emergencyContactName") as string || "").trim();
  const emergencyContactPhone = (formData.get("emergencyContactPhone") as string || "").trim();
  const street = (formData.get("street") as string || "").trim();
  const city = (formData.get("city") as string || "").trim();

  if (email && email !== patient.person.email) {
    const existing = await prisma.person.findUnique({ where: { email } });
    if (existing && existing.personId !== patient.personId) {
      throw new Error("That email is already registered to another person.");
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.person.update({
      where: { personId: patient.personId },
      data: {
        email: email || undefined,
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

/**
 * Add a secondary contact phone number.
 */
export async function addPatientContactNumber(formData: FormData) {
  await requireFrontDeskAccess();
  const patientId = parseInt(formData.get("patientId") as string, 10);
  const phone = ((formData.get("phone") as string) || "").trim();
  if (!patientId || !phone) throw new Error("Patient ID and phone number required.");

  const patient = await prisma.patient.findUnique({ where: { patientId } });
  if (!patient) throw new Error("Patient not found.");

  await prisma.personContactNumber.upsert({
    where: { contactNumber_personId: { contactNumber: phone, personId: patient.personId } },
    create: { contactNumber: phone, personId: patient.personId },
    update: {},
  });
  revalidatePath(`/dashboard/patients/${patientId}`);
}

/**
 * Remove a contact phone number.
 */
export async function removePatientContactNumber(formData: FormData) {
  await requireFrontDeskAccess();
  const patientId = parseInt(formData.get("patientId") as string, 10);
  const phone = ((formData.get("phone") as string) || "").trim();
  if (!patientId || !phone) throw new Error("Required.");

  const patient = await prisma.patient.findUnique({ where: { patientId } });
  if (!patient) throw new Error("Patient not found.");

  await prisma.personContactNumber.delete({
    where: { contactNumber_personId: { contactNumber: phone, personId: patient.personId } },
  });
  revalidatePath(`/dashboard/patients/${patientId}`);
}

/**
 * Deletes a patient record (Admin only).
 * Cleanly cascades through appointments, treatments, medicines, insurance claims, and payments,
 * and deletes the person record if they hold no other clinic roles.
 */
export async function deletePatient(formData: FormData) {
  const person = await getCurrentPerson();
  if (!person || !isAdmin(person)) {
    throw new Error("Only practice administrators can delete patient records.");
  }

  const patientId = parseInt(formData.get("patientId") as string, 10);
  if (!patientId) throw new Error("Patient ID is required.");

  const patient = await prisma.patient.findUnique({
    where: { patientId },
    include: {
      person: {
        include: { admins: true, dentists: true, receptionists: true },
      },
    },
  });
  if (!patient) throw new Error("Patient record not found.");

  await prisma.$transaction(async (tx) => {
    // 1. Find all appointments for this patient
    const appointments = await tx.appointment.findMany({
      where: { pId: patientId },
      select: { appointmentId: true },
    });
    const appointmentIds = appointments.map((a) => a.appointmentId);

    if (appointmentIds.length > 0) {
      // 2. Find treatments under these appointments
      const treatments = await tx.treatment.findMany({
        where: { aId: { in: appointmentIds } },
        select: { treatmentId: true },
      });
      const treatmentIds = treatments.map((t) => t.treatmentId);

      // 3. Delete medicines under these treatments
      if (treatmentIds.length > 0) {
        await tx.medicine.deleteMany({
          where: { tId: { in: treatmentIds } },
        });
      }

      // 4. Delete payments linked to these appointments or treatments
      await tx.payment.deleteMany({
        where: {
          OR: [
            { patientId },
            { appointmentId: { in: appointmentIds } },
            ...(treatmentIds.length > 0 ? [{ treatmentId: { in: treatmentIds } }] : []),
          ],
        },
      });

      // 5. Delete insurance claims linked to these appointments
      await tx.insuranceClaim.deleteMany({
        where: { appointmentId: { in: appointmentIds } },
      });

      // 6. Delete treatments
      if (treatmentIds.length > 0) {
        await tx.treatment.deleteMany({
          where: { treatmentId: { in: treatmentIds } },
        });
      }

      // 7. Delete appointments
      await tx.appointment.deleteMany({
        where: { appointmentId: { in: appointmentIds } },
      });
    }

    // 8. Delete any other payments directly associated with patient
    await tx.payment.deleteMany({
      where: { patientId },
    });

    // 9. Delete the patient record itself
    await tx.patient.delete({
      where: { patientId },
    });

    // 10. If the person has no staff roles, delete the person record too
    const isStaff =
      patient.person.admins.length > 0 ||
      patient.person.dentists.length > 0 ||
      patient.person.receptionists.length > 0;

    if (!isStaff) {
      await tx.payment.updateMany({
        where: { recordedById: patient.personId },
        data: { recordedById: person.personId },
      });
      await tx.recallCallLog.deleteMany({
        where: { calledById: patient.personId },
      });
      await tx.person.delete({
        where: { personId: patient.personId },
      });
    }
  });

  revalidatePath("/dashboard/patients");
}


"use server";

import { revalidatePath } from "next/cache";
import type { ClinicalImageKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isDentist, isAdmin } from "@/lib/auth";
import { destroyClinicalImage, uploadClinicalImage } from "@/lib/cloudinary";

const KINDS = new Set<ClinicalImageKind>(["photo", "xray", "other"]);

async function resolveDentistId(patientId: number) {
  const person = await getCurrentPerson();
  if (!person) throw new Error("Not authorized.");

  if (isDentist(person)) {
    return person.dentists[0].dentistId;
  }

  if (isAdmin(person)) {
    // If admin is not a dentist, attribute to patient's latest appointment dentist, or first clinic dentist
    const recentAppt = await prisma.appointment.findFirst({
      where: { pId: patientId },
      orderBy: { appointmentId: "desc" },
    });
    if (recentAppt) return recentAppt.dId;

    const firstDentist = await prisma.dentist.findFirst();
    if (firstDentist) return firstDentist.dentistId;
    throw new Error("No dentist available to attribute clinical image to.");
  }

  throw new Error("Only dentists or administrators can manage clinical images.");
}

export async function uploadPatientImage(formData: FormData) {
  const patientId = parseInt(formData.get("patientId") as string, 10);
  const kindRaw = (formData.get("kind") as string) || "photo";
  const caption = ((formData.get("caption") as string) || "").trim().slice(0, 200);
  const file = formData.get("file");

  if (!patientId || Number.isNaN(patientId)) {
    throw new Error("Invalid patient.");
  }

  const dentistId = await resolveDentistId(patientId);

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose an image file to upload.");
  }
  if (!KINDS.has(kindRaw as ClinicalImageKind)) {
    throw new Error("Pick a valid image type.");
  }

  const patient = await prisma.patient.findUnique({ where: { patientId } });
  if (!patient) throw new Error("Patient not found.");

  const uploaded = await uploadClinicalImage({ file, patientId });

  await prisma.patientImage.create({
    data: {
      patientId,
      dentistId,
      kind: kindRaw as ClinicalImageKind,
      url: uploaded.url,
      publicId: uploaded.publicId,
      caption: caption || null,
    },
  });

  revalidatePath(`/dashboard/patients/${patientId}`);
}

export async function deletePatientImage(formData: FormData) {
  const person = await getCurrentPerson();
  if (!person) throw new Error("Not authorized.");
  const isAdm = isAdmin(person);
  const isDent = isDentist(person);
  if (!isAdm && !isDent) {
    throw new Error("Only dentists or admins can delete clinical images.");
  }

  const imageId = parseInt(formData.get("imageId") as string, 10);
  if (!imageId) throw new Error("Invalid image.");

  const image = await prisma.patientImage.findUnique({ where: { imageId } });
  if (!image) throw new Error("Image not found.");

  if (!isAdm) {
    const dentistId = person.dentists[0]?.dentistId;
    if (image.dentistId !== dentistId) {
      throw new Error("You can only delete images you uploaded, or contact an administrator.");
    }
  }

  await destroyClinicalImage(image.publicId);
  await prisma.patientImage.delete({ where: { imageId } });

  revalidatePath(`/dashboard/patients/${image.patientId}`);
}

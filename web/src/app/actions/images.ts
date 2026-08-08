"use server";

import { revalidatePath } from "next/cache";
import type { ClinicalImageKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isDentist } from "@/lib/auth";
import { destroyClinicalImage, uploadClinicalImage } from "@/lib/cloudinary";

const KINDS = new Set<ClinicalImageKind>(["photo", "xray", "other"]);

async function requireDentistId() {
  const person = await getCurrentPerson();
  if (!person || !isDentist(person)) {
    throw new Error("Only dentists can manage clinical images.");
  }
  return person.dentists[0].dentistId;
}

export async function uploadPatientImage(formData: FormData) {
  const dentistId = await requireDentistId();
  const patientId = parseInt(formData.get("patientId") as string, 10);
  const kindRaw = (formData.get("kind") as string) || "photo";
  const caption = ((formData.get("caption") as string) || "").trim().slice(0, 200);
  const file = formData.get("file");

  if (!patientId || Number.isNaN(patientId)) {
    throw new Error("Invalid patient.");
  }
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
  const dentistId = await requireDentistId();
  const imageId = parseInt(formData.get("imageId") as string, 10);
  if (!imageId) throw new Error("Invalid image.");

  const image = await prisma.patientImage.findUnique({ where: { imageId } });
  if (!image) throw new Error("Image not found.");
  if (image.dentistId !== dentistId) {
    throw new Error("You can only delete images you uploaded.");
  }

  await destroyClinicalImage(image.publicId);
  await prisma.patientImage.delete({ where: { imageId } });

  revalidatePath(`/dashboard/patients/${image.patientId}`);
}

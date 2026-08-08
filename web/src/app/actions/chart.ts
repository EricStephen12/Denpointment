"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isDentist } from "@/lib/auth";
import { isValidFdiTooth, parseToothCondition } from "@/lib/odontogram";
import { parseSurfacesFromForm } from "@/lib/tooth-surfaces";

async function requireDentistId() {
  const person = await getCurrentPerson();
  if (!person || !isDentist(person)) {
    throw new Error("Only dentists can update the dental chart.");
  }
  return person.dentists[0].dentistId;
}

export async function upsertToothFinding(formData: FormData) {
  const dentistId = await requireDentistId();

  const patientId = parseInt(formData.get("patientId") as string, 10);
  const toothNumber = parseInt(formData.get("toothNumber") as string, 10);
  const conditionRaw = (formData.get("condition") as string) || "";
  const notes = ((formData.get("notes") as string) || "").trim().slice(0, 500);
  const surfaces = parseSurfacesFromForm(formData.get("surfaces"));
  const condition = parseToothCondition(conditionRaw);

  if (!patientId || Number.isNaN(patientId)) {
    throw new Error("Invalid patient.");
  }
  if (!isValidFdiTooth(toothNumber)) {
    throw new Error("Pick a valid tooth number (FDI).");
  }
  if (!condition) {
    throw new Error("Pick a valid condition.");
  }

  const patient = await prisma.patient.findUnique({ where: { patientId } });
  if (!patient) throw new Error("Patient not found.");

  await prisma.$transaction([
    prisma.toothFinding.updateMany({
      where: { patientId, toothNumber, active: true },
      data: { active: false },
    }),
    prisma.toothFinding.create({
      data: {
        patientId,
        dentistId,
        toothNumber,
        condition,
        surfaces,
        notes: notes || null,
        active: true,
      },
    }),
  ]);

  revalidatePath(`/dashboard/patients/${patientId}`);
  revalidatePath("/dashboard/treatments/today");
}

export async function clearToothFinding(formData: FormData) {
  await requireDentistId();

  const patientId = parseInt(formData.get("patientId") as string, 10);
  const toothNumber = parseInt(formData.get("toothNumber") as string, 10);

  if (!patientId || !isValidFdiTooth(toothNumber)) {
    throw new Error("Invalid tooth selection.");
  }

  await prisma.toothFinding.updateMany({
    where: { patientId, toothNumber, active: true },
    data: { active: false },
  });

  revalidatePath(`/dashboard/patients/${patientId}`);
}

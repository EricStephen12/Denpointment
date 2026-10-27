"use server";

import type { ToothCondition } from "@prisma/client";
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

export async function planToothProcedure(formData: FormData) {
  const dentistId = await requireDentistId();

  const patientId = parseInt(formData.get("patientId") as string, 10);
  const toothNumber = parseInt(formData.get("toothNumber") as string, 10);
  const description = ((formData.get("description") as string) || "").trim();
  const surfaces = parseSurfacesFromForm(formData.get("surfaces"));
  const chargeRaw = (formData.get("estimatedCharge") as string) || "";
  const estimatedCharge = chargeRaw ? parseInt(chargeRaw, 10) : null;
  const conditionRaw = (formData.get("condition") as string) || "";

  if (!patientId || Number.isNaN(patientId)) throw new Error("Invalid patient.");
  if (!isValidFdiTooth(toothNumber)) throw new Error("Invalid tooth number.");
  if (!description) throw new Error("Procedure description is required.");

  // If a condition was specified and is not healthy, record finding on the chart
  if (conditionRaw && conditionRaw !== "healthy") {
    const condition = parseToothCondition(conditionRaw);
    if (condition) {
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
            notes: `Planned: ${description}`,
            active: true,
          },
        }),
      ]);
    }
  }

  // Find or create active treatment plan
  let plan = await prisma.treatmentPlan.findFirst({
    where: { patientId },
    orderBy: { createdAt: "desc" },
  });

  if (!plan) {
    plan = await prisma.treatmentPlan.create({
      data: {
        patientId,
        dentistId,
        title: "Active Dental Care Plan",
      },
    });
  }

  const count = await prisma.treatmentPlanItem.count({ where: { planId: plan.planId } });

  await prisma.treatmentPlanItem.create({
    data: {
      planId: plan.planId,
      description,
      toothNumber,
      surfaces,
      estimatedCharge: estimatedCharge != null && !Number.isNaN(estimatedCharge) ? estimatedCharge : null,
      status: "planned",
      sortOrder: count,
    },
  });

  revalidatePath(`/dashboard/patients/${patientId}`);
  revalidatePath("/dashboard/treatments/today");
}

export async function completeToothProcedure(formData: FormData) {
  const dentistId = await requireDentistId();

  const itemId = parseInt(formData.get("itemId") as string, 10);
  const patientId = parseInt(formData.get("patientId") as string, 10);
  const toothRaw = (formData.get("toothNumber") as string) || "";
  const toothNumber = toothRaw ? parseInt(toothRaw, 10) : null;
  const description = (formData.get("description") as string) || "";

  if (!itemId) throw new Error("Item ID required.");

  // Update item status to completed
  await prisma.treatmentPlanItem.update({
    where: { itemId },
    data: { status: "completed" },
  });

  // If a tooth is associated, determine the clinical outcome condition and update the odontogram
  if (patientId && toothNumber && isValidFdiTooth(toothNumber)) {
    const descLower = description.toLowerCase();
    let resultingCondition: ToothCondition = "filling";

    if (descLower.includes("extract")) {
      resultingCondition = "missing";
    } else if (descLower.includes("crown") || descLower.includes("cap") || descLower.includes("onlay")) {
      resultingCondition = "crown";
    } else if (descLower.includes("root canal") || descLower.includes("rct") || descLower.includes("endo")) {
      resultingCondition = "root_canal";
    } else if (descLower.includes("implant")) {
      resultingCondition = "other";
    }

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
          condition: resultingCondition,
          notes: `Completed: ${description}`,
          active: true,
        },
      }),
    ]);
  }

  revalidatePath(`/dashboard/patients/${patientId}`);
  revalidatePath("/dashboard/treatments/today");
}

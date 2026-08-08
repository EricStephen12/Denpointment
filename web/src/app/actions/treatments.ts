"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isDentist } from "@/lib/auth";
import { isAppointmentToday } from "@/lib/clinic-date";
import { isValidFdiTooth, parseToothCondition } from "@/lib/odontogram";

type RxInput = {
  name: string;
  dose?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
};

async function requireDentistId() {
  const person = await getCurrentPerson();
  if (!person || !isDentist(person)) {
    throw new Error("You're not authorized to record treatments.");
  }
  return person.dentists[0].dentistId;
}

function parsePrescriptions(raw: string): RxInput[] {
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const rows: RxInput[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const name = typeof row.name === "string" ? row.name.trim() : "";
      if (!name) continue;
      rows.push({
        name: name.slice(0, 80),
        dose: typeof row.dose === "string" ? row.dose.trim().slice(0, 40) : undefined,
        frequency: typeof row.frequency === "string" ? row.frequency.trim().slice(0, 40) : undefined,
        duration: typeof row.duration === "string" ? row.duration.trim().slice(0, 40) : undefined,
        instructions:
          typeof row.instructions === "string" ? row.instructions.trim().slice(0, 200) : undefined,
      });
      if (rows.length >= 20) break;
    }
    return rows;
  } catch {
    return [];
  }
}

export async function addTreatment(formData: FormData) {
  const dentistId = await requireDentistId();

  const appointmentId = parseInt(formData.get("appointmentId") as string, 10);
  const description = ((formData.get("description") as string) || "").trim().slice(0, 4000);
  const serviceIdRaw = formData.get("serviceId") as string;
  const serviceId = serviceIdRaw ? parseInt(serviceIdRaw, 10) : null;
  const manualCharge = formData.get("charge") as string;
  const action = ((formData.get("action") as string) || "").trim().slice(0, 200);
  const complaint = ((formData.get("complaint") as string) || "").trim().slice(0, 200);
  const toothRaw = (formData.get("toothNumber") as string) || "";
  const toothNumber = toothRaw ? parseInt(toothRaw, 10) : null;
  const chartConditionRaw = (formData.get("chartCondition") as string) || "";
  const prescriptions = parsePrescriptions((formData.get("prescriptions") as string) || "");

  if (!appointmentId || !action || !complaint) {
    throw new Error("Please fill in the required treatment fields.");
  }
  if (toothNumber != null && !isValidFdiTooth(toothNumber)) {
    throw new Error("Tooth number must be a valid FDI tooth (adult 11–48 or kids 51–85).");
  }

  let charge: number;
  if (serviceId) {
    const service = await prisma.service.findUnique({ where: { serviceId } });
    if (!service) throw new Error("Selected service was not found.");
    charge = service.price;
  } else {
    charge = parseInt(manualCharge, 10);
    if (Number.isNaN(charge) || charge < 0) {
      throw new Error("Please select a service or enter a valid charge.");
    }
  }

  const appointment = await prisma.appointment.findUnique({
    where: { appointmentId },
    select: {
      appointmentId: true,
      dId: true,
      pId: true,
      year: true,
      month: true,
      day: true,
      hour: true,
    },
  });
  if (!appointment || appointment.dId !== dentistId) {
    throw new Error("You can only add treatments for your own appointments.");
  }
  if (!isAppointmentToday(appointment)) {
    throw new Error("Treatments can only be added for today's appointments.");
  }

  const treatment = await prisma.treatment.create({
    data: {
      aId: appointmentId,
      treatorId: dentistId,
      serviceId: serviceId || null,
      description: description || null,
      charge,
      action,
      complaint,
      toothNumber,
      medicines: {
        create: prescriptions.map((rx) => ({
          medicineName: rx.name,
          dose: rx.dose || null,
          frequency: rx.frequency || null,
          duration: rx.duration || null,
          instructions: rx.instructions || null,
        })),
      },
    },
  });

  const chartCondition = parseToothCondition(chartConditionRaw);
  if (toothNumber != null && chartCondition) {
    await prisma.$transaction([
      prisma.toothFinding.updateMany({
        where: { patientId: appointment.pId, toothNumber, active: true },
        data: { active: false },
      }),
      prisma.toothFinding.create({
        data: {
          patientId: appointment.pId,
          dentistId,
          treatmentId: treatment.treatmentId,
          toothNumber,
          condition: chartCondition,
          notes: action.slice(0, 500),
          active: true,
        },
      }),
    ]);
  }

  revalidatePath("/dashboard/treatments/today");
  revalidatePath("/dashboard/treatments/past");
  revalidatePath("/dashboard/admin/billing");
  revalidatePath(`/dashboard/patients/${appointment.pId}`);
  revalidatePath("/dashboard/appointments");
}

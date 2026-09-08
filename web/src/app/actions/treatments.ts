"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isDentist } from "@/lib/auth";
import { isAppointmentToday } from "@/lib/clinic-date";
import { isValidFdiTooth, parseToothCondition } from "@/lib/odontogram";
import { sendTreatmentSummaryEmail } from "@/lib/email";

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
      patient: {
        include: { person: true },
      },
      dentist: {
        include: { person: true },
      },
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

  // Send treatment summary & digital prescription email to patient (best-effort)
  if (appointment.patient?.person?.email) {
    const dentistName = appointment.dentist?.person
      ? `${appointment.dentist.person.firstName} ${appointment.dentist.person.lastName}`
      : "Your Dentist";

    sendTreatmentSummaryEmail({
      to: appointment.patient.person.email,
      patientName: appointment.patient.person.firstName,
      dentistName,
      action,
      description,
      toothNumber,
      medicines: prescriptions,
    }).catch((err) => console.error("[email] treatment summary failed:", err));
  }

  revalidatePath("/dashboard/treatments/today");
  revalidatePath("/dashboard/treatments/past");
  revalidatePath("/dashboard/admin/billing");
  revalidatePath(`/dashboard/patients/${appointment.pId}`);
  revalidatePath("/dashboard/appointments");
}

export async function updateTreatment(formData: FormData) {
  const dentistId = await requireDentistId();
  const treatmentId = parseInt(formData.get("treatmentId") as string, 10);
  const action = ((formData.get("action") as string) || "").trim().slice(0, 200);
  const complaint = ((formData.get("complaint") as string) || "").trim().slice(0, 200);
  const description = ((formData.get("description") as string) || "").trim().slice(0, 4000);
  const toothRaw = (formData.get("toothNumber") as string) || "";
  const toothNumber = toothRaw ? parseInt(toothRaw, 10) : null;
  const charge = parseInt(formData.get("charge") as string, 10);

  if (!treatmentId || !action || !complaint) {
    throw new Error("Treatment, complaint, and action are required.");
  }
  if (Number.isNaN(charge) || charge < 0) {
    throw new Error("Enter a valid charge.");
  }
  if (toothNumber != null && !isValidFdiTooth(toothNumber)) {
    throw new Error("Invalid tooth number.");
  }

  const existing = await prisma.treatment.findUnique({
    where: { treatmentId },
    include: { appointment: true },
  });
  if (!existing || existing.treatorId !== dentistId) {
    throw new Error("You can only edit your own treatments.");
  }
  if (existing.paid) {
    throw new Error("Paid treatments can’t be edited. Reverse payment with admin first.");
  }

  await prisma.treatment.update({
    where: { treatmentId },
    data: {
      action,
      complaint,
      description: description || null,
      toothNumber,
      charge,
    },
  });

  revalidatePath("/dashboard/treatments/today");
  revalidatePath("/dashboard/treatments/past");
  revalidatePath(`/dashboard/patients/${existing.appointment.pId}`);
  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard/admin/billing");
}

export async function deleteTreatment(formData: FormData) {
  const dentistId = await requireDentistId();
  const treatmentId = parseInt(formData.get("treatmentId") as string, 10);
  if (!treatmentId) throw new Error("Invalid treatment.");

  const existing = await prisma.treatment.findUnique({
    where: { treatmentId },
    include: { appointment: true },
  });
  if (!existing || existing.treatorId !== dentistId) {
    throw new Error("You can only delete your own treatments.");
  }
  if (existing.paid) {
    throw new Error("Paid treatments can’t be deleted.");
  }

  await prisma.medicine.deleteMany({ where: { tId: treatmentId } });
  await prisma.toothFinding.updateMany({
    where: { treatmentId },
    data: { treatmentId: null },
  });
  await prisma.treatment.delete({ where: { treatmentId } });

  revalidatePath("/dashboard/treatments/today");
  revalidatePath("/dashboard/treatments/past");
  revalidatePath(`/dashboard/patients/${existing.appointment.pId}`);
  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard/admin/billing");
}

"use server"

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isDentist } from "@/lib/auth";
import { isAppointmentToday } from "@/lib/clinic-date";

async function requireDentistId() {
  const person = await getCurrentPerson();
  if (!person || !isDentist(person)) {
    throw new Error("You're not authorized to record treatments.");
  }
  return person.dentists[0].dentistId;
}

export async function addTreatment(formData: FormData) {
  const dentistId = await requireDentistId();

  const appointmentId = parseInt(formData.get("appointmentId") as string, 10);
  const description = (formData.get("description") as string || "").trim();
  const serviceIdRaw = formData.get("serviceId") as string;
  const serviceId = serviceIdRaw ? parseInt(serviceIdRaw, 10) : null;
  const manualCharge = formData.get("charge") as string;
  const action = (formData.get("action") as string || "").trim();
  const complaint = (formData.get("complaint") as string || "").trim();
  const medicinesRaw = (formData.get("medicines") as string || "").trim();

  if (!appointmentId || !action || !complaint) {
    throw new Error("Please fill in the required treatment fields.");
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

  const appointment = await prisma.appointment.findUnique({ where: { appointmentId } });
  if (!appointment || appointment.dId !== dentistId) {
    throw new Error("You can only add treatments for your own appointments.");
  }
  if (!isAppointmentToday(appointment)) {
    throw new Error("Treatments can only be added for today's appointments.");
  }

  const existing = await prisma.treatment.findFirst({ where: { aId: appointmentId } });
  if (existing) {
    throw new Error("A treatment has already been recorded for this appointment.");
  }

  const medicineNames = medicinesRaw
    ? medicinesRaw.split(",").map((m) => m.trim()).filter(Boolean)
    : [];

  await prisma.treatment.create({
    data: {
      aId: appointmentId,
      treatorId: dentistId,
      serviceId: serviceId || null,
      description: description || null,
      charge,
      action,
      complaint,
      medicines: {
        create: medicineNames.map((medicineName) => ({ medicineName })),
      },
    },
  });

  revalidatePath("/dashboard/treatments/today");
  revalidatePath("/dashboard/treatments/past");
  revalidatePath("/dashboard/admin/billing");
}

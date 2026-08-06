"use server"

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isReceptionist } from "@/lib/auth";
import { sendAppointmentConfirmationEmail } from "@/lib/email";
import { notifyN8n } from "@/lib/n8n";

// Action to book a new appointment.
// Patients book for themselves; receptionists can book on behalf of any patient.
export async function bookAppointment(formData: FormData) {
  const dbPerson = await getCurrentPerson();
  if (!dbPerson) throw new Error("Not authenticated");

  const staffBooking = isReceptionist(dbPerson);

  let patientId: number;
  if (staffBooking) {
    const requestedPatientId = parseInt(formData.get("patientId") as string, 10);
    if (!requestedPatientId) throw new Error("Please select a patient.");
    patientId = requestedPatientId;
  } else {
    if (dbPerson.patients.length === 0) throw new Error("Not authorized as a patient");
    patientId = dbPerson.patients[0].patientId;
  }

  // Patients must have an address and phone before booking (staff bookings skip this).
  if (!staffBooking) {
    const profile = await prisma.patient.findUnique({
      where: { patientId },
      include: { person: { include: { addresses: true, contacts: true } } },
    });
    if (!profile || profile.person.addresses.length === 0 || profile.person.contacts.length === 0) {
      throw new Error("Please add an address and phone number on your profile before booking.");
    }
  }

  const dateStr = formData.get("date") as string;
  const hour = parseInt(formData.get("hour") as string, 10);

  if (!dateStr || Number.isNaN(hour)) {
    throw new Error("Please fill in all fields.");
  }

  // Parse YYYY-MM-DD as a local calendar date (not UTC) so timezone
  // shifts don't mark today as "in the past" or land on the wrong weekday.
  const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!dateParts) {
    throw new Error("Please pick a valid date.");
  }
  const year = parseInt(dateParts[1], 10);
  const month = parseInt(dateParts[2], 10);
  const day = parseInt(dateParts[3], 10);
  const dateObj = new Date(year, month - 1, day);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (dateObj < today) {
    throw new Error("You can't book an appointment in the past.");
  }

  const settings = await prisma.clinicSettings.findUnique({ where: { id: 1 } });
  const openHour = settings?.openHour ?? 8;
  const closeHour = settings?.closeHour ?? 18;
  const workingDays = settings?.workingDays ?? [1, 2, 3, 4, 5];

  if (hour < openHour || hour >= closeHour) {
    throw new Error(`The clinic is only open between ${openHour}:00 and ${closeHour}:00.`);
  }
  if (!workingDays.includes(dateObj.getDay())) {
    throw new Error("The clinic is closed on the selected day.");
  }

  // Find an available dentist for this slot
  const allDentists = await prisma.dentist.findMany({ include: { person: true } });
  let assignedDentist = null;

  for (const dentist of allDentists) {
    // Check if dentist is on holiday
    const onHoliday = await prisma.holidayDate.findFirst({
      where: { restingId: dentist.dentistId, restDate: new Date(year, month - 1, day) },
    });
    
    if (onHoliday) continue;

    // Check if dentist already has an appointment at this hour
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        dId: dentist.dentistId,
        year,
        month,
        day,
        hour
      }
    });

    if (!existingAppointment) {
      assignedDentist = dentist;
      break;
    }
  }

  if (!assignedDentist) {
    throw new Error("Sorry, no dentists are available at this time. Please pick another slot.");
  }

  let patient;
  try {
    await prisma.appointment.create({
      data: {
        pId: patientId,
        dId: assignedDentist.dentistId,
        year,
        month,
        day,
        hour,
        room: assignedDentist.roomNumber,
      }
    });
    patient = await prisma.patient.findUnique({ where: { patientId }, include: { person: true } });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("This time slot was just booked by someone else. Please pick another.");
    }
    throw error;
  }

  if (patient) {
    const dentistName = `${assignedDentist.person.firstName} ${assignedDentist.person.lastName}`;
    const date = new Date(year, month - 1, day);

    // Best-effort — a failed email/automation should never block a successful booking.
    sendAppointmentConfirmationEmail({
      to: patient.person.email,
      patientName: patient.person.firstName,
      dentistName,
      room: assignedDentist.roomNumber,
      date,
      hour,
    }).catch((err) => console.error("[email] confirmation failed:", err));

    notifyN8n("booking", {
      patientName: `${patient.person.firstName} ${patient.person.lastName}`,
      patientEmail: patient.person.email,
      dentistName,
      room: assignedDentist.roomNumber,
      date: date.toISOString().slice(0, 10),
      hour,
      staffBooking,
    }).catch(() => undefined);
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/appointments');
  
  if (staffBooking) {
    redirect('/dashboard');
  } else {
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    redirect(`/dashboard/book/success?date=${dateString}&hour=${hour}&room=${assignedDentist.roomNumber}`);
  }
}

// Cancels an appointment. Patients can only cancel their own upcoming
// appointments; receptionists/admins can cancel any appointment.
export async function cancelAppointment(formData: FormData) {
  const dbPerson = await getCurrentPerson();
  if (!dbPerson) throw new Error("Not authenticated");

  const appointmentId = parseInt(formData.get("appointmentId") as string, 10);
  if (!appointmentId) throw new Error("Missing appointment.");

  const appointment = await prisma.appointment.findUnique({ where: { appointmentId } });
  if (!appointment) throw new Error("Appointment not found.");

  const isOwner = dbPerson.patients.some((p) => p.patientId === appointment.pId);
  const isStaff = isReceptionist(dbPerson) || dbPerson.admins.length > 0;

  if (!isOwner && !isStaff) {
    throw new Error("You're not authorized to cancel this appointment.");
  }

  await prisma.appointment.delete({ where: { appointmentId } });

  revalidatePath('/dashboard/appointments');
  revalidatePath('/dashboard');
}

// Action to retrieve upcoming appointments for a patient
export async function getUpcomingAppointments(patientId: number) {
  const appointments = await prisma.appointment.findMany({
    where: {
      pId: patientId,
    },
    include: {
      dentist: {
        include: {
          person: true
        }
      }
    }
  });

  return appointments;
}

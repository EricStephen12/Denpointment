"use server"

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isReceptionist } from "@/lib/auth";
import { sendAppointmentConfirmationEmail } from "@/lib/email";
import { compareCalendarDays, getClinicDay, toDateKey } from "@/lib/clinic-date";

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

  // Patients need a phone number for appointment confirmation.
  // We accept it directly from the booking calendar if not yet saved on profile.
  if (!staffBooking) {
    const profile = await prisma.patient.findUnique({
      where: { patientId },
      include: { person: { include: { contacts: true } } },
    });

    const formPhone = (formData.get("phone") as string || "").trim();
    const hasContact = profile && profile.person.contacts.length > 0;

    if (!hasContact) {
      if (!formPhone) {
        throw new Error("Please enter your phone number so the clinic can confirm your booking.");
      }
      // Save phone number directly to patient's profile in background
      await prisma.personContactNumber.create({
        data: {
          personId: profile!.personId,
          contactNumber: formPhone.replace(/[^0-9+]/g, "").slice(0, 15),
        },
      });
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
  const bookedDay = { year, month, day };
  // Weekday check uses a noon UTC instant so the calendar day is stable.
  const dateObj = new Date(Date.UTC(year, month - 1, day, 12));

  if (compareCalendarDays(bookedDay, getClinicDay()) < 0) {
    throw new Error("You can't book an appointment in the past.");
  }

  const settings = await prisma.clinicSettings.findUnique({ where: { id: 1 } });
  const openHour = settings?.openHour ?? 8;
  const closeHour = settings?.closeHour ?? 18;
  const workingDays = settings?.workingDays ?? [1, 2, 3, 4, 5];

  if (hour < openHour || hour >= closeHour) {
    throw new Error(`The clinic is only open between ${openHour}:00 and ${closeHour}:00.`);
  }
  if (!workingDays.includes(dateObj.getUTCDay())) {
    throw new Error("The clinic is closed on the selected day.");
  }

  // Find an available dentist for this slot (optimized single query, ignores cancelled bookings)
  const holidayDateMidnight = new Date(Date.UTC(year, month - 1, day));
  const assignedDentist = await prisma.dentist.findFirst({
    where: {
      holidays: {
        none: {
          restDate: holidayDateMidnight,
        },
      },
      appointments: {
        none: {
          year,
          month,
          day,
          hour,
          status: { not: "cancelled" },
        },
      },
    },
    include: { person: true },
  });

  if (!assignedDentist) {
    throw new Error("Sorry, no dentists are available at this time. Please pick another slot.");
  }

  const serviceIdRaw = formData.get("serviceId") as string | null;
  const serviceId = serviceIdRaw ? parseInt(serviceIdRaw, 10) : null;
  const service = serviceId ? await prisma.service.findUnique({ where: { serviceId } }) : null;

  let patient;
  try {
    const createdAppointment = await prisma.appointment.create({
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

    if (service) {
      await prisma.treatment.create({
        data: {
          aId: createdAppointment.appointmentId,
          treatorId: assignedDentist.dentistId,
          serviceId: service.serviceId,
          action: service.name,
          complaint: `Booked Procedure: ${service.name}`,
          charge: service.price,
          paid: false,
        }
      });
    }

    patient = await prisma.patient.findUnique({ where: { patientId }, include: { person: true } });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("This time slot was just booked by someone else. Please pick another.");
    }
    throw error;
  }

  if (patient) {
    const dentistName = `${assignedDentist.person.firstName} ${assignedDentist.person.lastName}`;

    // Best-effort — a failed email should never block a successful booking.
    sendAppointmentConfirmationEmail({
      to: patient.person.email,
      patientName: patient.person.firstName,
      dentistName,
      room: assignedDentist.roomNumber,
      date: bookedDay,
      hour,
      serviceName: service?.name,
    }).catch((err) => console.error("[email] confirmation failed:", err));
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/appointments');
  
  if (staffBooking) {
    redirect('/dashboard');
  } else {
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const serviceParam = service ? `&service=${encodeURIComponent(service.name)}` : '';
    redirect(`/dashboard/book/success?date=${dateString}&hour=${hour}&room=${assignedDentist.roomNumber}${serviceParam}`);
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

"use server"

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isReceptionist } from "@/lib/auth";
import {
  sendAppointmentConfirmationEmail,
  sendDentistNewAppointmentEmail,
  sendAppointmentCancellationEmail,
} from "@/lib/email";
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
  const typeRaw = (formData.get("type") as string | null) || "checkup";
  const notes = ((formData.get("notes") as string) || "").trim().slice(0, 500);

  const VALID_TYPES = ["checkup","cleaning","emergency","follow_up","consultation","extraction","other"];
  const apptType = VALID_TYPES.includes(typeRaw) ? typeRaw : "checkup";
  const service = serviceId ? await prisma.service.findUnique({ where: { serviceId } }) : null;

  let patient;
  try {
    const createdAppointment = await prisma.appointment.create({
      data: {
        pId: patientId,
        dId: assignedDentist.dentistId,
        year, month, day, hour,
        room: assignedDentist.roomNumber,
        type: apptType as any,
        notes: notes || null,
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
    const patientName = `${patient.person.firstName} ${patient.person.lastName}`;

    // 1. Patient booking confirmation email
    sendAppointmentConfirmationEmail({
      to: patient.person.email,
      patientName: patient.person.firstName,
      dentistName,
      room: assignedDentist.roomNumber,
      date: bookedDay,
      hour,
      serviceName: service?.name,
    }).catch((err) => console.error("[email] patient confirmation failed:", err));

    // 2. Dentist clinical alert notification
    if (assignedDentist.person?.email) {
      sendDentistNewAppointmentEmail({
        to: assignedDentist.person.email,
        dentistName: assignedDentist.person.firstName,
        patientName,
        patientEmail: patient.person.email,
        room: assignedDentist.roomNumber,
        date: bookedDay,
        hour,
        serviceName: service?.name,
      }).catch((err) => console.error("[email] dentist booking alert failed:", err));
    }
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

  const appointment = await prisma.appointment.findUnique({
    where: { appointmentId },
    include: {
      patient: { include: { person: true } },
      dentist: { include: { person: true } },
      treatments: { include: { service: true } },
    },
  });
  if (!appointment) throw new Error("Appointment not found.");

  const isOwner = dbPerson.patients.some((p) => p.patientId === appointment.pId);
  const isStaff = isReceptionist(dbPerson) || dbPerson.admins.length > 0;

  if (!isOwner && !isStaff) {
    throw new Error("You're not authorized to cancel this appointment.");
  }

  await prisma.appointment.delete({ where: { appointmentId } });

  // Dual-sided cancellation notices (best-effort)
  const dateObj = { year: appointment.year, month: appointment.month, day: appointment.day };
  const firstTreatment = appointment.treatments?.[0];
  const serviceName = firstTreatment?.service?.name || firstTreatment?.action;
  const patientPerson = appointment.patient?.person;
  const dentistPerson = appointment.dentist?.person;

  if (patientPerson) {
    sendAppointmentCancellationEmail({
      to: patientPerson.email,
      recipientName: patientPerson.firstName,
      otherPartyName: dentistPerson ? `${dentistPerson.firstName} ${dentistPerson.lastName}` : "your provider",
      isDentist: false,
      room: appointment.room,
      date: dateObj,
      hour: appointment.hour,
      serviceName,
    }).catch((err) => console.error("[email] patient cancellation failed:", err));
  }

  if (dentistPerson) {
    sendAppointmentCancellationEmail({
      to: dentistPerson.email,
      recipientName: dentistPerson.firstName,
      otherPartyName: patientPerson ? `${patientPerson.firstName} ${patientPerson.lastName}` : "A patient",
      isDentist: true,
      room: appointment.room,
      date: dateObj,
      hour: appointment.hour,
      serviceName,
    }).catch((err) => console.error("[email] dentist cancellation failed:", err));
  }

  revalidatePath('/dashboard/appointments');
  revalidatePath('/dashboard');
}

// ─── Phase 2: Scheduling actions ────────────────────────────────────────────

async function requireStaff() {
  const person = await getCurrentPerson();
  if (!person) throw new Error("Not authenticated");
  const isStaff = (person.admins?.length ?? 0) > 0 || (person.receptionists?.length ?? 0) > 0;
  if (!isStaff) throw new Error("Not authorized.");
  return person;
}

/** One-click check-in: set arrivedAt + status → checked_in */
export async function checkInAppointment(formData: FormData) {
  await requireStaff();
  const appointmentId = parseInt(formData.get("appointmentId") as string, 10);
  if (!appointmentId) throw new Error("Missing appointment ID.");
  await prisma.appointment.update({
    where: { appointmentId },
    data: {
      status: "checked_in",
      checkedIn: true,
      arrivedAt: new Date(),
    },
  });
  revalidatePath("/dashboard/treatments/today");
  revalidatePath("/dashboard/reception/checkin");
}

/** Mark a patient as no-show */
export async function markNoShow(formData: FormData) {
  await requireStaff();
  const appointmentId = parseInt(formData.get("appointmentId") as string, 10);
  if (!appointmentId) throw new Error("Missing appointment ID.");
  await prisma.appointment.update({
    where: { appointmentId },
    data: { status: "no_show", noShow: true },
  });
  revalidatePath("/dashboard/treatments/today");
  revalidatePath("/dashboard/reception/checkin");
}

/** Confirm appointment (patient confirmed they're coming) */
export async function confirmAppointment(formData: FormData) {
  await requireStaff();
  const appointmentId = parseInt(formData.get("appointmentId") as string, 10);
  if (!appointmentId) throw new Error("Missing appointment ID.");
  await prisma.appointment.update({
    where: { appointmentId },
    data: { confirmedAt: new Date() },
  });
  revalidatePath("/dashboard/treatments/today");
  revalidatePath("/dashboard/treatments/upcoming");
}

/** Reschedule: move appointment to a new date + hour */
export async function rescheduleAppointment(formData: FormData) {
  await requireStaff();
  const appointmentId = parseInt(formData.get("appointmentId") as string, 10);
  const dateStr = (formData.get("date") as string || "").trim();
  const hour = parseInt(formData.get("hour") as string, 10);
  if (!appointmentId || !dateStr || Number.isNaN(hour)) throw new Error("All fields required.");

  const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!dateParts) throw new Error("Invalid date.");
  const year = parseInt(dateParts[1], 10);
  const month = parseInt(dateParts[2], 10);
  const day = parseInt(dateParts[3], 10);

  const existing = await prisma.appointment.findUnique({ where: { appointmentId } });
  if (!existing) throw new Error("Appointment not found.");

  // Check new slot is free for this dentist
  const conflict = await prisma.appointment.findFirst({
    where: {
      dId: existing.dId,
      year, month, day, hour,
      status: { not: "cancelled" },
      NOT: { appointmentId },
    },
  });
  if (conflict) throw new Error("That slot is already taken. Please choose another time.");

  await prisma.appointment.update({
    where: { appointmentId },
    data: { year, month, day, hour, status: "scheduled", checkedIn: false, arrivedAt: null, confirmedAt: null },
  });

  revalidatePath("/dashboard/treatments/today");
  revalidatePath("/dashboard/treatments/upcoming");
  revalidatePath(`/dashboard/patients/${existing.pId}`);
}

/** Add a patient to the waiting list */
export async function addToWaitlist(formData: FormData) {
  await requireStaff();
  const patientId = parseInt(formData.get("patientId") as string, 10);
  const dateStr = (formData.get("requestedDate") as string || "").trim();
  const notes = (formData.get("notes") as string || "").trim().slice(0, 300);
  const dentistIdRaw = formData.get("dentistId") as string | null;
  const dentistId = dentistIdRaw ? parseInt(dentistIdRaw, 10) : null;

  if (!patientId || !dateStr) throw new Error("Patient and date required.");
  const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!dateParts) throw new Error("Invalid date.");
  const [, y, m, d] = dateParts;

  await prisma.waitlistEntry.create({
    data: {
      patientId,
      dentistId,
      requestedDate: new Date(`${y}-${m}-${d}T12:00:00.000Z`),
      notes: notes || null,
    },
  });
  revalidatePath("/dashboard/reception/waitlist");
}

/** Update waitlist entry status */
export async function updateWaitlistStatus(formData: FormData) {
  await requireStaff();
  const waitlistId = parseInt(formData.get("waitlistId") as string, 10);
  const status = formData.get("status") as "waiting" | "booked" | "expired";
  const allowed = ["waiting", "booked", "expired"];
  if (!waitlistId || !allowed.includes(status)) throw new Error("Invalid.");
  await prisma.waitlistEntry.update({ where: { waitlistId }, data: { status } });
  revalidatePath("/dashboard/reception/waitlist");
}

// ─── Phase 6: Manual reminder trigger ────────────────────────────────────────

import { sendAppointmentReminderEmail } from "@/lib/email";

export async function sendManualReminder(formData: FormData) {
  const person = await getCurrentPerson();
  if (!person) throw new Error("Not authenticated");
  const isStaff = (person.admins?.length ?? 0) > 0 || (person.receptionists?.length ?? 0) > 0;
  if (!isStaff) throw new Error("Not authorized.");

  const appointmentId = parseInt(formData.get("appointmentId") as string, 10);
  if (!appointmentId) throw new Error("Missing appointment ID.");

  const appt = await prisma.appointment.findUnique({
    where: { appointmentId },
    include: {
      patient: { include: { person: true } },
      dentist: { include: { person: true } },
    },
  });
  if (!appt) throw new Error("Appointment not found.");

  await sendAppointmentReminderEmail({
    to: appt.patient.person.email,
    patientName: appt.patient.person.firstName,
    dentistName: `${appt.dentist.person.firstName} ${appt.dentist.person.lastName}`,
    room: appt.room,
    date: { year: appt.year, month: appt.month, day: appt.day },
    hour: appt.hour,
  });

  // Mark reminder sent
  await prisma.appointment.update({
    where: { appointmentId },
    data: { reminderSent: true },
  });

  revalidatePath("/dashboard/treatments/today");
  revalidatePath("/dashboard/reception/checkin");
  revalidatePath("/dashboard/treatments/upcoming");
}

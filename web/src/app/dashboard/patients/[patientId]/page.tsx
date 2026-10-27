import React from "react";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isAdmin, isDentist, isReceptionist } from "@/lib/auth";
import { formatClinicDate, getClinicDay } from "@/lib/clinic-date";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import PatientWorkspaceView from "@/components/patients/PatientWorkspaceView";

export default async function PatientProfilePage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isDentist(dbUser) && !isReceptionist(dbUser) && !isAdmin(dbUser)) {
    redirect("/dashboard");
  }

  const { patientId: rawId } = await params;
  const patientId = parseInt(rawId, 10);
  if (Number.isNaN(patientId)) notFound();

  const patient = await prisma.patient.findUnique({
    where: { patientId },
    include: {
      person: {
        include: {
          addresses: true,
          contacts: true,
          diseases: true,
        },
      },
      currentMedications: {
        where: { active: true },
        orderBy: { createdAt: "asc" },
      },
      toothFindings: {
        where: { active: true },
        orderBy: { toothNumber: "asc" },
      },
      images: {
        orderBy: { createdAt: "desc" },
        take: 40,
      },
      allergies: { orderBy: { recordedAt: "desc" } },
      medicalNotes: { orderBy: { recordedAt: "desc" }, take: 30 },
      treatmentPlans: {
        orderBy: { createdAt: "desc" },
        include: { items: { orderBy: { sortOrder: "asc" } } },
      },
      perioReadings: {
        where: { active: true },
        orderBy: { toothNumber: "asc" },
      },
      consents: { orderBy: { createdAt: "desc" } },
      recalls: { orderBy: { dueDate: "asc" } },
      insurancePolicies: { orderBy: { createdAt: "desc" } },
      labCases: { orderBy: { sentAt: "desc" } },
      referrals: { orderBy: { createdAt: "desc" } },
      appointments: {
        include: {
          dentist: { include: { person: true } },
          treatments: { include: { medicines: true } },
        },
        orderBy: [{ year: "desc" }, { month: "desc" }, { day: "desc" }, { hour: "desc" }],
      },
    },
  });

  if (!patient) notFound();

  const [allDentists, settings, clinicServices] = await Promise.all([
    prisma.dentist.findMany({ include: { person: true } }),
    prisma.clinicSettings.findUnique({ where: { id: 1 } }),
    prisma.service.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);
  const openHour = settings?.openHour ?? 8;
  const closeHour = settings?.closeHour ?? 18;
  const dentistOptions = allDentists.map((d) => ({
    dentistId: d.dentistId,
    name: `${d.person.firstName} ${d.person.lastName}`,
    defaultRoom: d.roomNumber,
  }));

  const person = patient.person;
  const patientFullName = `${person.firstName} ${person.lastName}`;
  const initials = `${person.firstName[0] || ""}${person.lastName[0] || ""}`.toUpperCase();

  const canEditDemographics = isReceptionist(dbUser) || isAdmin(dbUser);
  const canEditChart = isDentist(dbUser) || isAdmin(dbUser);
  const canEditClinical = isDentist(dbUser) || isAdmin(dbUser);

  const firstAppt = patient.appointments.length > 0
    ? patient.appointments[patient.appointments.length - 1]
    : null;
  const patientSince = firstAppt
    ? `${firstAppt.day}/${firstAppt.month}/${firstAppt.year}`
    : "New Patient";

  const totalCharge = patient.appointments
    .flatMap((a) => a.treatments)
    .reduce((sum, t) => sum + t.charge, 0);
  const totalPaid = patient.appointments
    .flatMap((a) => a.treatments)
    .filter((t) => t.paid)
    .reduce((sum, t) => sum + t.charge, 0);
  const outstanding = Math.max(totalCharge - totalPaid, 0);

  const birthLabel = person.birthDate
    ? formatClinicDate(person.birthDate, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;
  const clinicToday = getClinicDay();
  const age = person.birthDate
    ? clinicToday.year -
      person.birthDate.getUTCFullYear() -
      Number(
        clinicToday.month < person.birthDate.getUTCMonth() + 1 ||
          (clinicToday.month === person.birthDate.getUTCMonth() + 1 &&
            clinicToday.day < person.birthDate.getUTCDate()),
      )
    : null;

  const phone = person.contacts[0]?.contactNumber;

  return (
    <PatientWorkspaceView
      patient={patient}
      person={person}
      patientId={patientId}
      initials={initials}
      patientFullName={patientFullName}
      birthLabel={birthLabel}
      age={age}
      patientSince={patientSince}
      phone={phone}
      totalCharge={totalCharge}
      outstanding={outstanding}
      canEditDemographics={canEditDemographics}
      canEditChart={canEditChart}
      canEditClinical={canEditClinical}
      dentistOptions={dentistOptions}
      openHour={openHour}
      closeHour={closeHour}
      cloudinaryReady={isCloudinaryConfigured()}
      isAdminUser={isAdmin(dbUser)}
      isReceptionistUser={isReceptionist(dbUser)}
      clinicServices={clinicServices}
    />
  );
}

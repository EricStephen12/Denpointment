import React from "react";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isAdmin, isDentist, isReceptionist } from "@/lib/auth";
import { formatClinicDate, getClinicDay } from "@/lib/clinic-date";
import { formatNaira } from "@/lib/currency";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import Odontogram from "@/components/dashboards/Odontogram";
import PatientImages from "@/components/dashboards/PatientImages";
import ClinicalCarePanel from "@/components/dashboards/ClinicalCarePanel";
import PatientDemographicsEditor from "@/components/patients/PatientDemographicsEditor";
import DeletePatientButton from "@/components/patients/DeletePatientButton";
import { ArrowLeft, Calendar, User, AlertTriangle, Pill, Clock } from "lucide-react";
import { formatNaira as _fmt } from "@/lib/currency";

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

  const person = patient.person;

  const canEditDemographics = isReceptionist(dbUser) || isAdmin(dbUser);
  const canEditChart = isDentist(dbUser) || isAdmin(dbUser);
  const canEditClinical = isDentist(dbUser) || isAdmin(dbUser);
  const canViewClinical = isDentist(dbUser) || isAdmin(dbUser);

  // Derive patient since from earliest appointment
  const firstAppt = patient.appointments.length > 0
    ? patient.appointments[patient.appointments.length - 1]
    : null;
  const patientSince = firstAppt
    ? `${firstAppt.day}/${firstAppt.month}/${firstAppt.year}`
    : "No visits yet";

  // Outstanding balance
  const totalCharge = patient.appointments
    .flatMap((a) => a.treatments)
    .reduce((sum, t) => sum + t.charge, 0);
  const totalPaid = patient.appointments
    .flatMap((a) => a.treatments)
    .filter((t) => t.paid)
    .reduce((sum, t) => sum + t.charge, 0);
  const outstanding = totalCharge - totalPaid;

  const birthLabel = person.birthDate
    ? formatClinicDate(person.birthDate, {
        year: "numeric",
        month: "long",
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

  return (
    <div className="max-w-6xl">
      {/* Back */}
      <Link
        href="/dashboard/patients"
        className="inline-flex items-center gap-1.5 text-xs text-sand-50/40 hover:text-turq-400 mb-6 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All Patients
      </Link>

      {/* ── Patient Header Card ── */}
      <div className="dash-surface p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          {/* Left: identity */}
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-2xl bg-turq-500/15 border border-turq-500/20 flex items-center justify-center text-turq-300 font-bold text-xl shrink-0">
              {person.firstName[0]}{person.lastName[0]}
            </div>
            <div>
              <h1 className="text-2xl font-display text-sand-50 leading-tight">
                {person.firstName} {person.lastName}
              </h1>
              <p className="text-sm text-sand-50/50 mt-0.5">{person.email}</p>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="text-xs text-sand-50/40 uppercase tracking-wider">
                  {person.gender}
                </span>
                {age !== null && (
                  <span className="text-xs text-sand-50/40">{age} yrs</span>
                )}
                {birthLabel && (
                  <span className="text-xs text-sand-50/30">Born {birthLabel}</span>
                )}
                <span className="text-xs text-sand-50/30">Patient since {patientSince}</span>
              </div>
              {/* Alert badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                {patient.allergies.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-red-900/30 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="h-3 w-3" />
                    {patient.allergies.length} {patient.allergies.length === 1 ? "Allergy" : "Allergies"}
                  </span>
                )}
                {person.diseases.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-900/30 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                    {person.diseases.map((d) => d.chronicDisease).join(", ")}
                  </span>
                )}
                {patient.currentMedications.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-blue-900/30 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded-full">
                    <Pill className="h-3 w-3" />
                    {patient.currentMedications.length} medication{patient.currentMedications.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: quick stats + actions */}
          <div className="flex flex-col items-start md:items-end gap-4 shrink-0">
            {outstanding > 0 && (
              <div className="px-4 py-2 rounded-xl bg-red-900/20 border border-red-500/20 text-right">
                <p className="text-[10px] uppercase tracking-wider text-red-400/70">Outstanding</p>
                <p className="text-lg font-display text-red-400">{formatNaira(outstanding)}</p>
              </div>
            )}
            {outstanding === 0 && totalCharge > 0 && (
              <div className="px-4 py-2 rounded-xl bg-turq-600/10 border border-turq-500/20 text-right">
                <p className="text-[10px] uppercase tracking-wider text-turq-400/70">Balance</p>
                <p className="text-lg font-display text-turq-400">Settled</p>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              {outstanding > 0 && (isAdmin(dbUser) || isReceptionist(dbUser)) && (
                <Link
                  href={`/dashboard/admin/billing?q=${encodeURIComponent(person.firstName + " " + person.lastName)}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 px-4 py-2 rounded-xl transition-colors"
                >
                  💳 Collect Payment
                </Link>
              )}
              {canEditDemographics && (
                <Link
                  href={`/dashboard/book?patientId=${patient.patientId}`}
                  className="inline-flex items-center gap-1.5 text-xs font-medium bg-turq-600 hover:bg-turq-500 text-ink-950 px-4 py-2 rounded-xl transition-colors"
                >
                  <Calendar className="h-3.5 w-3.5" /> Book Appointment
                </Link>
              )}
              <Link
                href={`/dashboard/patients/${patientId}#dental-chart`}
                className="inline-flex items-center gap-1.5 text-xs font-medium border border-sand-50/15 hover:border-turq-400/40 text-sand-50/70 hover:text-turq-400 px-4 py-2 rounded-xl transition-colors"
              >
                View Tooth Chart
              </Link>
              {isAdmin(dbUser) && (
                <DeletePatientButton
                  patientId={patient.patientId}
                  patientName={`${person.firstName} ${person.lastName}`}
                  variant="button"
                  redirectAfterDelete={true}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Anchor Navigation Bar ── */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-ink-900/90 border border-sand-50/10 mb-8 sticky top-4 z-20 backdrop-blur-md shadow-lg shadow-black/30">
        <span className="text-xs font-semibold text-sand-50/40 uppercase tracking-wider px-2">Jump to:</span>
        <a href="#demographics" className="px-3 py-1.5 rounded-lg text-xs font-medium bg-sand-50/5 hover:bg-turq-500/15 text-sand-50/80 hover:text-turq-300 border border-sand-50/10 transition-colors">
          👤 Info &amp; Contacts
        </a>
        <a href="#visit-history" className="px-3 py-1.5 rounded-lg text-xs font-medium bg-sand-50/5 hover:bg-turq-500/15 text-sand-50/80 hover:text-turq-300 border border-sand-50/10 transition-colors">
          🗓️ Visits ({patient.appointments.length})
        </a>
        {(isDentist(dbUser) || isAdmin(dbUser)) && (
          <>
            <a href="#dental-chart" className="px-3 py-1.5 rounded-lg text-xs font-medium bg-sand-50/5 hover:bg-turq-500/15 text-sand-50/80 hover:text-turq-300 border border-sand-50/10 transition-colors">
              🦷 2D Dental Chart ({patient.toothFindings.length})
            </a>
            <a href="#clinical-care" className="px-3 py-1.5 rounded-lg text-xs font-medium bg-sand-50/5 hover:bg-turq-500/15 text-sand-50/80 hover:text-turq-300 border border-sand-50/10 transition-colors">
              📋 Clinical &amp; Plans ({patient.treatmentPlans.length})
            </a>
            <a href="#patient-images" className="px-3 py-1.5 rounded-lg text-xs font-medium bg-sand-50/5 hover:bg-turq-500/15 text-sand-50/80 hover:text-turq-300 border border-sand-50/10 transition-colors">
              📸 Photos &amp; X-Rays ({patient.images.length})
            </a>
          </>
        )}
      </div>

      {/* ── Main two-column layout ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">

        {/* Left column: Demographics + Contact */}
        <div id="demographics" className="xl:col-span-1 space-y-6 scroll-mt-24">

          {/* Demographics — editable by receptionist/admin */}
          <PatientDemographicsEditor
            patientId={patientId}
            canEdit={canEditDemographics}
            canViewClinical={canEditChart}
            data={{
              firstName: person.firstName,
              lastName: person.lastName,
              email: person.email,
              phone: person.contacts[0]?.contactNumber ?? "",
              contacts: person.contacts.map((c) => c.contactNumber),
              street: person.addresses[0]?.street ?? "",
              city: person.addresses[0]?.city ?? "",
              occupation: person.occupation ?? "",
              referralSource: person.referralSource ?? "",
              emergencyContactName: person.emergencyContactName ?? "",
              emergencyContactPhone: person.emergencyContactPhone ?? "",
              diseases: canEditChart ? person.diseases.map((d) => d.chronicDisease) : [],
              currentMedications: canEditChart ? patient.currentMedications.map((m) => ({
                medicationId: m.medicationId,
                name: m.name,
                dose: m.dose,
                notes: m.notes,
              })) : [],
            }}
          />
        </div>

        {/* Right column: Appointment history */}
        <div id="visit-history" className="xl:col-span-2 scroll-mt-24">
          <div className="dash-surface p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-turq-400" />
              <h2 className="text-sm font-semibold text-sand-50">Visit History</h2>
              <span className="text-xs text-sand-50/30 ml-auto">
                {patient.appointments.length} visit{patient.appointments.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Dentist</th>
                    <th>Treatment</th>
                    <th>Charge</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {patient.appointments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="td-empty">No visits recorded yet.</td>
                    </tr>
                  ) : (
                    patient.appointments.map((app) => {
                      const labels = app.treatments
                        .map((t) =>
                          t.toothNumber != null ? `#${t.toothNumber} ${t.action}` : t.action,
                        )
                        .join("; ");
                      const total = app.treatments.reduce((sum, t) => sum + t.charge, 0);
                      const allPaid = app.treatments.length > 0 && app.treatments.every((t) => t.paid);
                      const anyUnpaid = app.treatments.some((t) => !t.paid && t.charge > 0);
                      return (
                        <tr key={app.appointmentId}>
                          <td className="whitespace-nowrap">
                            {app.day}/{app.month}/{app.year} · {app.hour}:00
                          </td>
                          <td>Dr. {app.dentist.person.lastName}</td>
                          <td className="max-w-[200px] truncate">{labels || "—"}</td>
                          <td>{app.treatments.length > 0 ? formatNaira(total) : "—"}</td>
                          <td>
                            {app.treatments.length === 0 ? (
                              <span className="text-sand-50/30 text-xs">—</span>
                            ) : allPaid ? (
                              <span className="text-turq-400 text-xs">Paid</span>
                            ) : anyUnpaid ? (
                              <span className="text-amber-400 text-xs">Unpaid</span>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── Dental Chart ── */}
      {(isDentist(dbUser) || isAdmin(dbUser)) && (
        <div id="dental-chart" className="scroll-mt-24 mb-8">
          <Odontogram
            patientId={patient.patientId}
            findings={patient.toothFindings.map((f) => ({
              toothNumber: f.toothNumber,
              condition: f.condition,
              surfaces: f.surfaces,
              notes: f.notes,
            }))}
            canEdit={canEditChart}
          />
        </div>
      )}

      {/* ── Clinical Care Panel ── */}
      {(isDentist(dbUser) || isAdmin(dbUser)) && (
        <div id="clinical-care" className="scroll-mt-24 mb-8">
          <ClinicalCarePanel
            patientId={patient.patientId}
            canEdit={canEditClinical}
            isDentist={canEditChart}
            data={{
              allergies: patient.allergies.map((a) => ({
                allergyId: a.allergyId,
                name: a.name,
                severity: a.severity,
                notes: a.notes,
              })),
              medicalNotes: patient.medicalNotes.map((n) => ({
                noteId: n.noteId,
                body: n.body,
                recordedAt: n.recordedAt.toISOString(),
              })),
              treatmentPlans: patient.treatmentPlans.map((p) => ({
                planId: p.planId,
                title: p.title,
                notes: p.notes,
                items: p.items.map((i) => ({
                  itemId: i.itemId,
                  description: i.description,
                  toothNumber: i.toothNumber,
                  surfaces: i.surfaces,
                  estimatedCharge: i.estimatedCharge,
                  status: i.status,
                })),
              })),
              perioReadings: patient.perioReadings.map((r) => ({
                readingId: r.readingId,
                toothNumber: r.toothNumber,
                pocketMm: r.pocketMm,
                bleeding: r.bleeding,
                mobility: r.mobility,
                notes: r.notes,
              })),
              consents: patient.consents.map((c) => ({
                consentId: c.consentId,
                title: c.title,
                summary: c.summary,
                status: c.status,
                signedByName: c.signedByName,
                signedAt: c.signedAt?.toISOString() ?? null,
              })),
              recalls: patient.recalls.map((r) => ({
                recallId: r.recallId,
                reason: r.reason,
                dueDate: r.dueDate.toISOString(),
                status: r.status,
                notes: r.notes,
              })),
              insurancePolicies: patient.insurancePolicies.map((p) => ({
                insuranceId: p.insuranceId,
                provider: p.provider,
                policyNumber: p.policyNumber,
                memberId: p.memberId,
                groupNumber: p.groupNumber,
                notes: p.notes,
                active: p.active,
              })),
              labCases: patient.labCases.map((l) => ({
                labCaseId: l.labCaseId,
                labName: l.labName,
                itemDescription: l.itemDescription,
                toothNumber: l.toothNumber,
                dueDate: l.dueDate?.toISOString() ?? null,
                status: l.status,
                notes: l.notes,
              })),
              referrals: patient.referrals.map((r) => ({
                referralId: r.referralId,
                specialistType: r.specialistType,
                reason: r.reason,
                urgency: r.urgency,
                status: r.status,
                notes: r.notes,
                createdAt: r.createdAt.toISOString(),
              })),
            }}
          />
        </div>
      )}

      {/* ── Images ── */}
      {(isDentist(dbUser) || isAdmin(dbUser)) && (
        <div id="patient-images" className="scroll-mt-24 mb-8">
          <PatientImages
            patientId={patient.patientId}
            canEdit={canEditChart}
            cloudinaryReady={isCloudinaryConfigured()}
            images={patient.images.map((img) => ({
              imageId: img.imageId,
              kind: img.kind,
              url: img.url,
              caption: img.caption,
              createdAt: img.createdAt.toISOString(),
            }))}
          />
        </div>
      )}
    </div>
  );
}

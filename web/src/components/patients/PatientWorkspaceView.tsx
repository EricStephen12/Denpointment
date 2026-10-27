"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatNaira } from "@/lib/currency";
import Odontogram, { type ChartFinding } from "@/components/dashboards/Odontogram";
import ClinicalCarePanel, { type ClinicalCareData } from "@/components/dashboards/ClinicalCarePanel";
import PatientImages, { type PatientImageItem } from "@/components/dashboards/PatientImages";
import PatientDemographicsEditor from "@/components/patients/PatientDemographicsEditor";
import DeletePatientButton from "@/components/patients/DeletePatientButton";
import ReassignAppointmentModal from "@/components/reception/ReassignAppointmentModal";
import {
  Calendar,
  User,
  AlertTriangle,
  Pill,
  Clock,
  Phone,
  Mail,
  Activity,
  FileText,
  Camera,
  CreditCard,
  CheckCircle2,
  HeartPulse,
} from "lucide-react";

type Props = {
  patient: any;
  person: any;
  patientId: number;
  initials: string;
  patientFullName: string;
  birthLabel: string | null;
  age: number | null;
  patientSince: string;
  phone?: string;
  totalCharge: number;
  outstanding: number;
  canEditDemographics: boolean;
  canEditChart: boolean;
  canEditClinical: boolean;
  dentistOptions: any[];
  openHour: number;
  closeHour: number;
  cloudinaryReady: boolean;
  isAdminUser: boolean;
  isReceptionistUser: boolean;
  clinicServices?: any[];
};

export default function PatientWorkspaceView({
  patient,
  person,
  patientId,
  initials,
  patientFullName,
  birthLabel,
  age,
  patientSince,
  phone,
  totalCharge,
  outstanding,
  canEditDemographics,
  canEditChart,
  canEditClinical,
  dentistOptions,
  openHour,
  closeHour,
  cloudinaryReady,
  isAdminUser,
  isReceptionistUser,
  clinicServices,
}: Props) {
  // Default to dental chart for clinicians, or visits for receptionists
  const [activeTab, setActiveTab] = useState<"chart" | "clinical" | "images" | "visits" | "demographics">(
    canEditChart ? "chart" : "visits"
  );

  const allPlanItems = (patient.treatmentPlans || []).flatMap((p: any) =>
    (p.items || []).map((i: any) => ({
      itemId: i.itemId,
      planId: p.planId,
      description: i.description,
      toothNumber: i.toothNumber,
      surfaces: i.surfaces,
      estimatedCharge: i.estimatedCharge,
      status: i.status,
    }))
  );

  return (
    <div className="space-y-5">
      {/* ── Compact Executive Header: Minimal Text, High Density ── */}
      <div className="bg-ink-900 border border-sand-50/10 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Identity & Contact Badges */}
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-turq-500/10 border border-turq-500/20 text-turq-400 flex items-center justify-center font-bold text-xl shrink-0 shadow-inner">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold font-display text-sand-50">
                  {patientFullName}
                </h1>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-sand-50/5 border border-sand-50/10 text-sand-50/60">
                  #{String(patient.patientId).padStart(4, "0")}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md capitalize bg-turq-500/10 text-turq-300 border border-turq-500/20">
                  {person.gender || "Patient"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-sand-50/60">
                {phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3 text-turq-400" />
                    <a href={`tel:${phone}`} className="hover:text-sand-50 transition-colors">
                      {phone}
                    </a>
                  </span>
                )}
                {person.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3 text-sand-50/40" />
                    <a href={`mailto:${person.email}`} className="hover:text-sand-50 transition-colors">
                      {person.email}
                    </a>
                  </span>
                )}
                {age !== null && (
                  <span className="text-sand-50/40">
                    {age} yrs {birthLabel && `(${birthLabel})`}
                  </span>
                )}
              </div>

              {/* High-Visibility Medical Warning Badges */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                {patient.allergies.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-red-950/50 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-md">
                    <AlertTriangle className="h-3 w-3 text-red-400" />
                    {patient.allergies.length} {patient.allergies.length === 1 ? "Allergy" : "Allergies"}
                  </span>
                )}
                {person.diseases.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-950/50 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md">
                    <HeartPulse className="h-3 w-3 text-amber-400" />
                    {person.diseases.map((d: any) => d.chronicDisease).join(", ")}
                  </span>
                )}
                {patient.currentMedications.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-sky-950/50 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-md">
                    <Pill className="h-3 w-3 text-sky-400" />
                    {patient.currentMedications.length} Meds
                  </span>
                )}
                {patient.allergies.length === 0 && person.diseases.length === 0 && (
                  <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 bg-emerald-950/30 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="h-3 w-3" /> No Medical Alerts
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Balance & Instant Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {outstanding > 0 ? (
              <div className="px-3.5 py-1.5 rounded-xl bg-red-950/40 border border-red-500/20 text-right">
                <span className="text-[10px] uppercase tracking-wider text-red-400/80 font-bold block">Outstanding</span>
                <span className="text-base font-bold font-display text-red-400">{formatNaira(outstanding)}</span>
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-right">
                <span className="text-[10px] uppercase tracking-wider text-emerald-400/80 font-bold block">Balance</span>
                <span className="text-xs font-bold text-emerald-300">Settled</span>
              </div>
            )}

            {canEditDemographics && (
              <Link
                href={`/dashboard/book?patientId=${patient.patientId}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-turq-500 hover:bg-turq-400 text-ink-950 px-3.5 py-2 rounded-xl transition-all shadow-md shadow-turq-500/10 cursor-pointer"
              >
                <Calendar className="h-3.5 w-3.5" /> Book
              </Link>
            )}

            {outstanding > 0 && (isAdminUser || isReceptionistUser) && (
              <Link
                href={`/dashboard/admin/billing?q=${encodeURIComponent(person.lastName)}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-ink-950 px-3.5 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer"
              >
                <CreditCard className="h-3.5 w-3.5" /> Collect
              </Link>
            )}

            {isAdminUser && (
              <DeletePatientButton
                patientId={patient.patientId}
                patientName={patientFullName}
                variant="button"
                redirectAfterDelete={true}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Segmented Clinical Workspace Tabs: Instant Switching, Zero Cognitive Fatigue ── */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-ink-900 border border-sand-50/10">
        {(canEditChart || isAdminUser) && (
          <button
            type="button"
            onClick={() => setActiveTab("chart")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "chart"
                ? "bg-turq-500 text-ink-950 shadow-md shadow-turq-500/10"
                : "text-sand-50/70 hover:text-sand-50 hover:bg-sand-50/5"
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Odontogram &amp; Treatment Plan</span>
            {(patient.toothFindings.length > 0 || allPlanItems.length > 0) && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${activeTab === "chart" ? "bg-ink-950/20 text-ink-950 font-bold" : "bg-turq-500/15 text-turq-400"}`}>
                {patient.toothFindings.length} charted · {allPlanItems.length} planned
              </span>
            )}
          </button>
        )}

        {(canEditClinical || isAdminUser) && (
          <button
            type="button"
            onClick={() => setActiveTab("clinical")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "clinical"
                ? "bg-turq-500 text-ink-950 shadow-md shadow-turq-500/10"
                : "text-sand-50/70 hover:text-sand-50 hover:bg-sand-50/5"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Medical History &amp; Records</span>
            {patient.treatmentPlans.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activeTab === "clinical" ? "bg-ink-950/20 text-ink-950" : "bg-turq-500/15 text-turq-400"}`}>
                {patient.treatmentPlans.length}
              </span>
            )}
          </button>
        )}

        {(canEditChart || isAdminUser) && (
          <button
            type="button"
            onClick={() => setActiveTab("images")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "images"
                ? "bg-turq-500 text-ink-950 shadow-md shadow-turq-500/10"
                : "text-sand-50/70 hover:text-sand-50 hover:bg-sand-50/5"
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Photos &amp; Radiographs</span>
            {patient.images.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activeTab === "images" ? "bg-ink-950/20 text-ink-950" : "bg-turq-500/15 text-turq-400"}`}>
                {patient.images.length}
              </span>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab("visits")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "visits"
              ? "bg-turq-500 text-ink-950 shadow-md shadow-turq-500/10"
              : "text-sand-50/70 hover:text-sand-50 hover:bg-sand-50/5"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Visit History</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activeTab === "visits" ? "bg-ink-950/20 text-ink-950" : "bg-sand-50/10 text-sand-50/70"}`}>
            {patient.appointments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("demographics")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "demographics"
              ? "bg-turq-500 text-ink-950 shadow-md shadow-turq-500/10"
              : "text-sand-50/70 hover:text-sand-50 hover:bg-sand-50/5"
          }`}
        >
          <User className="h-3.5 w-3.5" />
          <span>Demographics &amp; Contact</span>
        </button>
      </div>

      {/* ── Active Workspace Content ── */}
      <div className="transition-all duration-200">
        {/* Tab 1: Odontogram & Treatment Planning (Unified Real Dental Clinic Flow) */}
        {activeTab === "chart" && (canEditChart || isAdminUser) && (
          <Odontogram
            patientId={patient.patientId}
            findings={patient.toothFindings.map((f: any) => ({
              toothNumber: f.toothNumber,
              condition: f.condition,
              surfaces: f.surfaces,
              notes: f.notes,
            }))}
            canEdit={canEditChart}
            clinicServices={clinicServices}
            treatmentPlanItems={allPlanItems}
          />
        )}

        {/* Tab 2: Clinical Care Panel */}
        {activeTab === "clinical" && (canEditClinical || isAdminUser) && (
          <ClinicalCarePanel
            patientId={patient.patientId}
            canEdit={canEditClinical}
            isDentist={canEditChart}
            data={{
              allergies: patient.allergies.map((a: any) => ({
                allergyId: a.allergyId,
                name: a.name,
                severity: a.severity,
                notes: a.notes,
              })),
              medicalNotes: patient.medicalNotes.map((n: any) => ({
                noteId: n.noteId,
                body: n.body,
                recordedAt: n.recordedAt.toISOString(),
              })),
              treatmentPlans: patient.treatmentPlans.map((p: any) => ({
                planId: p.planId,
                title: p.title,
                notes: p.notes,
                items: p.items.map((i: any) => ({
                  itemId: i.itemId,
                  description: i.description,
                  toothNumber: i.toothNumber,
                  surfaces: i.surfaces,
                  estimatedCharge: i.estimatedCharge,
                  status: i.status,
                })),
              })),
              perioReadings: patient.perioReadings.map((r: any) => ({
                readingId: r.readingId,
                toothNumber: r.toothNumber,
                pocketMm: r.pocketMm,
                bleeding: r.bleeding,
                mobility: r.mobility,
                notes: r.notes,
              })),
              consents: patient.consents.map((c: any) => ({
                consentId: c.consentId,
                title: c.title,
                summary: c.summary,
                status: c.status,
                signedByName: c.signedByName,
                signedAt: c.signedAt?.toISOString() ?? null,
              })),
              recalls: patient.recalls.map((r: any) => ({
                recallId: r.recallId,
                reason: r.reason,
                dueDate: r.dueDate.toISOString(),
                status: r.status,
                notes: r.notes,
              })),
              insurancePolicies: patient.insurancePolicies.map((p: any) => ({
                insuranceId: p.insuranceId,
                provider: p.provider,
                policyNumber: p.policyNumber,
                memberId: p.memberId,
                groupNumber: p.groupNumber,
                notes: p.notes,
                active: p.active,
              })),
              labCases: patient.labCases.map((l: any) => ({
                labCaseId: l.labCaseId,
                labName: l.labName,
                itemDescription: l.itemDescription,
                toothNumber: l.toothNumber,
                dueDate: l.dueDate?.toISOString() ?? null,
                status: l.status,
                notes: l.notes,
              })),
              referrals: patient.referrals.map((r: any) => ({
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
        )}

        {/* Tab 3: Photos & Radiographs */}
        {activeTab === "images" && (canEditChart || isAdminUser) && (
          <PatientImages
            patientId={patient.patientId}
            canEdit={canEditChart}
            cloudinaryReady={cloudinaryReady}
            images={patient.images.map((img: any) => ({
              imageId: img.imageId,
              kind: img.kind,
              url: img.url,
              caption: img.caption,
              createdAt: img.createdAt.toISOString(),
            }))}
          />
        )}

        {/* Tab 4: Visit History & Schedule */}
        {activeTab === "visits" && (
          <div className="bg-ink-900 border border-sand-50/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 sm:p-5 border-b border-sand-50/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-turq-400" />
                <h2 className="text-sm font-semibold text-sand-50">Appointment &amp; Visit History</h2>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-sand-50/5 border border-sand-50/10 text-sand-50/60 font-mono">
                {patient.appointments.length} visits
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-sand-50/[0.02] border-b border-sand-50/10 uppercase tracking-wider text-sand-50/40 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Date &amp; Time</th>
                    <th className="py-3 px-4">Doctor &amp; Room</th>
                    <th className="py-3 px-4">Procedures</th>
                    <th className="py-3 px-4">Charge</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-50/5">
                  {patient.appointments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-sand-50/30">
                        No appointment visits recorded yet for this patient.
                      </td>
                    </tr>
                  ) : (
                    patient.appointments.map((app: any) => {
                      const labels = app.treatments
                        .map((t: any) => (t.toothNumber != null ? `#${t.toothNumber} ${t.action}` : t.action))
                        .join(", ");
                      const total = app.treatments.reduce((sum: number, t: any) => sum + t.charge, 0);
                      const allPaid = app.treatments.length > 0 && app.treatments.every((t: any) => t.paid);
                      const anyUnpaid = app.treatments.some((t: any) => !t.paid && t.charge > 0);
                      const canReassign = app.status !== "cancelled" && app.status !== "completed";

                      return (
                        <tr key={app.appointmentId} className="hover:bg-sand-50/[0.02] transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-sand-50 whitespace-nowrap">
                            {app.day}/{app.month}/{app.year} · {app.hour}:00
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-medium text-sand-50/90">Dr. {app.dentist.person.lastName}</span>
                            <span className="text-sand-50/40 block mt-0.5">Room {app.room}</span>
                          </td>
                          <td className="py-3.5 px-4 max-w-xs truncate text-sand-50/70" title={labels || "No procedures"}>
                            {labels || <span className="text-sand-50/20">—</span>}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-sand-50">
                            {app.treatments.length > 0 ? formatNaira(total) : "—"}
                          </td>
                          <td className="py-3.5 px-4">
                            {app.status === "cancelled" ? (
                              <span className="text-red-400 font-semibold px-2 py-0.5 rounded bg-red-950/40 border border-red-500/20">
                                Cancelled
                              </span>
                            ) : app.treatments.length === 0 ? (
                              <span className="text-sand-50/40 capitalize">{app.status.replace("_", " ")}</span>
                            ) : allPaid ? (
                              <span className="text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/20">
                                Paid
                              </span>
                            ) : anyUnpaid ? (
                              <span className="text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/20">
                                Unpaid
                              </span>
                            ) : null}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {canReassign ? (
                              <ReassignAppointmentModal
                                appointmentId={app.appointmentId}
                                currentDentistId={app.dId}
                                currentDentistName={`Dr. ${app.dentist.person.firstName} ${app.dentist.person.lastName}`}
                                currentRoom={app.room}
                                currentDate={`${app.year}-${String(app.month).padStart(2, "0")}-${String(app.day).padStart(2, "0")}`}
                                currentHour={app.hour}
                                patientName={patientFullName}
                                dentists={dentistOptions}
                                openHour={openHour}
                                closeHour={closeHour}
                                buttonLabel="Reassign"
                                compact={true}
                              />
                            ) : (
                              <span className="text-sand-50/20">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Demographics & Contact Details */}
        {activeTab === "demographics" && (
          <div className="max-w-3xl">
            <PatientDemographicsEditor
              patientId={patientId}
              canEdit={canEditDemographics}
              canViewClinical={canEditChart}
              data={{
                firstName: person.firstName,
                lastName: person.lastName,
                email: person.email,
                phone: person.contacts[0]?.contactNumber ?? "",
                contacts: person.contacts.map((c: any) => c.contactNumber),
                street: person.addresses[0]?.street ?? "",
                city: person.addresses[0]?.city ?? "",
                occupation: person.occupation ?? "",
                referralSource: person.referralSource ?? "",
                emergencyContactName: person.emergencyContactName ?? "",
                emergencyContactPhone: person.emergencyContactPhone ?? "",
                diseases: canEditChart ? person.diseases.map((d: any) => d.chronicDisease) : [],
                currentMedications: canEditChart ? patient.currentMedications.map((m: any) => ({
                  medicationId: m.medicationId,
                  name: m.name,
                  dose: m.dose,
                  notes: m.notes,
                })) : [],
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

import React from "react";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isDentist, isAdmin, isReceptionist } from "@/lib/auth";
import { getSiteContent } from "@/lib/site";

export default async function PrintPrescriptionPage({
  params,
}: {
  params: Promise<{ treatmentId: string }>;
}) {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isDentist(dbUser) && !isAdmin(dbUser) && !isReceptionist(dbUser)) redirect("/dashboard");

  const { treatmentId: rawId } = await params;
  const treatmentId = parseInt(rawId, 10);
  if (Number.isNaN(treatmentId)) notFound();

  const [treatment, site] = await Promise.all([
    prisma.treatment.findUnique({
      where: { treatmentId },
      include: {
        medicines: true,
        dentist: { include: { person: true } },
        appointment: {
          include: {
            patient: { include: { person: { include: { contacts: true } } } },
          },
        },
      },
    }),
    getSiteContent(),
  ]);

  if (!treatment) notFound();
  if (treatment.medicines.length === 0) {
    return (
      <div className="p-8 text-sand-50/50">
        No medicines prescribed in this treatment.{" "}
        <a href="javascript:history.back()" className="text-turq-400 underline">Go back</a>
      </div>
    );
  }

  const patient = treatment.appointment.patient.person;
  const dentist = treatment.dentist.person;
  const app = treatment.appointment;
  const dateStr = `${app.day}/${app.month}/${app.year}`;
  const phone = treatment.appointment.patient.person.contacts[0]?.contactNumber ?? "";

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans print:p-0">
      {/* Print action bar — hidden when printing */}
      <div className="print:hidden fixed top-0 inset-x-0 bg-ink-950 border-b border-sand-50/10 px-6 py-3 flex items-center justify-between z-50">
        <span className="text-sm text-sand-50/60">Prescription — {patient.firstName} {patient.lastName}</span>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="bg-turq-600 hover:bg-turq-500 text-ink-950 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Print / Save PDF
          </button>
          <a href="javascript:history.back()" className="text-xs text-sand-50/40 hover:text-sand-50 px-3 py-2 transition-colors">
            ← Back
          </a>
        </div>
      </div>

      {/* Prescription document */}
      <div className="max-w-[680px] mx-auto px-8 py-12 print:py-6 mt-14 print:mt-0">
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-gray-900 pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{site.clinicName}</h1>
            <p className="text-sm text-gray-600 mt-0.5">{site.address}</p>
            <p className="text-sm text-gray-600">Tel: {site.phone}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">PRESCRIPTION</p>
            <p className="text-sm text-gray-600 mt-1">Date: {dateStr}</p>
            <p className="text-sm text-gray-600">Ref: RX-{treatmentId}</p>
          </div>
        </div>

        {/* Patient */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Patient</p>
            <p className="font-semibold text-gray-900">{patient.firstName} {patient.lastName}</p>
            {phone && <p className="text-sm text-gray-600">{phone}</p>}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Prescribing Dentist</p>
            <p className="font-semibold text-gray-900">Dr. {dentist.firstName} {dentist.lastName}</p>
            <p className="text-sm text-gray-600">{site.clinicName}</p>
          </div>
        </div>

        {/* Diagnosis / treatment */}
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Complaint / Diagnosis</p>
          <p className="text-sm text-gray-700">{treatment.complaint}</p>
          <p className="text-sm text-gray-600 mt-0.5">{treatment.action}</p>
        </div>

        {/* Rx symbol */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl font-serif text-gray-900">℞</span>
          <div className="h-px flex-1 bg-gray-300" />
        </div>

        {/* Medicines */}
        <div className="space-y-5 mb-8">
          {treatment.medicines.map((m, i) => (
            <div key={m.medicineId} className="border-l-2 border-gray-900 pl-4">
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-gray-500 font-mono">{i + 1}.</span>
                <span className="font-semibold text-gray-900 text-base">{m.medicineName}</span>
              </div>
              <div className="text-sm text-gray-700 mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5">
                {m.dose       && <span>Dose: {m.dose}</span>}
                {m.frequency  && <span>Frequency: {m.frequency}</span>}
                {m.duration   && <span>Duration: {m.duration}</span>}
              </div>
              {m.instructions && (
                <p className="text-sm text-gray-500 mt-0.5 italic">{m.instructions}</p>
              )}
            </div>
          ))}
        </div>

        {/* SOAP notes if present */}
        {(treatment.soapSubjective || treatment.soapObjective || treatment.soapAssessment || treatment.soapPlan) && (
          <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-2">Clinical Notes</p>
            {treatment.soapSubjective && <p><span className="font-semibold">S:</span> {treatment.soapSubjective}</p>}
            {treatment.soapObjective  && <p><span className="font-semibold">O:</span> {treatment.soapObjective}</p>}
            {treatment.soapAssessment && <p><span className="font-semibold">A:</span> {treatment.soapAssessment}</p>}
            {treatment.soapPlan       && <p><span className="font-semibold">P:</span> {treatment.soapPlan}</p>}
          </div>
        )}

        {/* Signature line */}
        <div className="mt-12 grid grid-cols-2 gap-8">
          <div className="border-t border-gray-400 pt-2">
            <p className="text-xs text-gray-500">Dentist signature</p>
            <p className="text-sm font-semibold text-gray-700 mt-1">Dr. {dentist.firstName} {dentist.lastName}</p>
          </div>
          <div className="border-t border-gray-400 pt-2">
            <p className="text-xs text-gray-500">Date</p>
            <p className="text-sm text-gray-700 mt-1">{dateStr}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 border-t border-gray-200 pt-4 text-center">
          <p className="text-xs text-gray-400">{site.clinicName} · {site.address} · {site.phone}</p>
        </div>
      </div>
    </div>
  );
}

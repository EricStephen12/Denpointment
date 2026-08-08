import React from "react";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isAdmin, isDentist, isReceptionist } from "@/lib/auth";
import { formatNaira } from "@/lib/currency";
import { conditionMeta } from "@/lib/odontogram";
import { isCloudinaryConfigured } from "@/lib/cloudinary";
import Odontogram from "@/components/dashboards/Odontogram";
import PatientImages from "@/components/dashboards/PatientImages";
import { User, ArrowLeft, Calendar } from "lucide-react";

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
      toothFindings: {
        where: { active: true },
        orderBy: { toothNumber: "asc" },
      },
      images: {
        orderBy: { createdAt: "desc" },
        take: 40,
      },
      appointments: {
        include: {
          dentist: { include: { person: true } },
          treatments: { include: { medicines: true } },
        },
        orderBy: [{ year: "desc" }, { month: "desc" }, { day: "desc" }, { hour: "desc" }],
        take: 20,
      },
    },
  });

  if (!patient) notFound();

  const person = patient.person;
  const birthLabel = person.birthDate
    ? person.birthDate.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : "—";
  const canEditChart = isDentist(dbUser);

  return (
    <div>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs text-sand-50/40 hover:text-turq-400 mb-6 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="dash-icon-badge">
          <User className="h-5 w-5 text-turq-400" />
        </div>
        <div>
          <h1 className="dash-title font-display">
            {person.firstName} {person.lastName}
          </h1>
          <p className="dash-body mt-0.5">{person.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <section className="dash-surface p-5 space-y-3">
          <h2 className="text-sm font-semibold text-sand-50">Details</h2>
          <Row label="Gender" value={person.gender} />
          <Row label="Date of birth" value={birthLabel} />
          <Row
            label="Phone"
            value={person.contacts.map((c) => c.contactNumber).join(", ") || "—"}
          />
          <Row
            label="Address"
            value={
              person.addresses.length > 0
                ? person.addresses
                    .map((a) => `${a.street}, ${a.city} ${a.zipCode}`)
                    .join("; ")
                : "—"
            }
          />
          <Row
            label="Chronic conditions"
            value={person.diseases.map((d) => d.chronicDisease).join(", ") || "None recorded"}
          />
          {patient.toothFindings.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-sand-50/40 mb-1">Active findings</p>
              <ul className="space-y-1 text-sm text-sand-50/70">
                {patient.toothFindings.map((f) => (
                  <li key={f.findingId}>
                    #{f.toothNumber} · {conditionMeta(f.condition).label}
                    {f.notes ? ` — ${f.notes}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(isReceptionist(dbUser) || isAdmin(dbUser)) && (
            <Link
              href={`/dashboard/book?patientId=${patient.patientId}`}
              className="inline-flex items-center gap-1.5 mt-2 text-sm text-turq-400 hover:text-turq-300 font-medium"
            >
              <Calendar className="h-4 w-4" /> Book appointment
            </Link>
          )}
        </section>

        <section className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-sand-50 mb-4">Recent appointments</h2>
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Dentist</th>
                  <th>Treatment</th>
                  <th>Charge</th>
                </tr>
              </thead>
              <tbody>
                {patient.appointments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="td-empty">No appointments yet.</td>
                  </tr>
                ) : (
                  patient.appointments.map((app) => {
                    const labels = app.treatments
                      .map((t) =>
                        t.toothNumber != null ? `#${t.toothNumber} ${t.action}` : t.action,
                      )
                      .join("; ");
                    const total = app.treatments.reduce((sum, t) => sum + t.charge, 0);
                    return (
                      <tr key={app.appointmentId}>
                        <td>
                          {app.day}/{app.month}/{app.year} · {app.hour}:00
                        </td>
                        <td>
                          Dr. {app.dentist.person.firstName} {app.dentist.person.lastName}
                        </td>
                        <td>{labels || "—"}</td>
                        <td>{app.treatments.length > 0 ? formatNaira(total) : "—"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div id="dental-chart" className="scroll-mt-24 mb-8">
        <Odontogram
          patientId={patient.patientId}
          findings={patient.toothFindings.map((f) => ({
            toothNumber: f.toothNumber,
            condition: f.condition,
            notes: f.notes,
          }))}
          canEdit={canEditChart}
        />
      </div>

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
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-sand-50/40 mb-0.5">{label}</p>
      <p className="text-sm text-sand-50/80 capitalize">{value}</p>
    </div>
  );
}

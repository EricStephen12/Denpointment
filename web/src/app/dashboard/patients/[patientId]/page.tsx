import React from "react";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isAdmin, isDentist, isReceptionist } from "@/lib/auth";
import { formatNaira } from "@/lib/currency";
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
                    const treatment = app.treatments[0];
                    return (
                      <tr key={app.appointmentId}>
                        <td>
                          {app.day}/{app.month}/{app.year} · {app.hour}:00
                        </td>
                        <td>
                          Dr. {app.dentist.person.firstName} {app.dentist.person.lastName}
                        </td>
                        <td>{treatment?.action || "—"}</td>
                        <td>{treatment ? formatNaira(treatment.charge) : "—"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
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

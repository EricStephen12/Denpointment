import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isPatient } from "@/lib/auth";
import { Pill, Printer } from "lucide-react";

export default async function MyPrescriptionsPage() {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isPatient(dbUser)) redirect("/dashboard");

  const patientId = dbUser.patients[0].patientId;

  const appointments = await prisma.appointment.findMany({
    where: { pId: patientId },
    include: {
      dentist: { include: { person: true } },
      treatments: {
        where: { medicines: { some: {} } },
        include: { medicines: true },
      },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }, { day: "desc" }],
  });

  const visits = appointments.filter((a) => a.treatments.length > 0);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <p className="text-xs font-medium text-turq-400 uppercase tracking-widest mb-3">My Records</p>
        <h1 className="text-3xl font-display text-sand-50">Prescriptions</h1>
        <p className="mt-2 text-sm text-sand-50/50">Medicines prescribed across all your visits.</p>
      </div>

      {visits.length === 0 ? (
        <div className="dash-surface p-10 text-center">
          <Pill className="h-10 w-10 text-sand-50/20 mx-auto mb-3" />
          <p className="text-sand-50/40 text-sm">No prescriptions on file yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {visits.map((appt) => (
            <div key={appt.appointmentId} className="dash-surface overflow-hidden">
              <div className="px-5 py-4 border-b border-sand-50/8 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-sand-50 text-sm">
                    {appt.day}/{appt.month}/{appt.year}
                  </p>
                  <p className="text-xs text-sand-50/40 mt-0.5">
                    Dr. {appt.dentist.person.firstName} {appt.dentist.person.lastName}
                  </p>
                </div>
                {appt.treatments.map((t) => (
                  <Link
                    key={t.treatmentId}
                    href={`/dashboard/print/prescription/${t.treatmentId}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-xs border border-sand-50/15 hover:border-turq-400/40 text-sand-50/50 hover:text-turq-400 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Printer className="h-3.5 w-3.5" /> Print Rx
                  </Link>
                ))}
              </div>

              {appt.treatments.map((t) => (
                <div key={t.treatmentId} className="px-5 py-4">
                  <p className="text-xs text-sand-50/40 uppercase tracking-wider mb-2">{t.action}</p>
                  <ul className="space-y-2">
                    {t.medicines.map((m) => (
                      <li key={m.medicineId} className="flex items-start gap-3">
                        <Pill className="h-3.5 w-3.5 text-turq-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-sand-50">{m.medicineName}</p>
                          <p className="text-xs text-sand-50/45 mt-0.5">
                            {[m.dose, m.frequency, m.duration].filter(Boolean).join(" · ")}
                          </p>
                          {m.instructions && (
                            <p className="text-xs text-sand-50/30 mt-0.5 italic">{m.instructions}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

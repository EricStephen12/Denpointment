import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isDentist } from "@/lib/auth";
import { History } from "lucide-react";
import { formatNaira } from "@/lib/currency";
import { formatAppointmentDate, isAppointmentUpcoming } from "@/lib/clinic-date";
import Link from "next/link";
import TreatmentEditor from "@/components/dashboards/TreatmentEditor";

export default async function PastTreatmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isDentist(dbUser)) redirect("/dashboard");

  const dentistId = dbUser.dentists[0].dentistId;
  const now = new Date();
  const { date } = await searchParams;

  const appointments = await prisma.appointment.findMany({
    where: { dId: dentistId },
    include: {
      patient: { include: { person: true } },
      treatments: { include: { medicines: true } },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }, { day: "desc" }, { hour: "desc" }],
  });

  let past = appointments.filter((app) => !isAppointmentUpcoming(app, now));

  if (date) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const day = parseInt(match[3], 10);
      past = past.filter(
        (app) => app.year === year && app.month === month && app.day === day,
      );
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-orange-500/20">
          <History className="h-5 w-5 text-orange-400" />
        </div>
        <div>
          <h1 className="dash-title font-display">Past Treatments</h1>
          <p className="dash-body mt-0.5">Search and review historical treatment records.</p>
        </div>
      </div>

      <form className="flex items-end gap-3 mb-6" method="get">
        <div>
          <label htmlFor="date" className="block text-xs font-medium text-sand-50/50 mb-1">
            Filter by date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            defaultValue={date || ""}
            className="dash-input w-auto"
          />
        </div>
        <button
          type="submit"
          className="bg-turq-600 text-ink-950 py-2 px-4 rounded-lg font-semibold text-sm hover:bg-turq-500 transition-colors"
        >
          Search
        </button>
        {date && (
          <a
            href="/dashboard/treatments/past"
            className="text-sm text-sand-50/40 hover:text-sand-50/70 pb-2 transition-colors"
          >
            Clear
          </a>
        )}
      </form>

      <div className="space-y-4">
        {past.length === 0 ? (
          <div className="text-center text-sand-50/30 py-12 border border-dashed border-sand-50/10 rounded-xl">
            No past appointments found.
          </div>
        ) : (
          past.map((app) => (
            <div key={app.appointmentId} className="dash-surface p-4 space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link
                  href={`/dashboard/patients/${app.patient.patientId}`}
                  className="text-sm font-medium text-sand-50 hover:text-turq-400 transition-colors"
                >
                  {app.patient.person.firstName} {app.patient.person.lastName}
                </Link>
                <span className="text-xs text-sand-50/40">
                  {formatAppointmentDate(app)} · {app.hour}:00
                </span>
              </div>
              {app.treatments.length === 0 ? (
                <p className="text-sm italic text-sand-50/30">No treatment recorded</p>
              ) : (
                <ul className="space-y-3">
                  {app.treatments.map((t) => (
                    <li key={t.treatmentId} className="border-t border-sand-50/8 pt-3 first:border-0 first:pt-0">
                      <TreatmentEditor
                        treatment={{
                          treatmentId: t.treatmentId,
                          action: t.action,
                          complaint: t.complaint,
                          description: t.description,
                          toothNumber: t.toothNumber,
                          charge: t.charge,
                          paid: t.paid,
                        }}
                      />
                      <p className="text-xs text-sand-50/40 mt-1">
                        Complaint: {t.complaint}
                        {t.medicines.length > 0
                          ? ` · Rx: ${t.medicines.map((m) => m.medicineName).join(", ")}`
                          : ""}
                        {!t.paid ? ` · ${formatNaira(t.charge)} unpaid` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

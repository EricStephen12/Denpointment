import React from 'react';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isDentist } from "@/lib/auth";
import { History } from 'lucide-react';
import { formatNaira } from "@/lib/currency";
import { formatAppointmentDate, isAppointmentUpcoming } from "@/lib/clinic-date";
import Link from "next/link";

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
    orderBy: [{ year: 'desc' }, { month: 'desc' }, { day: 'desc' }, { hour: 'desc' }],
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
          <label htmlFor="date" className="block text-xs font-medium text-sand-50/50 mb-1">Filter by date</label>
          <input type="date" id="date" name="date" defaultValue={date || ""} className="dash-input w-auto" />
        </div>
        <button type="submit" className="bg-turq-600 text-ink-950 py-2 px-4 rounded-lg font-semibold text-sm hover:bg-turq-500 transition-colors">
          Search
        </button>
        {date && (
          <a href="/dashboard/treatments/past" className="text-sm text-sand-50/40 hover:text-sand-50/70 pb-2 transition-colors">Clear</a>
        )}
      </form>

      <div className="dash-table-wrap">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Date</th>
              <th>Charge</th>
              <th>Action</th>
              <th>Complaint</th>
              <th>Medicines</th>
            </tr>
          </thead>
          <tbody>
            {past.length > 0 ? past.map((app) => {
              const treatment = app.treatments[0];
              return (
                <tr key={app.appointmentId}>
                  <td className="td-primary">
                    <Link href={`/dashboard/patients/${app.patient.patientId}`} className="hover:text-turq-400 transition-colors">
                      {app.patient.person.firstName} {app.patient.person.lastName}
                    </Link>
                  </td>
                  <td>{app.hour}:00 {app.day}/{app.month}/{app.year}</td>
                  {!treatment ? (
                    <td colSpan={4} className="italic text-sand-50/30">No treatment recorded</td>
                  ) : (
                    <>
                      <td>{formatNaira(treatment.charge)}</td>
                      <td>{treatment.action}</td>
                      <td>{treatment.complaint}</td>
                      <td>
                        {treatment.medicines.length > 0 ? treatment.medicines.map((m) => m.medicineName).join(", ") : "—"}
                      </td>
                    </>
                  )}
                </tr>
              );
            }) : (
              <tr><td colSpan={6} className="td-empty">No past appointments found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

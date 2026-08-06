import React from 'react';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isDentist } from "@/lib/auth";
import { BarChart2 } from 'lucide-react';
import { formatNaira } from "@/lib/currency";

export default async function DentistStatisticsPage() {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isDentist(dbUser)) redirect("/dashboard");

  const dentists = await prisma.dentist.findMany({
    include: {
      person: true,
      appointments: true,
      treatments: true,
    },
  });

  const rows = dentists
    .map((d) => {
      const revenue = d.treatments.reduce((sum, t) => sum + t.charge, 0);
      const uniquePatients = new Set(d.appointments.map((a) => a.pId)).size;
      return {
        dentistId: d.dentistId,
        name: `Dr. ${d.person.firstName} ${d.person.lastName}`,
        room: d.roomNumber,
        totalAppointments: d.appointments.length,
        uniquePatients,
        totalTreatments: d.treatments.length,
        revenue,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg bg-purple-500/20">
          <BarChart2 className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h1 className="dash-title font-display">Dentist Statistics</h1>
          <p className="dash-body mt-0.5">Clinic-wide performance by dentist.</p>
        </div>
      </div>

      <div className="dash-table-wrap">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Dentist</th>
              <th>Room</th>
              <th>Appointments</th>
              <th>Unique Patients</th>
              <th>Treatments</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? rows.map((r) => (
              <tr key={r.dentistId}>
                <td className="td-primary">{r.name}</td>
                <td>{r.room}</td>
                <td>{r.totalAppointments}</td>
                <td>{r.uniquePatients}</td>
                <td>{r.totalTreatments}</td>
                <td>{formatNaira(r.revenue)}</td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="td-empty">No dentists found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

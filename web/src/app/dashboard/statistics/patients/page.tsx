import React from 'react';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isDentist } from "@/lib/auth";
import { BarChart2 } from 'lucide-react';

export default async function PatientStatisticsPage() {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isDentist(dbUser)) redirect("/dashboard");

  const dentistId = dbUser.dentists[0].dentistId;

  const appointments = await prisma.appointment.findMany({
    where: { dId: dentistId },
    include: { treatments: true },
  });

  const uniquePatients = new Set(appointments.map((a) => a.pId)).size;
  const totalAppointments = appointments.length;
  const treatments = appointments.flatMap((a) => a.treatments);
  const totalRevenue = treatments.reduce((sum, t) => sum + t.charge, 0);
  const avgCharge = treatments.length > 0 ? Math.round(totalRevenue / treatments.length) : 0;

  const complaintCounts = new Map<string, number>();
  for (const t of treatments) {
    complaintCounts.set(t.complaint, (complaintCounts.get(t.complaint) || 0) + 1);
  }
  const topComplaints = [...complaintCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const stats = [
    { label: "Unique Patients", value: uniquePatients },
    { label: "Total Appointments", value: totalAppointments },
    { label: "Treatments Recorded", value: treatments.length },
    { label: "Total Revenue", value: `$${totalRevenue}` },
    { label: "Average Charge", value: `$${avgCharge}` },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg bg-purple-500/20">
          <BarChart2 className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h1 className="dash-title font-display">Patient Statistics</h1>
          <p className="dash-body mt-0.5">A snapshot of your patient activity.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="dash-stat-card">
            <p className="text-2xl font-display text-sand-50">{s.value}</p>
            <p className="dash-label mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-sand-50/60 mb-3">Most Common Complaints</h2>
      <div className="dash-table-wrap">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Complaint</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {topComplaints.length > 0 ? topComplaints.map(([complaint, count]) => (
              <tr key={complaint}>
                <td className="td-primary">{complaint}</td>
                <td>{count}</td>
              </tr>
            )) : (
              <tr><td colSpan={2} className="td-empty">No treatment data yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

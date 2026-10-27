import React from 'react';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isDentist } from "@/lib/auth";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { BarChart2, DollarSign, Calendar, Users, Stethoscope, Award } from 'lucide-react';
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
        firstName: d.person.firstName,
        lastName: d.person.lastName,
        name: `Dr. ${d.person.firstName} ${d.person.lastName}`,
        room: d.roomNumber,
        totalAppointments: d.appointments.length,
        uniquePatients,
        totalTreatments: d.treatments.length,
        revenue,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const totalClinicRevenue = rows.reduce((acc, r) => acc + r.revenue, 0);
  const totalAppointments = rows.reduce((acc, r) => acc + r.totalAppointments, 0);
  const totalTreatments = rows.reduce((acc, r) => acc + r.totalTreatments, 0);

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <AdminPageHeader
        section="Analytics & Reports"
        title="Dentist Performance Analytics"
        subtitle="Clinic-wide provider production, patient retention, and appointment distribution"
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-ink-900 border border-sand-50/10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-sand-50/40 font-medium">Clinic Production</p>
            <p className="text-xl font-bold font-display text-turq-400 mt-1">{formatNaira(totalClinicRevenue)}</p>
          </div>
          <div className="p-3 rounded-xl bg-turq-500/10 text-turq-400">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-ink-900 border border-sand-50/10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-sand-50/40 font-medium">Total Appointments</p>
            <p className="text-2xl font-bold font-display text-sand-50 mt-1">{totalAppointments}</p>
          </div>
          <div className="p-3 rounded-xl bg-sand-50/5 text-sand-50/60">
            <Calendar className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-ink-900 border border-sand-50/10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-sand-50/40 font-medium">Procedures Carried Out</p>
            <p className="text-2xl font-bold font-display text-emerald-400 mt-1">{totalTreatments}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <BarChart2 className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-ink-900 border border-sand-50/10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-sand-50/40 font-medium">Active Doctors</p>
            <p className="text-2xl font-bold font-display text-sand-50 mt-1">{dentists.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-sand-50/5 text-sand-50/60">
            <Stethoscope className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Dentist Performance Table */}
      <div className="bg-ink-900 border border-sand-50/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-sand-50/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-turq-400" />
            <h2 className="text-sm font-semibold text-sand-50">Provider Leaderboard &amp; Production</h2>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-sand-50/5 border border-sand-50/10 text-sand-50/60">
            Sorted by Total Revenue
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-sand-50/[0.02] border-b border-sand-50/10 uppercase tracking-wider text-sand-50/40 text-xs font-semibold">
              <tr>
                <th className="py-3.5 px-5">Rank &amp; Doctor</th>
                <th className="py-3.5 px-5">Assigned Room</th>
                <th className="py-3.5 px-5">Appointments</th>
                <th className="py-3.5 px-5">Unique Patients</th>
                <th className="py-3.5 px-5">Procedures</th>
                <th className="py-3.5 px-5 text-right">Production (₦)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-50/5">
              {rows.length > 0 ? (
                rows.map((r, idx) => {
                  const initials = `${r.firstName[0] || ""}${r.lastName[0] || ""}`.toUpperCase();
                  const isTop = idx === 0;

                  return (
                    <tr key={r.dentistId} className="hover:bg-sand-50/[0.02] transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              idx === 0
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : idx === 1
                                ? "bg-slate-300/20 text-slate-300 border border-slate-300/30"
                                : idx === 2
                                ? "bg-amber-700/20 text-amber-600 border border-amber-700/30"
                                : "text-sand-50/30"
                            }`}
                          >
                            #{idx + 1}
                          </span>
                          <div className="w-8 h-8 rounded-xl bg-turq-500/10 border border-turq-500/20 text-turq-400 flex items-center justify-center text-xs font-bold shrink-0">
                            {initials}
                          </div>
                          <span className="font-semibold text-sand-50">{r.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-sand-50/5 border border-sand-50/10 text-sand-50/70">
                          Room {r.room}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-sand-50/80 font-medium">{r.totalAppointments}</td>
                      <td className="py-4 px-5 text-sand-50/80 font-medium">{r.uniquePatients}</td>
                      <td className="py-4 px-5 text-sand-50/80 font-medium">{r.totalTreatments}</td>
                      <td className="py-4 px-5 text-right font-mono font-bold text-sand-50">
                        {formatNaira(r.revenue)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-sand-50/30">
                    No doctor performance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

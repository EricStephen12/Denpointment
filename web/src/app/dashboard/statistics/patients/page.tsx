import React from 'react';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isDentist } from "@/lib/auth";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Users, Calendar, Activity, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { formatNaira } from "@/lib/currency";

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
  const topComplaints = [...complaintCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const maxComplaintCount = topComplaints[0]?.[1] || 1;

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <AdminPageHeader
        section="Analytics & Reports"
        title="Patient Activity & Treatment Analytics"
        subtitle="Snapshot of your patient demographics, volume, and most frequent dental complaints"
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-ink-900 border border-sand-50/10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-sand-50/40 font-medium">Unique Patients</p>
            <p className="text-2xl font-bold font-display text-turq-400 mt-1">{uniquePatients}</p>
          </div>
          <div className="p-3 rounded-xl bg-turq-500/10 text-turq-400">
            <Users className="h-5 w-5" />
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
            <p className="text-2xl font-bold font-display text-emerald-400 mt-1">{treatments.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Activity className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-ink-900 border border-sand-50/10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-sand-50/40 font-medium">Average Charge / Case</p>
            <p className="text-xl font-bold font-display text-sand-50 mt-1">{formatNaira(avgCharge)}</p>
          </div>
          <div className="p-3 rounded-xl bg-sand-50/5 text-sand-50/60">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Top Complaints Visual Breakdown */}
      <div className="bg-ink-900 border border-sand-50/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-sand-50/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-turq-400" />
            <h2 className="text-sm font-semibold text-sand-50">Frequent Patient Complaints &amp; Diagnoses</h2>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-sand-50/5 border border-sand-50/10 text-sand-50/60">
            Top {topComplaints.length} Conditions
          </span>
        </div>

        {topComplaints.length === 0 ? (
          <div className="text-center py-16 px-4 text-xs text-sand-50/40">
            No clinical complaints documented yet.
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {topComplaints.map(([complaint, count], idx) => {
              const percentage = Math.round((count / maxComplaintCount) * 100);

              return (
                <div key={complaint} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-sand-50 flex items-center gap-2">
                      <span className="text-sand-50/30 font-mono">#{idx + 1}</span>
                      <span>{complaint}</span>
                    </span>
                    <span className="font-mono text-sand-50/70 font-semibold">
                      {count} case{count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-sand-50/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-turq-500 to-turq-400 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isAdmin, isReceptionist } from "@/lib/auth";
import { markTreatmentPaid } from "@/app/actions/billing";
import { Receipt } from 'lucide-react';

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isAdmin(dbUser) && !isReceptionist(dbUser)) redirect("/dashboard");

  const { filter } = await searchParams;
  const showUnpaidOnly = filter !== "all";

  const treatments = await prisma.treatment.findMany({
    where: showUnpaidOnly ? { paid: false } : undefined,
    include: {
      appointment: { include: { patient: { include: { person: true } } } },
      dentist: { include: { person: true } },
    },
    orderBy: { treatmentId: 'desc' },
  });

  const allTreatments = await prisma.treatment.findMany();
  const totalRevenue = allTreatments.reduce((sum, t) => sum + t.charge, 0);
  const collected = allTreatments.filter((t) => t.paid).reduce((sum, t) => sum + t.charge, 0);
  const outstanding = totalRevenue - collected;
  const unpaidCount = allTreatments.filter((t) => !t.paid).length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="dash-icon-badge">
          <Receipt className="h-5 w-5 text-turq-400" />
        </div>
        <div>
          <h1 className="dash-title font-display">Billing &amp; Revenue</h1>
          <p className="dash-body mt-0.5">Track payments across all treatments.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="dash-stat-card">
          <p className="text-2xl font-display text-sand-50">${totalRevenue}</p>
          <p className="dash-label mt-1">Total Billed</p>
        </div>
        <div className="dash-stat-card">
          <p className="text-2xl font-display text-turq-400">${collected}</p>
          <p className="dash-label mt-1">Collected</p>
        </div>
        <div className="dash-stat-card">
          <p className="text-2xl font-display text-red-400">${outstanding}</p>
          <p className="dash-label mt-1">Outstanding</p>
        </div>
        <div className="dash-stat-card">
          <p className="text-2xl font-display text-sand-50">{unpaidCount}</p>
          <p className="dash-label mt-1">Unpaid Treatments</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <a href="/dashboard/admin/billing" className={showUnpaidOnly ? 'dash-pill-active' : 'dash-pill-inactive'}>
          Unpaid Only
        </a>
        <a href="/dashboard/admin/billing?filter=all" className={!showUnpaidOnly ? 'dash-pill-active' : 'dash-pill-inactive'}>
          All Treatments
        </a>
      </div>

      <div className="dash-table-wrap">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Dentist</th>
              <th>Date</th>
              <th>Charge</th>
              <th>Status</th>
              <th className="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {treatments.length > 0 ? treatments.map((t) => (
              <tr key={t.treatmentId}>
                <td className="td-primary">
                  {t.appointment.patient.person.firstName} {t.appointment.patient.person.lastName}
                </td>
                <td>Dr. {t.dentist.person.lastName}</td>
                <td>{t.appointment.day}/{t.appointment.month}/{t.appointment.year}</td>
                <td>${t.charge}</td>
                <td>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${t.paid ? 'bg-turq-600/20 text-turq-300' : 'bg-amber-900/40 text-amber-400'}`}>
                    {t.paid ? 'Paid' : 'Unpaid'}
                  </span>
                </td>
                <td className="text-right">
                  <form action={markTreatmentPaid}>
                    <input type="hidden" name="treatmentId" value={t.treatmentId} />
                    <input type="hidden" name="paid" value={String(t.paid)} />
                    <button type="submit" className="text-xs text-turq-400 hover:text-turq-300 font-medium">
                      Mark as {t.paid ? 'Unpaid' : 'Paid'}
                    </button>
                  </form>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="td-empty">No treatments found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isAdmin, isReceptionist } from "@/lib/auth";
import { formatNaira } from "@/lib/currency";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export default async function OutstandingPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isAdmin(dbUser) && !isReceptionist(dbUser)) redirect("/dashboard");

  const { sort } = await searchParams;

  // Aggregate per patient: total charged minus all payments/discounts
  const patients = await prisma.patient.findMany({
    include: {
      person: { include: { contacts: true } },
      appointments: {
        include: {
          treatments: true,
          payments: true,
        },
      },
    },
  });

  type PatientBalance = {
    patientId: number;
    name: string;
    phone: string;
    email: string;
    totalCharge: number;
    totalPaid: number;
    totalDisc: number;
    outstanding: number;
    unpaidVisits: number;
  };

  const balances: PatientBalance[] = patients
    .map((p) => {
      let totalCharge = 0, totalPaid = 0, totalDisc = 0, unpaidVisits = 0;
      for (const appt of p.appointments) {
        const charge = appt.treatments.reduce((s, t) => s + t.charge, 0);
        const paid   = appt.payments.filter((px) => px.type === "payment").reduce((s, px) => s + px.amount, 0);
        const disc   = appt.payments.filter((px) => px.type === "discount" || px.type === "waiver").reduce((s, px) => s + px.amount, 0);
        totalCharge += charge;
        totalPaid   += paid;
        totalDisc   += disc;
        if (charge - paid - disc > 0) unpaidVisits++;
      }
      return {
        patientId: p.patientId,
        name: `${p.person.firstName} ${p.person.lastName}`,
        phone: p.person.contacts[0]?.contactNumber ?? "—",
        email: p.person.email,
        totalCharge,
        totalPaid,
        totalDisc,
        outstanding: Math.max(totalCharge - totalPaid - totalDisc, 0),
        unpaidVisits,
      };
    })
    .filter((b) => b.outstanding > 0);

  // Sort
  if (sort === "name") {
    balances.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    balances.sort((a, b) => b.outstanding - a.outstanding); // default: highest balance first
  }

  const grandTotal = balances.reduce((s, b) => s + b.outstanding, 0);

  return (
    <div>
      <AdminPageHeader
        section="Finance"
        title="Outstanding balances"
        description={`${balances.length} patients have a balance to follow up. Total outstanding: ${formatNaira(grandTotal)}.`}
        action={<div className="flex items-center gap-2">
          <Link href="/dashboard/admin/outstanding" className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${sort !== "name" ? "bg-turq-600 text-ink-950 border-turq-600" : "border-sand-50/15 text-sand-50/50"}`}>
            By Amount
          </Link>
          <Link href="/dashboard/admin/outstanding?sort=name" className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${sort === "name" ? "bg-turq-600 text-ink-950 border-turq-600" : "border-sand-50/15 text-sand-50/50"}`}>
            By Name
          </Link>
        </div>}
      />

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        <div className="dash-surface p-4 border border-red-500/20 bg-red-950/20 rounded-2xl">
          <p className="text-[10px] uppercase tracking-wider text-red-400/80 font-medium">Total Clinic Receivables</p>
          <p className="text-2xl font-bold font-display text-red-400 mt-1">{formatNaira(grandTotal)}</p>
          <p className="text-xs text-sand-50/40 mt-0.5">Uncollected patient revenue</p>
        </div>
        <div className="dash-surface p-4 border border-sand-50/10 rounded-2xl">
          <p className="text-[10px] uppercase tracking-wider text-sand-50/50 font-medium">Debtor Patients</p>
          <p className="text-2xl font-bold font-display text-sand-50 mt-1">{balances.length}</p>
          <p className="text-xs text-sand-50/40 mt-0.5">Patients requiring follow-up</p>
        </div>
        <div className="dash-surface p-4 border border-sand-50/10 rounded-2xl">
          <p className="text-[10px] uppercase tracking-wider text-sand-50/50 font-medium">Unpaid Visits</p>
          <p className="text-2xl font-bold font-display text-sand-50 mt-1">
            {balances.reduce((s, b) => s + b.unpaidVisits, 0)}
          </p>
          <p className="text-xs text-sand-50/40 mt-0.5">Appointments awaiting settlement</p>
        </div>
      </div>

      {/* Debt Management Guidance */}
      <div className="dash-surface p-4 mb-6 border border-turq-500/20 bg-turq-500/5 rounded-2xl">
        <h2 className="text-sm font-semibold text-sand-50 flex items-center gap-2">
          💡 How to manage and resolve outstanding patient balances
        </h2>
        <p className="text-xs text-sand-50/70 mt-1 leading-relaxed">
          Click <strong className="text-turq-300">Collect Payment</strong> to open the patient's billing invoice where you can record a cash/card/transfer payment or grant a management courtesy discount/waiver. Click <strong className="text-turq-300">File</strong> to review their individual visit treatments and clinical notes.
        </p>
      </div>

      {balances.length === 0 ? (
        <div className="text-center py-16 text-sand-50/30 border border-dashed border-sand-50/10 rounded-2xl">
          No outstanding balances. All accounts are settled!
        </div>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Phone</th>
                <th>Unpaid Visits</th>
                <th>Total Billed</th>
                <th>Collected</th>
                <th className="text-right">Outstanding</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {balances.map((b) => (
                <tr key={b.patientId}>
                  <td className="td-primary">
                    <Link href={`/dashboard/patients/${b.patientId}`} className="hover:text-turq-400 transition-colors font-medium">
                      {b.name}
                    </Link>
                  </td>
                  <td className="text-sand-50/70">
                    {b.phone !== "—" ? (
                      <a href={`tel:${b.phone}`} className="hover:text-turq-300 transition-colors">
                        {b.phone}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <span className="text-amber-400 font-medium">{b.unpaidVisits}</span>
                  </td>
                  <td>{formatNaira(b.totalCharge)}</td>
                  <td className="text-turq-400">{formatNaira(b.totalPaid + b.totalDisc)}</td>
                  <td className="text-right font-semibold text-red-400">{formatNaira(b.outstanding)}</td>
                  <td className="text-right space-x-2 whitespace-nowrap">
                    <Link
                      href={`/dashboard/patients/${b.patientId}`}
                      className="text-xs text-sand-50/60 hover:text-sand-50 px-2 py-1 rounded bg-sand-50/5 hover:bg-sand-50/10 border border-sand-50/10 transition-colors"
                    >
                      File
                    </Link>
                    <Link
                      href={`/dashboard/admin/billing?q=${encodeURIComponent(b.name)}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 hover:text-emerald-200 px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 transition-colors"
                    >
                      💳 Collect Payment
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

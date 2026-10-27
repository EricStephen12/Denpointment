import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isAdmin, isReceptionist } from "@/lib/auth";
import { formatNaira } from "@/lib/currency";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import WriteOffBalanceButton from "@/components/billing/WriteOffBalanceButton";

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
    <div className="space-y-6">
      <AdminPageHeader
        section="Financials"
        title="Outstanding Balances"
        description={`${balances.length} patients with unsettled invoices totaling ${formatNaira(grandTotal)}.`}
        action={
          <div className="inline-flex p-1 rounded-xl bg-black/40 border border-sand-50/10">
            <Link
              href="/dashboard/admin/outstanding"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                sort !== "name"
                  ? "bg-white/[0.09] text-white shadow-sm font-semibold"
                  : "text-sand-50/50 hover:text-sand-50"
              }`}
            >
              Highest Amount
            </Link>
            <Link
              href="/dashboard/admin/outstanding?sort=name"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                sort === "name"
                  ? "bg-white/[0.09] text-white shadow-sm font-semibold"
                  : "text-sand-50/50 hover:text-sand-50"
              }`}
            >
              Patient Name
            </Link>
          </div>
        }
      />

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="dash-surface p-5 rounded-2xl border border-red-500/20 bg-red-950/10 flex flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-red-400/80">
            Total Receivables
          </span>
          <div className="mt-2">
            <p className="text-2xl font-bold font-display text-red-400 tabular-nums">
              {formatNaira(grandTotal)}
            </p>
            <p className="text-xs text-sand-50/40 mt-1">Uncollected patient revenue</p>
          </div>
        </div>

        <div className="dash-surface p-5 rounded-2xl border border-sand-50/10 flex flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-sand-50/50">
            Accounts with Balance
          </span>
          <div className="mt-2">
            <p className="text-2xl font-bold font-display text-sand-50 tabular-nums">
              {balances.length}
            </p>
            <p className="text-xs text-sand-50/40 mt-1">Patients requiring payment follow-up</p>
          </div>
        </div>

        <div className="dash-surface p-5 rounded-2xl border border-sand-50/10 flex flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-sand-50/50">
            Unpaid Visits
          </span>
          <div className="mt-2">
            <p className="text-2xl font-bold font-display text-sand-50 tabular-nums">
              {balances.reduce((s, b) => s + b.unpaidVisits, 0)}
            </p>
            <p className="text-xs text-sand-50/40 mt-1">Appointments awaiting settlement</p>
          </div>
        </div>
      </div>

      {/* Balances Table */}
      {balances.length === 0 ? (
        <div className="text-center py-16 text-sand-50/40 border border-dashed border-sand-50/10 rounded-2xl">
          <p className="text-sm font-medium text-sand-50/60">No outstanding balances</p>
          <p className="text-xs text-sand-50/40 mt-1">All patient billing accounts are settled.</p>
        </div>
      ) : (
        <div className="dash-surface rounded-2xl border border-sand-50/10 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-sand-50/10 bg-white/[0.02] text-[10px] uppercase font-bold text-sand-50/40 tracking-wider">
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Unpaid Visits</th>
                  <th className="py-3 px-4">Total Billed</th>
                  <th className="py-3 px-4">Total Paid</th>
                  <th className="py-3 px-4 text-right">Outstanding</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-50/5">
                {balances.map((b) => (
                  <tr key={b.patientId} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <Link
                        href={`/dashboard/patients/${b.patientId}`}
                        className="font-medium text-sand-50 hover:text-turq-300 transition-colors block"
                      >
                        {b.name}
                      </Link>
                      <span className="text-[10px] text-sand-50/40 truncate block max-w-[180px]">
                        {b.email || "No email"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sand-50/70">
                      {b.phone !== "—" ? (
                        <a href={`tel:${b.phone}`} className="hover:text-turq-300 transition-colors">
                          {b.phone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {b.unpaidVisits} visit{b.unpaidVisits !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sand-50/80 tabular-nums">
                      {formatNaira(b.totalCharge)}
                    </td>
                    <td className="py-3 px-4 text-turq-400/90 tabular-nums">
                      {formatNaira(b.totalPaid + b.totalDisc)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-red-400 tabular-nums">
                      {formatNaira(b.outstanding)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/dashboard/patients/${b.patientId}`}
                          className="text-[11px] font-medium text-sand-50/60 hover:text-sand-50 px-2.5 py-1 rounded-lg border border-sand-50/15 hover:border-sand-50/30 transition-colors"
                        >
                          Record
                        </Link>
                        <Link
                          href={`/dashboard/admin/billing?q=${encodeURIComponent(b.name)}`}
                          className="text-[11px] font-semibold text-ink-950 bg-turq-500 hover:bg-turq-400 px-3 py-1 rounded-lg transition-colors shadow-sm"
                        >
                          Collect Payment
                        </Link>
                        <WriteOffBalanceButton
                          patientId={b.patientId}
                          patientName={b.name}
                          outstanding={b.outstanding}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

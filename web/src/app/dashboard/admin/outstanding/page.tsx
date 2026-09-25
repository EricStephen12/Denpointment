import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isAdmin, isReceptionist } from "@/lib/auth";
import { formatNaira } from "@/lib/currency";
import { AlertCircle } from "lucide-react";

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="dash-icon-badge">
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h1 className="dash-title font-display">Outstanding Balances</h1>
            <p className="dash-body mt-0.5">
              {balances.length} patient{balances.length !== 1 ? "s" : ""} with unpaid balances ·{" "}
              <span className="text-red-400">{formatNaira(grandTotal)} total</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/admin/outstanding" className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${sort !== "name" ? "bg-turq-600 text-ink-950 border-turq-600" : "border-sand-50/15 text-sand-50/50"}`}>
            By Amount
          </Link>
          <Link href="/dashboard/admin/outstanding?sort=name" className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${sort === "name" ? "bg-turq-600 text-ink-950 border-turq-600" : "border-sand-50/15 text-sand-50/50"}`}>
            By Name
          </Link>
        </div>
      </div>

      {balances.length === 0 ? (
        <div className="text-center py-16 text-sand-50/30 border border-dashed border-sand-50/10 rounded-2xl">
          No outstanding balances.
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
                    <Link href={`/dashboard/patients/${b.patientId}`} className="hover:text-turq-400 transition-colors">
                      {b.name}
                    </Link>
                  </td>
                  <td className="text-sand-50/50">{b.phone}</td>
                  <td>
                    <span className="text-amber-400">{b.unpaidVisits}</span>
                  </td>
                  <td>{formatNaira(b.totalCharge)}</td>
                  <td className="text-turq-400">{formatNaira(b.totalPaid + b.totalDisc)}</td>
                  <td className="text-right font-semibold text-red-400">{formatNaira(b.outstanding)}</td>
                  <td className="text-right">
                    <Link
                      href={`/dashboard/admin/billing?q=${encodeURIComponent(b.name)}`}
                      className="text-xs text-turq-400 hover:text-turq-300 transition-colors"
                    >
                      Record Payment
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

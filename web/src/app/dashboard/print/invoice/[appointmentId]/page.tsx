import React from "react";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isAdmin, isReceptionist, isDentist, isPatient } from "@/lib/auth";
import { getSiteContent } from "@/lib/site";
import { formatNaira } from "@/lib/currency";

export default async function PrintInvoicePage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");

  const { appointmentId: rawId } = await params;
  const appointmentId = parseInt(rawId, 10);
  if (Number.isNaN(appointmentId)) notFound();

  const [appt, site] = await Promise.all([
    prisma.appointment.findUnique({
      where: { appointmentId },
      include: {
        patient: { include: { person: { include: { contacts: true, addresses: true } } } },
        dentist: { include: { person: true } },
        treatments: { include: { service: true, medicines: true } },
        payments: { orderBy: { createdAt: "asc" } },
        insuranceClaims: { include: { patientInsurance: true } },
      },
    }),
    getSiteContent(),
  ]);

  if (!appt) notFound();

  // Access control — staff sees any, patient sees own only
  const isStaff = isAdmin(dbUser) || isReceptionist(dbUser) || isDentist(dbUser);
  const isOwner = isPatient(dbUser) && dbUser.patients[0]?.patientId === appt.pId;
  if (!isStaff && !isOwner) redirect("/dashboard");

  const person  = appt.patient.person;
  const dentist = appt.dentist.person;
  const dateStr = `${appt.day}/${appt.month}/${appt.year}`;
  const phone   = person.contacts[0]?.contactNumber ?? "";
  const address = person.addresses[0] ? `${person.addresses[0].street}, ${person.addresses[0].city}` : "";

  const totalCharge   = appt.treatments.reduce((s, t) => s + t.charge, 0);
  const totalPayments = appt.payments.filter((p) => p.type === "payment").reduce((s, p) => s + p.amount, 0);
  const totalDisc     = appt.payments.filter((p) => p.type === "discount" || p.type === "waiver").reduce((s, p) => s + p.amount, 0);
  const totalRefunds  = appt.payments.filter((p) => p.type === "refund").reduce((s, p) => s + p.amount, 0);
  const outstanding   = Math.max(totalCharge - totalPayments - totalDisc, 0);
  const isSettled     = outstanding === 0 && totalCharge > 0;

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Print toolbar */}
      <div className="print:hidden fixed top-0 inset-x-0 bg-ink-950 border-b border-sand-50/10 px-6 py-3 flex items-center justify-between z-50">
        <span className="text-sm text-sand-50/60">Invoice — {person.firstName} {person.lastName} · {dateStr}</span>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="bg-turq-600 hover:bg-turq-500 text-ink-950 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Print / Save PDF
          </button>
          <a href="javascript:history.back()" className="text-xs text-sand-50/40 hover:text-sand-50 px-3 py-2 transition-colors">
            ← Back
          </a>
        </div>
      </div>

      <div className="max-w-[720px] mx-auto px-8 py-12 print:py-6 mt-14 print:mt-0">
        {/* Clinic header */}
        <div className="flex items-start justify-between border-b-2 border-gray-900 pb-5 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{site.clinicName}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{site.address}</p>
            <p className="text-sm text-gray-500">Tel: {site.phone}</p>
            {site.email && <p className="text-sm text-gray-500">{site.email}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">INVOICE</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">#{String(appointmentId).padStart(6,"0")}</p>
            <p className="text-sm text-gray-500 mt-0.5">Date: {dateStr}</p>
            <span className={`inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-full ${isSettled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {isSettled ? "PAID" : "OUTSTANDING"}
            </span>
          </div>
        </div>

        {/* Patient & Provider */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Bill To</p>
            <p className="font-semibold text-gray-900">{person.firstName} {person.lastName}</p>
            {phone   && <p className="text-sm text-gray-600">{phone}</p>}
            {address && <p className="text-sm text-gray-600">{address}</p>}
            <p className="text-sm text-gray-600">{person.email}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Treating Dentist</p>
            <p className="font-semibold text-gray-900">Dr. {dentist.firstName} {dentist.lastName}</p>
            <p className="text-sm text-gray-600">{site.clinicName}</p>
            <p className="text-sm text-gray-600">Room {appt.room} · {appt.hour}:00</p>
          </div>
        </div>

        {/* Treatments table */}
        <table className="w-full mb-6 text-sm">
          <thead>
            <tr className="border-b-2 border-gray-900">
              <th className="text-left py-2 text-xs uppercase tracking-wider text-gray-500">Description</th>
              <th className="text-center py-2 text-xs uppercase tracking-wider text-gray-500">Tooth</th>
              <th className="text-right py-2 text-xs uppercase tracking-wider text-gray-500">Amount</th>
            </tr>
          </thead>
          <tbody>
            {appt.treatments.map((t) => (
              <tr key={t.treatmentId} className="border-b border-gray-100">
                <td className="py-2.5">
                  <p className="font-medium text-gray-900">{t.action}</p>
                  {t.complaint && <p className="text-xs text-gray-500">{t.complaint}</p>}
                  {t.service && <p className="text-xs text-gray-400">{t.service.name}</p>}
                </td>
                <td className="py-2.5 text-center text-gray-500">{t.toothNumber ?? "—"}</td>
                <td className="py-2.5 text-right font-medium text-gray-900">{formatNaira(t.charge)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="ml-auto w-64 space-y-1.5 text-sm mb-8">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span><span>{formatNaira(totalCharge)}</span>
          </div>
          {totalDisc > 0 && (
            <div className="flex justify-between text-amber-700">
              <span>Discount / Waiver</span><span>−{formatNaira(totalDisc)}</span>
            </div>
          )}
          <div className="flex justify-between text-green-700">
            <span>Paid</span><span>−{formatNaira(totalPayments)}</span>
          </div>
          {totalRefunds > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Refunded</span><span>+{formatNaira(totalRefunds)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-900 border-t border-gray-300 pt-1.5">
            <span>Balance Due</span>
            <span className={outstanding > 0 ? "text-red-700" : "text-green-700"}>
              {formatNaira(outstanding)}
            </span>
          </div>
        </div>

        {/* Payment history */}
        {appt.payments.length > 0 && (
          <div className="mb-8">
            <p className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-2">Payment History</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-1.5 text-xs text-gray-400">Date</th>
                  <th className="text-left py-1.5 text-xs text-gray-400">Type</th>
                  <th className="text-left py-1.5 text-xs text-gray-400">Method</th>
                  <th className="text-left py-1.5 text-xs text-gray-400">Reference</th>
                  <th className="text-right py-1.5 text-xs text-gray-400">Amount</th>
                </tr>
              </thead>
              <tbody>
                {appt.payments.map((p) => (
                  <tr key={p.paymentId} className="border-b border-gray-100">
                    <td className="py-1.5 text-gray-600">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="py-1.5 capitalize text-gray-700">{p.type}</td>
                    <td className="py-1.5 capitalize text-gray-600">{p.method.replace("_"," ")}</td>
                    <td className="py-1.5 text-gray-500">{p.reference ?? "—"}</td>
                    <td className={`py-1.5 text-right font-medium ${p.type === "refund" ? "text-red-600" : "text-green-700"}`}>
                      {p.type === "refund" ? "-" : "+"}{formatNaira(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Insurance claims */}
        {appt.insuranceClaims.length > 0 && (
          <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-2">Insurance Claims</p>
            {appt.insuranceClaims.map((c) => (
              <div key={c.claimId} className="flex justify-between text-sm text-gray-700">
                <span>{c.patientInsurance.provider} · {c.patientInsurance.policyNumber}</span>
                <span className="font-medium capitalize">{c.status} · {formatNaira(c.claimAmount)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 pt-6 text-center">
          <p className="text-sm text-gray-500">Thank you for choosing {site.clinicName}</p>
          <p className="text-xs text-gray-400 mt-1">{site.address} · {site.phone}</p>
        </div>
      </div>
    </div>
  );
}

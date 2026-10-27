import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isAdmin, isReceptionist, isDentist } from "@/lib/auth";
import { Search, Calendar, Download } from "lucide-react";
import DeletePatientButton from "@/components/patients/DeletePatientButton";
import RegisterPatientModal from "@/components/patients/RegisterPatientModal";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

const PAGE_SIZE = 50;
const MAX_TAKE = 500;

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; take?: string }>;
}) {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isAdmin(dbUser) && !isReceptionist(dbUser) && !isDentist(dbUser)) redirect("/dashboard");

  const canRegister = isAdmin(dbUser) || isReceptionist(dbUser);

  const { q, take: takeRaw } = await searchParams;
  const query = (q || "").trim();
  const parsedTake = parseInt(takeRaw || String(PAGE_SIZE), 10);
  const take = Number.isFinite(parsedTake)
    ? Math.min(Math.max(parsedTake, PAGE_SIZE), MAX_TAKE)
    : PAGE_SIZE;

  const where = query
    ? {
        person: {
          OR: [
            { firstName: { contains: query, mode: "insensitive" as const } },
            { lastName: { contains: query, mode: "insensitive" as const } },
            { email: { contains: query, mode: "insensitive" as const } },
            { contacts: { some: { contactNumber: { contains: query } } } },
          ],
        },
      }
    : undefined;

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      include: {
        person: { include: { contacts: true } },
        appointments: {
          select: {
            appointmentId: true,
            treatments: { select: { treatmentId: true, charge: true, paid: true } },
          },
        },
        toothFindings: { select: { findingId: true } },
        images: { select: { imageId: true } },
      },
      orderBy: { patientId: "desc" },
      take,
    }),
    prisma.patient.count({ where }),
  ]);

  const remaining = Math.max(total - patients.length, 0);
  const nextTake = Math.min(take + PAGE_SIZE, MAX_TAKE);
  const canLoadMore = remaining > 0 && take < MAX_TAKE;

  const loadMoreHref = query
    ? `/dashboard/patients?q=${encodeURIComponent(query)}&take=${nextTake}`
    : `/dashboard/patients?take=${nextTake}`;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        section="Registry"
        title="Patient Directory"
        description="Search, register, and manage patient clinical profiles, odontograms, and appointment records."
        action={
          <div className="flex items-center gap-2.5">
            <a
              href="/api/export/patients"
              className="inline-flex items-center gap-1.5 text-xs border border-sand-50/15 hover:border-turq-400/30 text-sand-50/70 hover:text-turq-400 px-3.5 py-2 rounded-xl transition-colors bg-white/[0.02]"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </a>
            {canRegister && <RegisterPatientModal />}
          </div>
        }
      />

      {/* Main Table Container */}
      <div className="dash-surface rounded-2xl border border-sand-50/10 overflow-hidden shadow-xl">
        {/* Search Toolbar */}
        <div className="p-4 sm:p-5 border-b border-sand-50/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-black/20">
          <form className="relative flex-1 max-w-md" method="get">
            <Search className="h-4 w-4 text-sand-50/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search by name, email, or phone…"
              className="dash-input text-xs pl-10 pr-20 w-full"
            />
            {query && (
              <Link
                href="/dashboard/patients"
                className="absolute right-14 top-1/2 -translate-y-1/2 text-[11px] text-sand-50/40 hover:text-sand-50"
              >
                Clear
              </Link>
            )}
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-turq-500 hover:bg-turq-400 text-ink-950 font-semibold rounded-lg text-xs transition-colors"
            >
              Search
            </button>
          </form>

          <span className="text-xs text-sand-50/50 self-start sm:self-auto font-medium">
            {total} Total Patient{total === 1 ? "" : "s"}
            {query ? ` matching "${query}"` : ""}
          </span>
        </div>

        {/* Patients Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-sand-50/10 bg-white/[0.02] text-[10px] uppercase font-bold text-sand-50/40 tracking-wider">
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Clinical Records</th>
                <th className="py-3 px-4">Billing Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-50/5">
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-sand-50/40">
                    {query
                      ? `No patients found matching "${query}".`
                      : "No patients registered yet. Click 'Register Patient' above to add your first patient."}
                  </td>
                </tr>
              ) : (
                patients.map((p) => {
                  const totalVisits = p.appointments.length;
                  const toothCount = p.toothFindings.length;
                  const imageCount = p.images.length;
                  const totalCharge = p.appointments
                    .flatMap((a) => a.treatments)
                    .reduce((sum, t) => sum + t.charge, 0);
                  const totalPaid = p.appointments
                    .flatMap((a) => a.treatments)
                    .filter((t) => t.paid)
                    .reduce((sum, t) => sum + t.charge, 0);
                  const hasUnpaid = totalCharge > totalPaid;
                  const initials = `${p.person.firstName?.[0] || ""}${p.person.lastName?.[0] || ""}`.toUpperCase();

                  return (
                    <tr key={p.patientId} className="hover:bg-white/[0.02] transition-colors group">
                      {/* 1. Patient Info with Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-turq-500/10 border border-turq-500/20 text-turq-400 font-bold text-xs flex items-center justify-center shrink-0">
                            {initials || "P"}
                          </div>
                          <div>
                            <Link
                              href={`/dashboard/patients/${p.patientId}`}
                              className="font-medium text-sand-50 hover:text-turq-300 transition-colors block"
                            >
                              {p.person.firstName} {p.person.lastName}
                            </Link>
                            <span className="text-[10px] text-sand-50/40 capitalize">
                              {p.person.gender || "Patient"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Contact Details */}
                      <td className="py-3 px-4">
                        <div className="text-sand-50/80 font-medium">
                          {p.person.contacts[0]?.contactNumber ? (
                            <a
                              href={`tel:${p.person.contacts[0].contactNumber}`}
                              className="hover:text-turq-300 transition-colors"
                            >
                              {p.person.contacts[0].contactNumber}
                            </a>
                          ) : (
                            <span className="text-sand-50/30">—</span>
                          )}
                        </div>
                        <div className="text-[10px] text-sand-50/40 truncate max-w-[170px]">
                          {p.person.email}
                        </div>
                      </td>

                      {/* 3. Clinical Records Badges */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Link
                            href={`/dashboard/patients/${p.patientId}#dental-chart`}
                            title="Open Odontogram Chart"
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium border transition-colors ${
                              toothCount > 0
                                ? "bg-turq-500/10 text-turq-300 border-turq-500/25 hover:bg-turq-500/20"
                                : "bg-sand-50/5 text-sand-50/40 border-sand-50/10"
                            }`}
                          >
                            {toothCount} teeth chart
                          </Link>
                          {imageCount > 0 && (
                            <Link
                              href={`/dashboard/patients/${p.patientId}#patient-images`}
                              title="Photos & X-Rays"
                              className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-sky-500/10 text-sky-300 border border-sky-500/25 hover:bg-sky-500/20 transition-colors"
                            >
                              {imageCount} photos
                            </Link>
                          )}
                          <span className="text-[10px] text-sand-50/40">
                            {totalVisits} visit{totalVisits !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </td>

                      {/* 4. Billing Status */}
                      <td className="py-3 px-4">
                        {hasUnpaid ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            Unpaid Balance
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Settled
                          </span>
                        )}
                      </td>

                      {/* 5. Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            href={`/dashboard/patients/${p.patientId}`}
                            className="text-[11px] font-medium text-sand-50/80 hover:text-sand-50 px-2.5 py-1 rounded-lg border border-sand-50/15 hover:border-sand-50/30 transition-colors bg-white/[0.02]"
                          >
                            Open File
                          </Link>
                          {canRegister && (
                            <Link
                              href={`/dashboard/book?patientId=${p.patientId}`}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-turq-400 hover:text-turq-300 px-2.5 py-1 rounded-lg border border-turq-500/20 hover:border-turq-500/40 bg-turq-500/10 transition-colors"
                            >
                              <Calendar className="h-3 w-3" /> Book
                            </Link>
                          )}
                          {isAdmin(dbUser) && (
                            <DeletePatientButton
                              patientId={p.patientId}
                              patientName={`${p.person.firstName} ${p.person.lastName}`}
                              variant="table"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination / Load More */}
        {canLoadMore && (
          <div className="p-4 border-t border-sand-50/10 text-center bg-white/[0.01]">
            <Link
              href={loadMoreHref}
              className="text-xs font-semibold text-turq-400 hover:text-turq-300 border border-turq-500/25 bg-turq-500/10 px-4 py-2 rounded-xl transition-colors inline-block"
            >
              Load {Math.min(remaining, PAGE_SIZE)} more patients ({remaining} remaining)
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

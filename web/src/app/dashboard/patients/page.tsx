import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isAdmin, isReceptionist, isDentist } from "@/lib/auth";
import { registerWalkInPatient } from "@/app/actions/patients";
import { Search, UserPlus, Calendar, Download } from "lucide-react";
import DeletePatientButton from "@/components/patients/DeletePatientButton";

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
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="dash-icon-badge">
          <Search className="h-5 w-5 text-turq-400" />
        </div>
        <div>
          <h1 className="dash-title font-display">Patients &amp; Clinical Records</h1>
          <p className="dash-body mt-0.5">
            Search or select a patient to open their comprehensive file — including the <span className="text-turq-300">2D Odontogram</span>, treatment history, and clinical photos.
          </p>
        </div>
        {canRegister && (
          <div className="ml-auto">
            <a
              href="/api/export/patients"
              className="inline-flex items-center gap-1.5 text-xs border border-sand-50/15 hover:border-turq-400/30 text-sand-50/40 hover:text-turq-400 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </a>
          </div>
        )}
      </div>

      {/* Guide Banner */}
      <div className="dash-surface p-4 mb-6 border border-turq-500/20 bg-turq-500/5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-sand-50 flex items-center gap-2">
            💡 Where do patient records live?
          </h2>
          <p className="text-xs text-sand-50/70 mt-1 leading-relaxed">
            Click any patient below to open their master file. You will find their <strong className="text-sand-50">Demographics &amp; Phone</strong> on the left, and their <strong className="text-sand-50">Visit History</strong>, <strong className="text-turq-300">2D Dental Tooth Chart</strong>, <strong className="text-turq-300">Clinical Plans</strong>, and <strong className="text-turq-300">X-Rays &amp; Photos</strong> directly on the right.
          </p>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${canRegister ? "lg:grid-cols-5" : ""} gap-8`}>
        <div className={canRegister ? "lg:col-span-3" : ""}>
          <form className="flex gap-3 mb-4" method="get">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search by name, email, or phone…"
              className="dash-input flex-1"
            />
            <button
              type="submit"
              className="bg-turq-600 text-ink-950 py-2 px-4 rounded-lg font-semibold text-sm hover:bg-turq-500 transition-colors shrink-0"
            >
              Search
            </button>
          </form>

          {total > 0 && (
            <p className="text-xs text-sand-50/40 mb-3">
              Showing {patients.length} of {total} patient{total === 1 ? "" : "s"}
              {query ? " matching your search" : ""}
            </p>
          )}

          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Patient File</th>
                  <th>Contact</th>
                  <th>Clinical Records</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="td-empty">
                      {query
                        ? "No patients found for that search."
                        : "No patients registered yet."}
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

                    return (
                      <tr key={p.patientId}>
                        <td className="td-primary">
                          <Link
                            href={`/dashboard/patients/${p.patientId}`}
                            className="font-semibold text-sand-50 hover:text-turq-400 transition-colors block"
                          >
                            {p.person.firstName} {p.person.lastName}
                          </Link>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="text-[10px] text-sand-50/40 capitalize">{p.person.gender}</span>
                            {hasUnpaid && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                                Unpaid Balance
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="text-xs text-sand-50/80">{p.person.contacts[0]?.contactNumber || "—"}</div>
                          <div className="text-[11px] text-sand-50/40 truncate max-w-[150px]">{p.person.email}</div>
                        </td>
                        <td>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Link
                              href={`/dashboard/patients/${p.patientId}#dental-chart`}
                              title="Jump to 2D Odontogram"
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium border transition-colors ${
                                toothCount > 0
                                  ? "bg-turq-500/15 text-turq-300 border-turq-500/30 hover:bg-turq-500/25"
                                  : "bg-sand-50/5 text-sand-50/40 border-sand-50/10 hover:text-sand-50/70"
                              }`}
                            >
                              🦷 {toothCount} {toothCount === 1 ? "tooth" : "teeth"}
                            </Link>
                            <Link
                              href={`/dashboard/patients/${p.patientId}#patient-images`}
                              title="Jump to Photos and X-Rays"
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium border transition-colors ${
                                imageCount > 0
                                  ? "bg-sky-500/15 text-sky-300 border-sky-500/30 hover:bg-sky-500/25"
                                  : "bg-sand-50/5 text-sand-50/40 border-sand-50/10 hover:text-sand-50/70"
                              }`}
                            >
                              📸 {imageCount} {imageCount === 1 ? "photo" : "photos"}
                            </Link>
                            <span className="text-[10px] text-sand-50/40">
                              {totalVisits} {totalVisits === 1 ? "visit" : "visits"}
                            </span>
                          </div>
                        </td>
                        <td className="text-right space-x-2 whitespace-nowrap">
                          <Link
                            href={`/dashboard/patients/${p.patientId}`}
                            className="inline-flex items-center gap-1 text-xs text-sand-50/70 hover:text-turq-400 font-medium px-2 py-1 rounded bg-sand-50/5 hover:bg-turq-500/10 border border-sand-50/10 transition-colors"
                          >
                            Open File
                          </Link>
                          {canRegister && (
                            <Link
                              href={`/dashboard/book?patientId=${p.patientId}`}
                              className="inline-flex items-center gap-1 text-xs text-turq-400 hover:text-turq-300 font-medium px-2 py-1 rounded bg-turq-500/10 border border-turq-500/20 transition-colors"
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
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {canLoadMore && (
            <div className="mt-4 flex flex-col items-center gap-1">
              <Link
                href={loadMoreHref}
                className="bg-turq-600/90 text-ink-950 py-2 px-5 rounded-lg font-semibold text-sm hover:bg-turq-500 transition-colors"
              >
                Load more
              </Link>
              <p className="text-[11px] text-sand-50/35">
                {remaining} more patient{remaining === 1 ? "" : "s"}
              </p>
            </div>
          )}
        </div>

        {canRegister && (
          <div className="lg:col-span-2">
            <div className="dash-surface p-5">
              <h2 className="text-sm font-semibold text-sand-50 mb-4 flex items-center gap-2">
                <UserPlus className="h-4 w-4" /> Register Walk-in / Phone Patient
              </h2>
              <form action={registerWalkInPatient} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="firstName" className="block text-xs font-medium text-sand-50/50 mb-1">First Name</label>
                    <input type="text" id="firstName" name="firstName" required className="dash-input" />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-xs font-medium text-sand-50/50 mb-1">Last Name</label>
                    <input type="text" id="lastName" name="lastName" required className="dash-input" />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-sand-50/50 mb-1">Email</label>
                  <input type="email" id="email" name="email" required className="dash-input" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="gender" className="block text-xs font-medium text-sand-50/50 mb-1">Gender</label>
                    <select id="gender" name="gender" required className="dash-input">
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-xs font-medium text-sand-50/50 mb-1">Phone</label>
                    <input type="tel" id="phone" name="phone" className="dash-input" />
                  </div>
                </div>
                <div>
                  <label htmlFor="occupation" className="block text-xs font-medium text-sand-50/50 mb-1">Occupation</label>
                  <input type="text" id="occupation" name="occupation" maxLength={80} className="dash-input" />
                </div>
                <div>
                  <label htmlFor="referralSource" className="block text-xs font-medium text-sand-50/50 mb-1">How did they find us?</label>
                  <select id="referralSource" name="referralSource" className="dash-input">
                    <option value="">Select…</option>
                    <option>Walk-in</option>
                    <option>Referred by patient</option>
                    <option>Google</option>
                    <option>Instagram</option>
                    <option>Facebook</option>
                    <option>Doctor referral</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="emergencyContactName" className="block text-xs font-medium text-sand-50/50 mb-1">Emergency Contact</label>
                    <input type="text" id="emergencyContactName" name="emergencyContactName" maxLength={80} placeholder="Name" className="dash-input" />
                  </div>
                  <div>
                    <label htmlFor="emergencyContactPhone" className="block text-xs font-medium text-sand-50/50 mb-1">Emergency Phone</label>
                    <input type="tel" id="emergencyContactPhone" name="emergencyContactPhone" maxLength={20} className="dash-input" />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-turq-600 text-ink-950 py-2.5 px-4 rounded-lg font-semibold text-sm hover:bg-turq-500 transition-colors"
                >
                  Register &amp; Book Appointment
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

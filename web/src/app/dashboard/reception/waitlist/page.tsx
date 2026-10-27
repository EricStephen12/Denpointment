import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isReceptionist, isAdmin } from "@/lib/auth";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AddToWaitlistModal from "@/components/reception/AddToWaitlistModal";
import WaitlistStatusButton from "@/components/reception/WaitlistStatusButton";
import DeleteWaitlistButton from "@/components/reception/DeleteWaitlistButton";
import { Clock, Calendar, UserCheck, Stethoscope, Phone, AlertCircle } from "lucide-react";

export default async function WaitlistPage() {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isReceptionist(dbUser) && !isAdmin(dbUser)) redirect("/dashboard");

  const [waitlist, rawPatients, rawDentists] = await Promise.all([
    prisma.waitlistEntry.findMany({
      where: { status: "waiting" },
      include: {
        patient: { include: { person: { include: { contacts: true } } } },
        dentist: { include: { person: true } },
      },
      orderBy: { requestedDate: "asc" },
    }),
    prisma.patient.findMany({
      include: { person: true },
      orderBy: { person: { lastName: "asc" } },
    }),
    prisma.dentist.findMany({ include: { person: true } }),
  ]);

  const patients = rawPatients.map((p) => ({
    patientId: p.patientId,
    name: `${p.person.firstName} ${p.person.lastName}`,
  }));

  const dentists = rawDentists.map((d) => ({
    dentistId: d.dentistId,
    name: `Dr. ${d.person.firstName} ${d.person.lastName}`,
  }));

  function fmtDate(d: Date) {
    return new Date(d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  }

  const requestedDocCount = waitlist.filter((w) => w.dentistId !== null).length;
  const anyDocCount = waitlist.length - requestedDocCount;

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <AdminPageHeader
        section="Operations"
        title="Standby & Waiting List"
        subtitle="Manage patients waiting for cancellations and immediate chair fill"
        action={<AddToWaitlistModal patients={patients} dentists={dentists} />}
      />

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-ink-900 border border-sand-50/10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-sand-50/40 font-medium">Patients on Standby</p>
            <p className="text-2xl font-bold font-display text-turq-400 mt-1">{waitlist.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-turq-500/10 text-turq-400">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-ink-900 border border-sand-50/10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-sand-50/40 font-medium">Specific Doctor Requested</p>
            <p className="text-2xl font-bold font-display text-sand-50 mt-1">{requestedDocCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-sand-50/5 text-sand-50/60">
            <Stethoscope className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-ink-900 border border-sand-50/10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-sand-50/40 font-medium">Any Available Doctor</p>
            <p className="text-2xl font-bold font-display text-emerald-400 mt-1">{anyDocCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Standby Table */}
      <div className="bg-ink-900 border border-sand-50/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-sand-50/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-sand-50">Active Queue</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-sand-50/10 text-sand-50/70 font-medium">
              {waitlist.length} in queue
            </span>
          </div>
        </div>

        {waitlist.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-2xl bg-sand-50/5 border border-sand-50/10 flex items-center justify-center mx-auto mb-3 text-sand-50/30">
              <Clock className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-sand-50/60">No patients currently on the waiting list</p>
            <p className="text-xs text-sand-50/35 max-w-sm mx-auto mt-1">
              When appointment schedules are full, add standby patients here to quickly refill cancellations.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-sand-50/[0.02] border-b border-sand-50/10 text-xs font-semibold uppercase tracking-wider text-sand-50/40">
                <tr>
                  <th className="py-3.5 px-5">Patient</th>
                  <th className="py-3.5 px-5">Requested Date</th>
                  <th className="py-3.5 px-5">Preferred Doctor</th>
                  <th className="py-3.5 px-5">Notes</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-50/5">
                {waitlist.map((entry) => {
                  const patientFullName = `${entry.patient.person.firstName} ${entry.patient.person.lastName}`;
                  const initials = `${entry.patient.person.firstName[0] || ""}${entry.patient.person.lastName[0] || ""}`.toUpperCase();
                  const phone = entry.patient.person.contacts?.[0]?.contactNumber;

                  return (
                    <tr key={entry.waitlistId} className="hover:bg-sand-50/[0.02] transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-turq-500/10 border border-turq-500/20 text-turq-400 flex items-center justify-center text-xs font-bold shrink-0">
                            {initials}
                          </div>
                          <div>
                            <Link
                              href={`/dashboard/patients/${entry.patient.patientId}`}
                              className="font-semibold text-sand-50 hover:text-turq-400 transition-colors"
                            >
                              {patientFullName}
                            </Link>
                            {phone && (
                              <p className="text-xs text-sand-50/40 flex items-center gap-1.5 mt-0.5">
                                <Phone className="h-3 w-3 text-sand-50/30" />
                                <a href={`tel:${phone}`} className="hover:text-sand-50 transition-colors">
                                  {phone}
                                </a>
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 text-xs text-sand-50/80">
                          <Calendar className="h-3.5 w-3.5 text-turq-400" />
                          <span className="font-medium">{fmtDate(entry.requestedDate)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        {entry.dentist ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-turq-500/10 text-turq-300 border border-turq-500/20">
                            Dr. {entry.dentist.person.lastName}
                          </span>
                        ) : (
                          <span className="text-xs text-sand-50/40">Any Doctor</span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        {entry.notes ? (
                          <p className="text-xs text-sand-50/60 max-w-xs truncate" title={entry.notes}>
                            {entry.notes}
                          </p>
                        ) : (
                          <span className="text-xs text-sand-50/20">—</span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/book?patientId=${entry.patient.patientId}`}
                            className="inline-flex items-center gap-1.5 text-xs bg-turq-500 hover:bg-turq-400 text-ink-950 px-3 py-1.5 rounded-lg font-bold transition-all shadow-sm"
                          >
                            <Calendar className="h-3.5 w-3.5" /> Book Slot
                          </Link>
                          <WaitlistStatusButton waitlistId={entry.waitlistId} status="booked" />
                          <DeleteWaitlistButton waitlistId={entry.waitlistId} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

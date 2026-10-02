import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isReceptionist, isAdmin } from "@/lib/auth";
import { updateWaitlistEntry } from "@/app/actions/appointments";
import DeleteWaitlistButton from "@/components/reception/DeleteWaitlistButton";
import AddToWaitlistForm from "@/components/reception/AddToWaitlistForm";
import WaitlistStatusButton from "@/components/reception/WaitlistStatusButton";
import SubmitButton from "@/components/common/SubmitButton";
import { Clock, Calendar } from "lucide-react";

export default async function WaitlistPage() {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isReceptionist(dbUser) && !isAdmin(dbUser)) redirect("/dashboard");

  const [waitlist, patients, dentists] = await Promise.all([
    prisma.waitlistEntry.findMany({
      where: { status: "waiting" },
      include: {
        patient: { include: { person: true } },
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

  function fmtDate(d: Date) {
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="dash-icon-badge">
          <Clock className="h-5 w-5 text-turq-400" />
        </div>
        <div>
          <h1 className="dash-title font-display">Waiting List &amp; Standby Queue</h1>
          <p className="dash-body mt-0.5">{waitlist.length} patient{waitlist.length === 1 ? "" : "s"} waiting for an earlier or open appointment slot</p>
        </div>
      </div>

      {/* Guide Banner */}
      <div className="dash-surface p-4 mb-6 border border-turq-500/20 bg-turq-500/5 rounded-2xl">
        <h2 className="text-sm font-semibold text-sand-50 flex items-center gap-2">
          💡 What is the Waiting List used for?
        </h2>
        <p className="text-xs text-sand-50/70 mt-1 leading-relaxed">
          When dentists are fully booked, patients who want an earlier visit or specific day are added here. If another patient cancels or reschedules, receptionists open this queue, click <strong className="text-turq-300">Book Slot</strong>, and call the patient immediately to fill the empty chair so the clinic loses zero production time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* List */}
        <div className="lg:col-span-2">
          {waitlist.length === 0 ? (
            <div className="dash-surface p-8 text-center text-sand-50/30">
              No patients on the waiting list.
            </div>
          ) : (
            <div className="space-y-3">
              {waitlist.map((entry) => (
                <div key={entry.waitlistId} className="dash-surface p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <Link
                      href={`/dashboard/patients/${entry.patient.patientId}`}
                      className="font-semibold text-sand-50 hover:text-turq-400 transition-colors"
                    >
                      {entry.patient.person.firstName} {entry.patient.person.lastName}
                    </Link>
                    <p className="text-xs text-sand-50/45 mt-0.5">
                      Requested: {fmtDate(entry.requestedDate)}
                      {entry.dentist && ` · Dr. ${entry.dentist.person.lastName}`}
                    </p>
                    {entry.notes && <p className="text-xs text-sand-50/30 mt-0.5">{entry.notes}</p>}
                    <p className="text-[10px] text-sand-50/25 mt-1">Added {fmtDate(entry.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Link
                      href={`/dashboard/book?patientId=${entry.patient.patientId}`}
                      className="inline-flex items-center gap-1.5 text-xs bg-turq-600 hover:bg-turq-500 text-ink-950 px-3 py-1.5 rounded-lg font-semibold transition-colors"
                    >
                      <Calendar className="h-3.5 w-3.5" /> Book Slot
                    </Link>
                    <WaitlistStatusButton waitlistId={entry.waitlistId} status="booked" />
                    <WaitlistStatusButton waitlistId={entry.waitlistId} status="expired" />
                    <details className="relative">
                      <summary className="cursor-pointer list-none rounded-lg border border-sand-50/10 px-2.5 py-1.5 text-xs text-sand-50/60 hover:text-sand-50">Edit</summary>
                      <form action={updateWaitlistEntry} className="absolute right-0 z-20 mt-2 grid w-72 gap-2 rounded-lg border border-sand-50/15 bg-ink-900 p-4 shadow-xl">
                        <input type="hidden" name="waitlistId" value={entry.waitlistId} />
                        <label className="grid gap-1 text-xs text-sand-50/60">Patient
                          <select name="patientId" defaultValue={entry.patientId} required className="dash-input">
                            {patients.map((patient) => (
                              <option key={patient.patientId} value={patient.patientId}>
                                {patient.person.firstName} {patient.person.lastName}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="grid gap-1 text-xs text-sand-50/60">Requested date
                          <input type="date" name="requestedDate" defaultValue={entry.requestedDate.toISOString().slice(0, 10)} required className="dash-input" />
                        </label>
                        <label className="grid gap-1 text-xs text-sand-50/60">Preferred dentist
                          <select name="dentistId" defaultValue={entry.dentistId ?? ""} className="dash-input">
                            <option value="">Any dentist</option>
                            {dentists.map((dentist) => (
                              <option key={dentist.dentistId} value={dentist.dentistId}>
                                Dr. {dentist.person.firstName} {dentist.person.lastName}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="grid gap-1 text-xs text-sand-50/60">Notes
                          <input name="notes" maxLength={300} defaultValue={entry.notes ?? ""} className="dash-input" />
                        </label>
                        <SubmitButton pendingText="Saving..." className="rounded-lg bg-turq-600 px-3 py-2 text-sm font-semibold text-ink-950 hover:bg-turq-500">
                          Save changes
                        </SubmitButton>
                      </form>
                    </details>
                    <DeleteWaitlistButton
                      waitlistId={entry.waitlistId}
                      patientName={`${entry.patient.person.firstName} ${entry.patient.person.lastName}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add to waitlist */}
        <div>
          <AddToWaitlistForm
            patients={patients.map((p) => ({
              patientId: p.patientId,
              name: `${p.person.firstName} ${p.person.lastName}`,
            }))}
            dentists={dentists.map((d) => ({
              dentistId: d.dentistId,
              name: `Dr. ${d.person.firstName} ${d.person.lastName}`,
            }))}
          />
        </div>
      </div>
    </div>
  );
}

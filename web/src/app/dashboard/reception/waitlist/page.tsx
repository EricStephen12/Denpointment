import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isReceptionist, isAdmin } from "@/lib/auth";
import { addToWaitlist, updateWaitlistStatus } from "@/app/actions/appointments";
import { Clock, UserPlus, Calendar, CheckCircle2, XCircle } from "lucide-react";

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
      <div className="flex items-center gap-3 mb-8">
        <div className="dash-icon-badge">
          <Clock className="h-5 w-5 text-turq-400" />
        </div>
        <div>
          <h1 className="dash-title font-display">Waiting List</h1>
          <p className="dash-body mt-0.5">Patients waiting for a slot to open up</p>
        </div>
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
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/dashboard/book?patientId=${entry.patient.patientId}`}
                      className="inline-flex items-center gap-1.5 text-xs bg-turq-600 hover:bg-turq-500 text-ink-950 px-3 py-1.5 rounded-lg font-semibold transition-colors"
                    >
                      <Calendar className="h-3.5 w-3.5" /> Book Slot
                    </Link>
                    <form action={updateWaitlistStatus}>
                      <input type="hidden" name="waitlistId" value={entry.waitlistId} />
                      <input type="hidden" name="status" value="booked" />
                      <button type="submit" className="inline-flex items-center gap-1 text-xs border border-turq-500/20 text-turq-400/70 hover:text-turq-400 px-2.5 py-1.5 rounded-lg transition-colors">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Booked
                      </button>
                    </form>
                    <form action={updateWaitlistStatus}>
                      <input type="hidden" name="waitlistId" value={entry.waitlistId} />
                      <input type="hidden" name="status" value="expired" />
                      <button type="submit" className="inline-flex items-center gap-1 text-xs text-sand-50/30 hover:text-red-400 transition-colors px-2 py-1.5">
                        <XCircle className="h-3.5 w-3.5" /> Remove
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add to waitlist */}
        <div>
          <div className="dash-surface p-5">
            <h2 className="text-sm font-semibold text-sand-50 mb-4 flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-turq-400" /> Add to Waiting List
            </h2>
            <form action={addToWaitlist} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-sand-50/50 mb-1">Patient</label>
                <select name="patientId" required className="dash-input">
                  <option value="">Select patient…</option>
                  {patients.map((p) => (
                    <option key={p.patientId} value={p.patientId}>
                      {p.person.firstName} {p.person.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-sand-50/50 mb-1">Requested Date</label>
                <input type="date" name="requestedDate" required className="dash-input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-sand-50/50 mb-1">Preferred Dentist (optional)</label>
                <select name="dentistId" className="dash-input">
                  <option value="">Any dentist</option>
                  {dentists.map((d) => (
                    <option key={d.dentistId} value={d.dentistId}>
                      Dr. {d.person.firstName} {d.person.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-sand-50/50 mb-1">Notes (optional)</label>
                <input type="text" name="notes" maxLength={300} className="dash-input" placeholder="e.g. needs early morning slot" />
              </div>
              <button type="submit" className="w-full bg-turq-600 hover:bg-turq-500 text-ink-950 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                Add to Waitlist
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isReceptionist, isAdmin } from "@/lib/auth";
import { updateRecallStatus, addRecallCallLog } from "@/app/actions/clinical-care";
import { RefreshCw, Calendar, Phone, ChevronDown } from "lucide-react";

export default async function RecallsPage() {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isReceptionist(dbUser) && !isAdmin(dbUser)) redirect("/dashboard");

  const now = new Date();

  const recalls = await prisma.recall.findMany({
    where: { status: { in: ["due", "scheduled"] } },
    include: {
      patient: { include: { person: { include: { contacts: true } } } },
      dentist: { include: { person: true } },
      callLogs: { orderBy: { calledAt: "desc" }, take: 5 },
    },
    orderBy: { dueDate: "asc" },
  });

  const overdue = recalls.filter((r) => new Date(r.dueDate) <= now);
  const upcoming = recalls.filter((r) => new Date(r.dueDate) > now);

  function fmtDate(d: Date) {
    return new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  }

  function daysOverdue(d: Date) {
    return Math.floor((now.getTime() - new Date(d).getTime()) / (1000 * 60 * 60 * 24));
  }

  const RecallCard = ({ recall }: { recall: typeof recalls[0] }) => {
    const isOverdue = new Date(recall.dueDate) <= now;
    const days = isOverdue ? daysOverdue(recall.dueDate) : 0;
    const phone = recall.patient.person.contacts[0]?.contactNumber;

    return (
      <div className="dash-surface p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/dashboard/patients/${recall.patient.patientId}`}
                className="font-semibold text-sand-50 hover:text-turq-400 transition-colors">
                {recall.patient.person.firstName} {recall.patient.person.lastName}
              </Link>
              {isOverdue && (
                <span className="text-[11px] font-medium bg-red-900/30 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
                  {days}d overdue
                </span>
              )}
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                recall.status === "due" ? "bg-amber-900/30 text-amber-400 border border-amber-500/20"
                                       : "bg-turq-600/20 text-turq-400 border border-turq-500/20"
              }`}>{recall.status}</span>
            </div>
            <p className="text-xs text-sand-50/45 mt-1">
              Reason: {recall.reason} · Due {fmtDate(recall.dueDate)}
              {recall.dentist && ` · Dr. ${recall.dentist.person.lastName}`}
            </p>
            {phone && (
              <a href={`tel:${phone}`} className="inline-flex items-center gap-1 text-xs text-sand-50/30 hover:text-turq-400 mt-1 transition-colors">
                <Phone className="h-3 w-3" /> {phone}
              </a>
            )}
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link
              href={`/dashboard/book?patientId=${recall.patient.patientId}`}
              className="inline-flex items-center gap-1.5 text-xs bg-turq-600 hover:bg-turq-500 text-ink-950 px-3 py-1.5 rounded-lg font-semibold transition-colors"
            >
              <Calendar className="h-3.5 w-3.5" /> Book Now
            </Link>
            <form action={updateRecallStatus}>
              <input type="hidden" name="recallId" value={recall.recallId} />
              <input type="hidden" name="status" value="completed" />
              <button type="submit" className="inline-flex items-center gap-1 text-xs border border-turq-500/20 text-turq-400/70 hover:text-turq-400 px-2.5 py-1.5 rounded-lg transition-colors">
                Mark Done
              </button>
            </form>
            <form action={updateRecallStatus}>
              <input type="hidden" name="recallId" value={recall.recallId} />
              <input type="hidden" name="status" value="cancelled" />
              <button type="submit" className="text-xs text-sand-50/25 hover:text-red-400 px-2 py-1.5 transition-colors">
                Cancel
              </button>
            </form>
          </div>
        </div>

        {/* Call log history */}
        {recall.callLogs.length > 0 && (
          <div className="pt-3 border-t border-sand-50/8">
            <p className="text-[10px] uppercase tracking-wider text-sand-50/30 mb-2">Call attempts</p>
            <ul className="space-y-1">
              {recall.callLogs.map((log) => (
                <li key={log.logId} className="text-xs text-sand-50/50 flex items-baseline gap-2">
                  <span className="text-sand-50/25 shrink-0">{new Date(log.calledAt).toLocaleDateString()}</span>
                  <span className="text-sand-50/70 font-medium">{log.outcome}</span>
                  {log.notes && <span className="text-sand-50/30">— {log.notes}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Log a call attempt */}
        <form action={addRecallCallLog} className="flex gap-2 pt-1">
          <input type="hidden" name="recallId" value={recall.recallId} />
          <select name="outcome" required className="dash-input text-xs py-1 flex-1">
            <option value="">Log call attempt…</option>
            <option value="No answer">No answer</option>
            <option value="Left voicemail">Left voicemail</option>
            <option value="Spoke to patient">Spoke to patient</option>
            <option value="Patient will call back">Patient will call back</option>
            <option value="Appointment booked">Appointment booked</option>
            <option value="Patient declined">Patient declined</option>
          </select>
          <input name="notes" maxLength={300} placeholder="Notes" className="dash-input text-xs py-1 flex-1" />
          <button type="submit" className="text-xs bg-sand-50/10 hover:bg-sand-50/15 text-sand-50 px-3 py-1.5 rounded-lg transition-colors shrink-0">
            Log
          </button>
        </form>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="dash-icon-badge">
          <RefreshCw className="h-5 w-5 text-turq-400" />
        </div>
        <div>
          <h1 className="dash-title font-display">Recall List</h1>
          <p className="dash-body mt-0.5">
            {overdue.length} overdue · {upcoming.length} upcoming
          </p>
        </div>
      </div>

      {overdue.length === 0 && upcoming.length === 0 ? (
        <div className="text-center py-16 text-sand-50/30 border border-dashed border-sand-50/10 rounded-2xl">
          No active recalls. Dentists create recalls from the patient record.
        </div>
      ) : (
        <div className="space-y-8">
          {overdue.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-red-400/70 font-semibold mb-3">
                Overdue — {overdue.length} patient{overdue.length !== 1 ? "s" : ""}
              </p>
              <div className="space-y-3">
                {overdue.map((r) => <RecallCard key={r.recallId} recall={r} />)}
              </div>
            </div>
          )}
          {upcoming.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-sand-50/35 font-semibold mb-3">
                Upcoming — {upcoming.length} patient{upcoming.length !== 1 ? "s" : ""}
              </p>
              <div className="space-y-3">
                {upcoming.map((r) => <RecallCard key={r.recallId} recall={r} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

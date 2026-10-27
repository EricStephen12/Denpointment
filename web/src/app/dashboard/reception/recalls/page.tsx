import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isReceptionist, isAdmin } from "@/lib/auth";
import { updateRecallStatus, addRecallCallLog } from "@/app/actions/clinical-care";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { RefreshCw, Calendar, Phone, CheckCircle2, Clock, Trash2, AlertTriangle, AlertCircle } from "lucide-react";
import SubmitButton from "@/components/common/SubmitButton";
import AddRecallForm from "@/components/recalls/AddRecallForm";
import EditRecallModal from "@/components/recalls/EditRecallModal";
import DeleteRecallButton from "@/components/recalls/DeleteRecallButton";

export default async function RecallsPage() {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isReceptionist(dbUser) && !isAdmin(dbUser)) redirect("/dashboard");

  const now = new Date();

  const [recalls, rawPatients, rawDentists] = await Promise.all([
    prisma.recall.findMany({
      where: { status: { in: ["due", "scheduled"] } },
      include: {
        patient: { include: { person: { include: { contacts: true } } } },
        dentist: { include: { person: true } },
        callLogs: { orderBy: { calledAt: "desc" }, take: 5 },
      },
      orderBy: { dueDate: "asc" },
    }),
    prisma.patient.findMany({
      include: { person: true },
      orderBy: { person: { lastName: "asc" } },
    }),
    prisma.dentist.findMany({
      include: { person: true },
    }),
  ]);

  const patients = rawPatients.map((p) => ({
    patientId: p.patientId,
    name: `${p.person.firstName} ${p.person.lastName}`,
  }));

  const dentists = rawDentists.map((d) => ({
    dentistId: d.dentistId,
    name: `Dr. ${d.person.firstName} ${d.person.lastName}`,
  }));

  const overdue = recalls.filter((r) => new Date(r.dueDate) <= now);
  const upcoming = recalls.filter((r) => new Date(r.dueDate) > now);
  const scheduledCount = recalls.filter((r) => r.status === "scheduled").length;

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
    const patientFullName = `${recall.patient.person.firstName} ${recall.patient.person.lastName}`;
    const initials = `${recall.patient.person.firstName[0] || ""}${recall.patient.person.lastName[0] || ""}`.toUpperCase();

    return (
      <div className="bg-ink-900 border border-sand-50/10 rounded-2xl p-5 hover:border-sand-50/20 transition-all shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-turq-500/10 border border-turq-500/20 text-turq-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/dashboard/patients/${recall.patient.patientId}`}
                  className="font-semibold text-sand-50 hover:text-turq-400 transition-colors"
                >
                  {patientFullName}
                </Link>
                {isOverdue && (
                  <span className="text-[11px] font-bold bg-red-900/30 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    {days}d overdue
                  </span>
                )}
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    recall.status === "due"
                      ? "bg-amber-900/30 text-amber-400 border border-amber-500/20"
                      : "bg-turq-600/20 text-turq-400 border border-turq-500/20"
                  }`}
                >
                  {recall.status}
                </span>
              </div>
              <p className="text-xs text-sand-50/70 mt-1">
                Reason: <span className="text-sand-50 font-semibold">{recall.reason}</span> · Due {fmtDate(recall.dueDate)}
                {recall.dentist && ` · Dr. ${recall.dentist.person.lastName}`}
              </p>
              {recall.notes && (
                <p className="text-xs text-sand-50/45 italic mt-1">
                  Note: {recall.notes}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center gap-1.5 text-xs bg-ink-950 hover:bg-sand-50/10 text-sand-50/90 border border-sand-50/10 px-3 py-1.5 rounded-lg font-medium transition-colors"
                title={`Call ${patientFullName}`}
              >
                <Phone className="h-3 w-3 text-turq-400" />
                <span>{phone}</span>
              </a>
            )}
            <Link
              href={`/dashboard/book?patientId=${recall.patient.patientId}`}
              className="inline-flex items-center gap-1.5 text-xs bg-turq-500 hover:bg-turq-400 text-ink-950 px-3 py-1.5 rounded-lg font-bold transition-all shadow-sm"
            >
              <Calendar className="h-3.5 w-3.5" /> Book Now
            </Link>
            <EditRecallModal
              recall={{
                recallId: recall.recallId,
                reason: recall.reason,
                dueDate: recall.dueDate.toISOString().slice(0, 10),
                notes: recall.notes,
              }}
            />
            <DeleteRecallButton
              recallId={recall.recallId}
              patientName={patientFullName}
            />
          </div>
        </div>

        {/* Quick status & call log bar */}
        <div className="pt-3 border-t border-sand-50/5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-sand-50/40 text-[11px]">Mark as:</span>
            {recall.status !== "scheduled" && (
              <form action={updateRecallStatus}>
                <input type="hidden" name="recallId" value={recall.recallId} />
                <input type="hidden" name="status" value="scheduled" />
                <button
                  type="submit"
                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-sand-50/5 hover:bg-turq-500/10 text-sand-50/70 hover:text-turq-300 border border-sand-50/10 transition-colors cursor-pointer"
                >
                  Scheduled
                </button>
              </form>
            )}
            <form action={updateRecallStatus}>
              <input type="hidden" name="recallId" value={recall.recallId} />
              <input type="hidden" name="status" value="completed" />
              <button
                type="submit"
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-sand-50/5 hover:bg-emerald-500/10 text-sand-50/70 hover:text-emerald-300 border border-sand-50/10 transition-colors cursor-pointer"
              >
                Completed
              </button>
            </form>
            <form action={updateRecallStatus}>
              <input type="hidden" name="recallId" value={recall.recallId} />
              <input type="hidden" name="status" value="cancelled" />
              <button
                type="submit"
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-sand-50/5 hover:bg-red-500/10 text-sand-50/40 hover:text-red-400 border border-sand-50/10 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </form>
          </div>

          {/* Quick Call Log */}
          <form action={addRecallCallLog} className="flex items-center gap-2">
            <input type="hidden" name="recallId" value={recall.recallId} />
            <input
              type="text"
              name="notes"
              placeholder="Quick call note..."
              className="px-2.5 py-1 text-xs bg-ink-950 border border-sand-50/10 rounded-lg text-sand-50 placeholder:text-sand-50/30 focus:outline-none focus:border-turq-500"
            />
            <SubmitButton
              pendingText="Logging..."
              className="px-2.5 py-1 text-[11px] font-semibold bg-sand-50/10 hover:bg-sand-50/20 text-sand-50 rounded-lg transition-colors"
            >
              Log Call
            </SubmitButton>
          </form>
        </div>

        {/* Previous Call Logs */}
        {recall.callLogs.length > 0 && (
          <div className="pt-2 border-t border-sand-50/5 flex flex-wrap gap-2">
            {recall.callLogs.map((log) => (
              <span
                key={log.logId}
                className="text-[10px] bg-sand-50/5 border border-sand-50/5 rounded px-2 py-0.5 text-sand-50/50"
              >
                Called {fmtDate(log.calledAt)}: {log.notes || "Call logged"}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <AdminPageHeader
        section="Operations"
        title="Recalls & Follow-ups"
        subtitle="Automated post-treatment recalls, hygiene maintenance, and patient re-engagement"
      />

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-ink-900 border border-sand-50/10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-red-400/80 font-medium">Overdue Recalls</p>
            <p className="text-2xl font-bold font-display text-red-400 mt-1">{overdue.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-red-500/10 text-red-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-ink-900 border border-sand-50/10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-sand-50/40 font-medium">Upcoming Recalls</p>
            <p className="text-2xl font-bold font-display text-turq-400 mt-1">{upcoming.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-turq-500/10 text-turq-400">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-ink-900 border border-sand-50/10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-sand-50/40 font-medium">Scheduled Patients</p>
            <p className="text-2xl font-bold font-display text-sand-50 mt-1">{scheduledCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-sand-50/5 text-sand-50/60">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-ink-900 border border-sand-50/10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-sand-50/40 font-medium">Total In Queue</p>
            <p className="text-2xl font-bold font-display text-sand-50 mt-1">{recalls.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-sand-50/5 text-sand-50/60">
            <RefreshCw className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Add Recall Form */}
      <AddRecallForm patients={patients} dentists={dentists} />

      {/* Recalls List */}
      {overdue.length === 0 && upcoming.length === 0 ? (
        <div className="text-center py-16 px-4 bg-ink-900 border border-dashed border-sand-50/10 rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-sand-50/5 border border-sand-50/10 flex items-center justify-center mx-auto mb-3 text-sand-50/30">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
          </div>
          <p className="text-sm font-semibold text-sand-50">All patient recalls are up to date</p>
          <p className="text-xs text-sand-50/40 max-w-md mx-auto mt-1">
            No overdue or pending recalls. You can schedule a new follow-up using the button above.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {overdue.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <span>Overdue Recalls ({overdue.length})</span>
              </div>
              <div className="space-y-3">
                {overdue.map((r) => (
                  <RecallCard key={r.recallId} recall={r} />
                ))}
              </div>
            </div>
          )}

          {upcoming.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sand-50/60">
                <span className="w-2 h-2 rounded-full bg-turq-400" />
                <span>Upcoming Recalls ({upcoming.length})</span>
              </div>
              <div className="space-y-3">
                {upcoming.map((r) => (
                  <RecallCard key={r.recallId} recall={r} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

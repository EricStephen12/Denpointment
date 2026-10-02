import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isReceptionist, isAdmin } from "@/lib/auth";
import { updateRecallStatus, addRecallCallLog } from "@/app/actions/clinical-care";
import { RefreshCw, Calendar, Phone, Info, CheckCircle2, Clock, Trash2, Pencil, HelpCircle } from "lucide-react";
import ClinicWorkflowTracker from "@/components/dashboard/ClinicWorkflowTracker";
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

    return (
      <div className="dash-surface p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/dashboard/patients/${recall.patient.patientId}`}
                className="font-semibold text-sand-50 hover:text-turq-400 transition-colors"
              >
                {patientFullName}
              </Link>
              {isOverdue && (
                <span className="text-[11px] font-medium bg-red-900/30 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
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
            <p className="text-xs text-sand-50/60 mt-1">
              Reason: <span className="text-sand-50/90 font-medium">{recall.reason}</span> · Due {fmtDate(recall.dueDate)}
              {recall.dentist && ` · Dr. ${recall.dentist.person.lastName}`}
            </p>
            {recall.notes && (
              <p className="text-xs text-sand-50/45 italic mt-1">
                Note: {recall.notes}
              </p>
            )}
            {phone && (
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center gap-1 text-xs text-sand-50/40 hover:text-turq-400 mt-1 transition-colors"
              >
                <Phone className="h-3 w-3" /> {phone}
              </a>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* 1. Book Now */}
            <Link
              href={`/dashboard/book?patientId=${recall.patient.patientId}`}
              className="inline-flex items-center gap-1.5 text-xs bg-turq-600 hover:bg-turq-500 text-ink-950 px-3 py-1.5 rounded-lg font-semibold transition-colors shadow-sm"
            >
              <Calendar className="h-3.5 w-3.5" /> Book Now
            </Link>

            {/* 2. Edit Modal */}
            <EditRecallModal
              recall={{
                recallId: recall.recallId,
                reason: recall.reason,
                dueDate: recall.dueDate,
                notes: recall.notes,
              }}
            />

            {/* 3. Mark Done */}
            <form action={updateRecallStatus}>
              <input type="hidden" name="recallId" value={recall.recallId} />
              <input type="hidden" name="status" value="completed" />
              <SubmitButton
                pendingText="Updating..."
                className="inline-flex items-center gap-1 text-xs border border-turq-500/20 text-turq-400/80 hover:text-turq-400 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer hover:bg-turq-500/10"
              >
                Mark Done
              </SubmitButton>
            </form>

            {/* 4. Cancel Recall */}
            <form action={updateRecallStatus}>
              <input type="hidden" name="recallId" value={recall.recallId} />
              <input type="hidden" name="status" value="cancelled" />
              <SubmitButton
                pendingText="Cancelling..."
                className="text-xs text-sand-50/30 hover:text-sand-50/70 px-2 py-1.5 transition-colors cursor-pointer"
              >
                Cancel
              </SubmitButton>
            </form>

            {/* 5. Delete Recall */}
            <DeleteRecallButton
              recallId={recall.recallId}
              patientName={patientFullName}
              reason={recall.reason}
            />
          </div>
        </div>

        {/* Call log history */}
        {recall.callLogs.length > 0 && (
          <div className="pt-3 border-t border-sand-50/8">
            <p className="text-[10px] uppercase tracking-wider text-sand-50/30 mb-2 font-medium">
              Call attempts ({recall.callLogs.length})
            </p>
            <ul className="space-y-1">
              {recall.callLogs.map((log) => (
                <li key={log.logId} className="text-xs text-sand-50/50 flex items-baseline gap-2">
                  <span className="text-sand-50/30 shrink-0 font-mono text-[11px]">
                    {new Date(log.calledAt).toLocaleDateString()}
                  </span>
                  <span className="text-sand-50/80 font-medium">{log.outcome}</span>
                  {log.notes && <span className="text-sand-50/40">— {log.notes}</span>}
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
          <SubmitButton
            pendingText="Logging..."
            className="text-xs bg-sand-50/10 hover:bg-sand-50/15 text-sand-50 px-3 py-1.5 rounded-lg transition-colors shrink-0 cursor-pointer"
          >
            Log Call
          </SubmitButton>
        </form>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── 1. WORKFLOW TRACKER BANNER (STEP 5: RECALLS & FOLLOW-UP) ── */}
      <ClinicWorkflowTracker
        currentStep={5}
        counts={{
          recallsDue: overdue.length + upcoming.length,
        }}
      />

      {/* ── 2. HEADER & EDUCATIONAL GUIDE ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="dash-icon-badge">
            <RefreshCw className="h-5 w-5 text-turq-400" />
          </div>
          <div>
            <h1 className="dash-title font-display">Recall &amp; Follow-up List</h1>
            <p className="dash-body mt-0.5">
              {overdue.length} overdue · {upcoming.length} upcoming
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. HOW THE RECALL LIST WORKS (EXPLAINER BANNER) ── */}
      <div className="p-4 rounded-2xl bg-turq-500/[0.04] border border-turq-500/15 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-turq-300">
          <Info className="h-4 w-4 shrink-0 text-turq-400" />
          <span>How the Recall System Works in Your Dental Clinic</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-sand-50/70">
          <div className="bg-sand-50/[0.02] p-3 rounded-xl border border-sand-50/5 space-y-1">
            <p className="font-medium text-sand-50 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-turq-400" /> 1. Scheduled Follow-ups
            </p>
            <p className="text-sand-50/50 leading-relaxed">
              When patients finish treatments or routine exams, dentists or receptionists schedule their next checkup (e.g., 6-month cleaning, 3-month perio check, suture removal).
            </p>
          </div>
          <div className="bg-sand-50/[0.02] p-3 rounded-xl border border-sand-50/5 space-y-1">
            <p className="font-medium text-sand-50 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-amber-400" /> 2. Automatic Due Queue
            </p>
            <p className="text-sand-50/50 leading-relaxed">
              When the recall date arrives, patients appear here automatically. Front desk calls the patient, logs the call attempt, or clicks <strong>Book Now</strong>.
            </p>
          </div>
          <div className="bg-sand-50/[0.02] p-3 rounded-xl border border-sand-50/5 space-y-1">
            <p className="font-medium text-sand-50 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> 3. Add, Edit &amp; Delete
            </p>
            <p className="text-sand-50/50 leading-relaxed">
              Use <strong>New Recall</strong> above to schedule follow-ups anytime. Use <strong>Edit</strong> to change dates/reasons, or the <strong>Trash</strong> icon to remove erroneous entries.
            </p>
          </div>
        </div>
      </div>

      {/* ── 4. ADD RECALL FORM (COLLAPSIBLE CLIENT COMPONENT) ── */}
      <AddRecallForm patients={patients} dentists={dentists} />

      {/* ── 5. RECALLS LIST (OVERDUE & UPCOMING) ── */}
      {overdue.length === 0 && upcoming.length === 0 ? (
        <div className="text-center py-16 text-sand-50/35 border border-dashed border-sand-50/10 rounded-2xl space-y-2">
          <p className="text-sm font-medium text-sand-50/60">No active recalls in queue</p>
          <p className="text-xs max-w-md mx-auto text-sand-50/40">
            All patients are up to date! You can schedule a new recall using the form above or directly from any patient's clinical file.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {overdue.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-red-400/80 font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Overdue Recalls — {overdue.length} patient{overdue.length !== 1 ? "s" : ""}
              </p>
              <div className="space-y-3">
                {overdue.map((r) => <RecallCard key={r.recallId} recall={r} />)}
              </div>
            </div>
          )}
          {upcoming.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-sand-50/45 font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-turq-400" />
                Upcoming Recalls — {upcoming.length} patient{upcoming.length !== 1 ? "s" : ""}
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

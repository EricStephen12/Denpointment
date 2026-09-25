import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isDentist, isAdmin } from "@/lib/auth";
import { updateLabCaseStatus } from "@/app/actions/clinical-care";
import { FlaskConical } from "lucide-react";

const STATUS_ORDER = ["sent", "in_lab", "received", "fitted", "cancelled"];
const STATUS_TONE: Record<string, string> = {
  sent:      "bg-amber-900/30 text-amber-400 border-amber-500/20",
  in_lab:    "bg-sky-900/30 text-sky-400 border-sky-500/20",
  received:  "bg-turq-600/20 text-turq-400 border-turq-500/20",
  fitted:    "bg-emerald-900/30 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-sand-50/8 text-sand-50/30 border-sand-50/10",
};

export default async function LabCasesPage() {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isDentist(dbUser) && !isAdmin(dbUser)) redirect("/dashboard");

  const isDoc = isDentist(dbUser);
  const dentistId = isDoc ? dbUser.dentists[0].dentistId : undefined;

  const labCases = await prisma.labCase.findMany({
    where: dentistId ? { dentistId } : {},
    include: {
      patient: { include: { person: true } },
      dentist: { include: { person: true } },
    },
    orderBy: { sentAt: "desc" },
  });

  const open   = labCases.filter((l) => !["fitted","cancelled"].includes(l.status));
  const closed = labCases.filter((l) =>  ["fitted","cancelled"].includes(l.status));

  function fmtDate(d: Date | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  }

  const LabCard = ({ lc }: { lc: typeof labCases[0] }) => (
    <div className="dash-surface p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/dashboard/patients/${lc.patient.patientId}`}
            className="font-semibold text-sand-50 hover:text-turq-400 transition-colors">
            {lc.patient.person.firstName} {lc.patient.person.lastName}
          </Link>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${STATUS_TONE[lc.status] ?? ""}`}>
            {lc.status.replace("_", " ")}
          </span>
        </div>
        <p className="text-xs text-sand-50/50 mt-1">
          {lc.labName} · {lc.itemDescription}
          {lc.toothNumber ? ` · Tooth #${lc.toothNumber}` : ""}
        </p>
        <p className="text-[10px] text-sand-50/30 mt-0.5">
          Sent {fmtDate(lc.sentAt)} · Due {fmtDate(lc.dueDate)}
          {!isDoc && ` · Dr. ${lc.dentist.person.lastName}`}
        </p>
        {lc.notes && <p className="text-xs text-sand-50/30 mt-0.5">{lc.notes}</p>}
      </div>
      {isDoc && (
        <form action={updateLabCaseStatus} className="shrink-0">
          <input type="hidden" name="labCaseId" value={lc.labCaseId} />
          <select
            name="status"
            defaultValue={lc.status}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="dash-input text-xs py-1 w-auto"
          >
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>{s.replace("_", " ")}</option>
            ))}
          </select>
        </form>
      )}
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="dash-icon-badge">
          <FlaskConical className="h-5 w-5 text-turq-400" />
        </div>
        <div>
          <h1 className="dash-title font-display">Lab Cases</h1>
          <p className="dash-body mt-0.5">{open.length} open · {closed.length} completed</p>
        </div>
      </div>

      {labCases.length === 0 ? (
        <div className="text-center py-16 text-sand-50/30 border border-dashed border-sand-50/10 rounded-2xl">
          No lab cases. Create them from the patient record → Labs tab.
        </div>
      ) : (
        <div className="space-y-8">
          {open.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-sand-50/35 font-semibold mb-3">Open Cases</p>
              <div className="space-y-3">{open.map((lc) => <LabCard key={lc.labCaseId} lc={lc} />)}</div>
            </div>
          )}
          {closed.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-sand-50/25 font-semibold mb-3">Completed / Cancelled</p>
              <div className="space-y-3 opacity-60">{closed.map((lc) => <LabCard key={lc.labCaseId} lc={lc} />)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

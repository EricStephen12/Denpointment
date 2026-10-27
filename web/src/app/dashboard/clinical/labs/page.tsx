import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isDentist, isAdmin } from "@/lib/auth";
import { addLabCase, updateLabCase } from "@/app/actions/clinical-care";
import DeleteLabCaseButton from "@/components/clinical/DeleteLabCaseButton";
import LabStatusSelect from "@/components/clinical/LabStatusSelect";
import SubmitButton from "@/components/common/SubmitButton";
import { FlaskConical, Plus } from "lucide-react";

import AdminPageHeader from "@/components/admin/AdminPageHeader";

const STATUS_ORDER = ["sent", "in_lab", "received", "fitted", "cancelled"];
const STATUS_TONE: Record<string, string> = {
  sent:      "bg-amber-500/10 text-amber-300 border-amber-500/20",
  in_lab:    "bg-sky-500/10 text-sky-300 border-sky-500/20",
  received:  "bg-turq-500/10 text-turq-300 border-turq-500/20",
  fitted:    "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  cancelled: "bg-sand-50/5 text-sand-50/40 border-sand-50/10",
};

export default async function LabCasesPage() {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isDentist(dbUser) && !isAdmin(dbUser)) redirect("/dashboard");

  const isDoc = isDentist(dbUser);
  const isAdministrator = isAdmin(dbUser);
  const canManage = isDoc || isAdministrator;
  const dentistId = isDoc ? dbUser.dentists[0].dentistId : undefined;

  const [labCases, patients, dentists] = await Promise.all([
    prisma.labCase.findMany({
      where: dentistId ? { dentistId } : {},
      include: {
        patient: { include: { person: true } },
        dentist: { include: { person: true } },
      },
      orderBy: { sentAt: "desc" },
    }),
    canManage
      ? prisma.patient.findMany({
          include: { person: true },
          orderBy: [{ person: { lastName: "asc" } }, { person: { firstName: "asc" } }],
        })
      : [],
    canManage
      ? prisma.dentist.findMany({
          include: { person: true },
          orderBy: [{ person: { lastName: "asc" } }],
        })
      : [],
  ]);

  const open   = labCases.filter((l) => !["fitted","cancelled"].includes(l.status));
  const closed = labCases.filter((l) =>  ["fitted","cancelled"].includes(l.status));

  function fmtDate(d: Date | null) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  }

  const LabCard = ({ lc }: { lc: typeof labCases[0] }) => (
    <div className="dash-surface p-5 rounded-2xl border border-sand-50/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-sand-50/20 transition-all">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href={`/dashboard/patients/${lc.patient.patientId}`}
            className="font-semibold text-sand-50 hover:text-turq-300 transition-colors"
          >
            {lc.patient.person.firstName} {lc.patient.person.lastName}
          </Link>
          <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${STATUS_TONE[lc.status] ?? ""}`}>
            {lc.status.replace("_", " ")}
          </span>
        </div>
        <p className="text-xs text-sand-50/80 mt-1.5 font-medium">
          {lc.labName} · <span className="text-turq-400">{lc.itemDescription}</span>
          {lc.toothNumber ? ` · FDI #${lc.toothNumber}` : ""}
        </p>
        <p className="text-[11px] text-sand-50/40 mt-1">
          Sent: {fmtDate(lc.sentAt)} · Due: {fmtDate(lc.dueDate)} · Prescribing Doctor: Dr. {lc.dentist.person.lastName}
        </p>
        {lc.notes && (
          <p className="text-xs text-sand-50/50 mt-1.5 italic bg-white/[0.02] p-2 rounded-lg border border-sand-50/5">
            "{lc.notes}"
          </p>
        )}
      </div>
      {canManage && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <LabStatusSelect labCaseId={lc.labCaseId} status={lc.status} statusOrder={STATUS_ORDER} />
          <details className="relative">
            <summary className="cursor-pointer list-none rounded-xl border border-sand-50/15 px-3 py-1.5 text-xs text-sand-50/70 hover:text-sand-50 bg-white/[0.02] transition-colors">
              Edit
            </summary>
            <form action={updateLabCase} className="absolute right-0 z-20 mt-2 grid w-80 gap-3 rounded-2xl border border-sand-50/15 bg-ink-950 p-5 shadow-2xl">
              <input type="hidden" name="labCaseId" value={lc.labCaseId} />
              <label className="grid gap-1 text-xs text-sand-50/60">Laboratory
                <input name="labName" required maxLength={80} defaultValue={lc.labName} className="dash-input text-xs" />
              </label>
              <label className="grid gap-1 text-xs text-sand-50/60">Item
                <input name="itemDescription" required maxLength={200} defaultValue={lc.itemDescription} className="dash-input text-xs" />
              </label>
              <label className="grid gap-1 text-xs text-sand-50/60">Tooth Number
                <input name="toothNumber" type="number" min={11} max={85} defaultValue={lc.toothNumber ?? ""} className="dash-input text-xs" />
              </label>
              <label className="grid gap-1 text-xs text-sand-50/60">Due date
                <input name="dueDate" type="date" defaultValue={lc.dueDate?.toISOString().slice(0, 10) ?? ""} className="dash-input text-xs" />
              </label>
              <label className="grid gap-1 text-xs text-sand-50/60">Notes & Shade
                <input name="notes" maxLength={200} defaultValue={lc.notes ?? ""} className="dash-input text-xs" />
              </label>
              <SubmitButton pendingText="Saving..." className="rounded-xl bg-turq-500 hover:bg-turq-400 px-3 py-2 text-xs font-semibold text-ink-950 transition-colors">
                Save changes
              </SubmitButton>
            </form>
          </details>
          <DeleteLabCaseButton
            labCaseId={lc.labCaseId}
            caseTitle={`${lc.itemDescription} (${lc.labName})`}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        section="Clinical"
        title="Dental Lab Cases"
        description="Track external laboratory fabrication of crowns, bridges, dentures, retainers, and veneers."
      />

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="dash-surface p-5 rounded-2xl border border-sand-50/10 flex flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-400/80">
            Active in Fabrication
          </span>
          <div className="mt-2">
            <p className="text-2xl font-bold font-display text-sky-400 tabular-nums">
              {open.length}
            </p>
            <p className="text-xs text-sand-50/40 mt-1">Cases sent or in progress</p>
          </div>
        </div>

        <div className="dash-surface p-5 rounded-2xl border border-sand-50/10 flex flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400/80">
            Fitted & Completed
          </span>
          <div className="mt-2">
            <p className="text-2xl font-bold font-display text-emerald-400 tabular-nums">
              {closed.filter((c) => c.status === "fitted").length}
            </p>
            <p className="text-xs text-sand-50/40 mt-1">Successfully delivered prosthetics</p>
          </div>
        </div>

        <div className="dash-surface p-5 rounded-2xl border border-sand-50/10 flex flex-col justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-sand-50/40">
            Total Cases Tracked
          </span>
          <div className="mt-2">
            <p className="text-2xl font-bold font-display text-sand-50 tabular-nums">
              {labCases.length}
            </p>
            <p className="text-xs text-sand-50/40 mt-1">Clinic lifetime prosthetic orders</p>
          </div>
        </div>
      </div>

      {canManage && (
        <details className="dash-surface rounded-2xl border border-sand-50/10 p-5 group shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold text-sand-50">
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-turq-400" />
              <span>Send New Lab Case</span>
            </span>
            <span className="text-[11px] text-turq-400 font-medium group-open:hidden">
              + Open Form
            </span>
            <span className="text-[11px] text-sand-50/40 font-medium hidden group-open:inline">
              Close Form
            </span>
          </summary>
          <form action={addLabCase} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 pt-4 border-t border-sand-50/10">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-sand-50/50 mb-1">
                Patient *
              </label>
              <select name="patientId" required defaultValue="" className="dash-input text-xs">
                <option value="" disabled>Select patient</option>
                {patients.map((patient) => (
                  <option key={patient.patientId} value={patient.patientId}>
                    {patient.person.lastName}, {patient.person.firstName}
                  </option>
                ))}
              </select>
            </div>
            {isAdministrator && dentists.length > 0 && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-sand-50/50 mb-1">
                  Prescribing Doctor
                </label>
                <select name="dentistId" defaultValue={dentists[0]?.dentistId} className="dash-input text-xs">
                  {dentists.map((d) => (
                    <option key={d.dentistId} value={d.dentistId}>
                      Dr. {d.person.firstName} {d.person.lastName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-sand-50/50 mb-1">
                Dental Laboratory Name *
              </label>
              <input name="labName" required maxLength={80} placeholder="e.g. Apex Dental Lab" className="dash-input text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-sand-50/50 mb-1">
                Prosthetic Item *
              </label>
              <input name="itemDescription" required maxLength={200} placeholder="e.g. Zirconia Crown, Upper Denture" className="dash-input text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-sand-50/50 mb-1">
                Tooth Number (optional)
              </label>
              <input name="toothNumber" type="number" min={11} max={85} placeholder="FDI # (e.g. 11, 26, 46)" className="dash-input text-xs" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-sand-50/50 mb-1">
                Expected Delivery Date
              </label>
              <input name="dueDate" type="date" className="dash-input text-xs" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-sand-50/50 mb-1">
                Lab Instructions & Shade
              </label>
              <input name="notes" maxLength={200} placeholder="e.g. Shade A2, high translucency" className="dash-input text-xs" />
            </div>
            <div className="sm:col-span-2 pt-2">
              <SubmitButton
                pendingText="Sending..."
                className="bg-turq-500 hover:bg-turq-400 text-ink-950 px-5 py-2.5 rounded-xl font-semibold text-xs transition-colors shadow-sm"
              >
                Save Lab Case
              </SubmitButton>
            </div>
          </form>
        </details>
      )}

      {labCases.length === 0 ? (
        <div className="text-center py-16 text-sand-50/30 border border-dashed border-sand-50/10 rounded-2xl">
          No lab cases recorded yet.
        </div>
      ) : (
        <div className="space-y-6">
          {open.length > 0 && (
            <div className="space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-sand-50/40">
                Active Cases ({open.length})
              </span>
              <div className="space-y-3">{open.map((lc) => <LabCard key={lc.labCaseId} lc={lc} />)}</div>
            </div>
          )}
          {closed.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-sand-50/10">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-sand-50/30">
                Completed &amp; Cancelled ({closed.length})
              </span>
              <div className="space-y-3 opacity-60">{closed.map((lc) => <LabCard key={lc.labCaseId} lc={lc} />)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

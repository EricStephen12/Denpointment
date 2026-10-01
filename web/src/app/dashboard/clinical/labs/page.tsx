import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isDentist, isAdmin } from "@/lib/auth";
import { addLabCase, updateLabCase, updateLabCaseStatus } from "@/app/actions/clinical-care";
import DeleteLabCaseButton from "@/components/clinical/DeleteLabCaseButton";
import { FlaskConical, Plus } from "lucide-react";

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
        <p className="text-xs text-sand-50/70 mt-1">
          {lc.labName} · <strong className="text-sand-50">{lc.itemDescription}</strong>
          {lc.toothNumber ? ` · Tooth #${lc.toothNumber}` : ""}
        </p>
        <p className="text-[11px] text-sand-50/40 mt-0.5">
          Sent: {fmtDate(lc.sentAt)} · Due: {fmtDate(lc.dueDate)} · Prescribing Doctor: Dr. {lc.dentist.person.lastName}
        </p>
        {lc.notes && <p className="text-xs text-sand-50/40 mt-1 italic">{lc.notes}</p>}
      </div>
      {canManage && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <form action={updateLabCaseStatus}>
            <input type="hidden" name="labCaseId" value={lc.labCaseId} />
            <label className="sr-only" htmlFor={`lab-status-${lc.labCaseId}`}>Case status</label>
            <select
              id={`lab-status-${lc.labCaseId}`}
              name="status"
              defaultValue={lc.status}
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
              className="dash-input text-xs py-1.5 w-auto"
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>{s.replace("_", " ")}</option>
              ))}
            </select>
          </form>
          <details className="relative">
            <summary className="cursor-pointer list-none rounded-lg border border-sand-50/10 px-3 py-1.5 text-xs text-sand-50/70 hover:text-sand-50 bg-sand-50/5">Edit</summary>
            <form action={updateLabCase} className="absolute right-0 z-20 mt-2 grid w-72 gap-2 rounded-lg border border-sand-50/15 bg-ink-900 p-4 shadow-xl">
              <input type="hidden" name="labCaseId" value={lc.labCaseId} />
              <label className="grid gap-1 text-xs text-sand-50/60">Laboratory
                <input name="labName" required maxLength={80} defaultValue={lc.labName} className="dash-input" />
              </label>
              <label className="grid gap-1 text-xs text-sand-50/60">Item
                <input name="itemDescription" required maxLength={200} defaultValue={lc.itemDescription} className="dash-input" />
              </label>
              <label className="grid gap-1 text-xs text-sand-50/60">Tooth
                <input name="toothNumber" type="number" min={11} max={85} defaultValue={lc.toothNumber ?? ""} className="dash-input" />
              </label>
              <label className="grid gap-1 text-xs text-sand-50/60">Due date
                <input name="dueDate" type="date" defaultValue={lc.dueDate?.toISOString().slice(0, 10) ?? ""} className="dash-input" />
              </label>
              <label className="grid gap-1 text-xs text-sand-50/60">Notes
                <input name="notes" maxLength={200} defaultValue={lc.notes ?? ""} className="dash-input" />
              </label>
              <button type="submit" className="rounded-lg bg-turq-600 px-3 py-2 text-sm font-semibold text-ink-950">Save changes</button>
            </form>
          </details>
          <DeleteLabCaseButton labCaseId={lc.labCaseId} />
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="dash-icon-badge">
          <FlaskConical className="h-5 w-5 text-turq-400" />
        </div>
        <div>
          <h1 className="dash-title font-display">Dental Lab Cases</h1>
          <p className="dash-body mt-0.5">{open.length} active in lab · {closed.length} completed / fitted</p>
        </div>
      </div>

      {/* Educational Banner */}
      <div className="dash-surface p-4 mb-6 border border-turq-500/20 bg-turq-500/5 rounded-2xl">
        <h2 className="text-sm font-semibold text-sand-50 flex items-center gap-2">
          💡 What are Dental Lab Cases?
        </h2>
        <p className="text-xs text-sand-50/70 mt-1 leading-relaxed">
          Dental clinics send physical impressions or digital scans to specialized external dental laboratories to fabricate custom prosthetics (such as <strong className="text-sand-50">crowns, bridges, full/partial dentures, retainers, and veneers</strong>).
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">1. Sent to Lab</span>
          <span className="text-sand-50/30">→</span>
          <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">2. In Lab Fabrication</span>
          <span className="text-sand-50/30">→</span>
          <span className="px-2 py-0.5 rounded bg-turq-500/10 text-turq-300 border border-turq-500/20">3. Received at Clinic</span>
          <span className="text-sand-50/30">→</span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">4. Fitted in Patient Mouth</span>
        </div>
      </div>

      {canManage && (
        <details className="dash-surface mb-8 rounded-lg p-5">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-sand-50">
            <Plus className="h-4 w-4 text-turq-400" /> Send new lab case
          </summary>
          <form action={addLabCase} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs text-sand-50/60 sm:col-span-2">Patient
              <select name="patientId" required defaultValue="" className="dash-input">
                <option value="" disabled>Select patient</option>
                {patients.map((patient) => (
                  <option key={patient.patientId} value={patient.patientId}>
                    {patient.person.lastName}, {patient.person.firstName}
                  </option>
                ))}
              </select>
            </label>
            {isAdministrator && dentists.length > 0 && (
              <label className="grid gap-1 text-xs text-sand-50/60 sm:col-span-2">Dentist
                <select name="dentistId" defaultValue={dentists[0]?.dentistId} className="dash-input">
                  {dentists.map((d) => (
                    <option key={d.dentistId} value={d.dentistId}>
                      Dr. {d.person.firstName} {d.person.lastName}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="grid gap-1 text-xs text-sand-50/60">Dental Laboratory Name
              <input name="labName" required maxLength={80} placeholder="e.g. Apex Dental Lab" className="dash-input" />
            </label>
            <label className="grid gap-1 text-xs text-sand-50/60">Prosthetic Item
              <input name="itemDescription" required maxLength={200} placeholder="e.g. Zirconia Crown, Upper Denture" className="dash-input" />
            </label>
            <label className="grid gap-1 text-xs text-sand-50/60">Tooth Number (optional)
              <input name="toothNumber" type="number" min={11} max={85} placeholder="FDI # (e.g. 11, 26, 46)" className="dash-input" />
            </label>
            <label className="grid gap-1 text-xs text-sand-50/60">Expected Delivery Date
              <input name="dueDate" type="date" className="dash-input" />
            </label>
            <label className="grid gap-1 text-xs text-sand-50/60 sm:col-span-2">Lab Instructions &amp; Shade
              <input name="notes" maxLength={200} placeholder="e.g. Shade A2, high translucency" className="dash-input" />
            </label>
            <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg bg-turq-600 px-4 py-2.5 text-sm font-semibold text-ink-950 hover:bg-turq-500 sm:col-span-2">
              <Plus className="h-4 w-4" /> Save Lab Case
            </button>
          </form>
        </details>
      )}

      {labCases.length === 0 ? (
        <div className="text-center py-16 text-sand-50/30 border border-dashed border-sand-50/10 rounded-2xl">
          No lab cases yet.
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

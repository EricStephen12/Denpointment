"use client";

import { useState, useTransition } from "react";
import type {
  ConsentStatus,
  LabCaseStatus,
  PlanItemStatus,
  RecallStatus,
} from "@prisma/client";
import { formatNaira } from "@/lib/currency";
import {
  addAllergy,
  addConsent,
  addInsurance,
  addLabCase,
  addMedicalNote,
  addPlanItem,
  addRecall,
  createTreatmentPlan,
  deactivateInsurance,
  deleteAllergy,
  updateConsentStatus,
  updateLabCaseStatus,
  updatePlanItemStatus,
  updateRecallStatus,
  upsertPerioReading,
} from "@/app/actions/clinical-care";

export type ClinicalCareData = {
  allergies: {
    allergyId: number;
    name: string;
    severity: string | null;
    notes: string | null;
  }[];
  medicalNotes: {
    noteId: number;
    body: string;
    recordedAt: string;
  }[];
  treatmentPlans: {
    planId: number;
    title: string;
    notes: string | null;
    items: {
      itemId: number;
      description: string;
      toothNumber: number | null;
      surfaces: string | null;
      estimatedCharge: number | null;
      status: PlanItemStatus;
    }[];
  }[];
  perioReadings: {
    readingId: number;
    toothNumber: number;
    pocketMm: number | null;
    bleeding: boolean;
    mobility: number;
    notes: string | null;
  }[];
  consents: {
    consentId: number;
    title: string;
    summary: string | null;
    status: ConsentStatus;
    signedByName: string | null;
    signedAt: string | null;
  }[];
  recalls: {
    recallId: number;
    reason: string;
    dueDate: string;
    status: RecallStatus;
    notes: string | null;
  }[];
  insurancePolicies: {
    insuranceId: number;
    provider: string;
    policyNumber: string;
    memberId: string | null;
    groupNumber: string | null;
    notes: string | null;
    active: boolean;
  }[];
  labCases: {
    labCaseId: number;
    labName: string;
    itemDescription: string;
    toothNumber: number | null;
    dueDate: string | null;
    status: LabCaseStatus;
    notes: string | null;
  }[];
};

type Tab =
  | "history"
  | "plans"
  | "perio"
  | "consents"
  | "recalls"
  | "insurance"
  | "labs";

const TABS: { id: Tab; label: string }[] = [
  { id: "history", label: "History" },
  { id: "plans", label: "Treatment plan" },
  { id: "perio", label: "Perio" },
  { id: "consents", label: "Consents" },
  { id: "recalls", label: "Recalls" },
  { id: "insurance", label: "Insurance" },
  { id: "labs", label: "Labs" },
];

type Props = {
  patientId: number;
  canEdit: boolean;
  isDentist: boolean;
  data: ClinicalCareData;
};

export default function ClinicalCarePanel({
  patientId,
  canEdit,
  isDentist,
  data,
}: Props) {
  const [tab, setTab] = useState<Tab>("history");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(
    action: (fd: FormData) => Promise<void>,
    form: HTMLFormElement,
    extra?: Record<string, string>,
  ) {
    const fd = new FormData(form);
    fd.set("patientId", String(patientId));
    if (extra) {
      for (const [k, v] of Object.entries(extra)) fd.set(k, v);
    }
    setError(null);
    startTransition(async () => {
      try {
        await action(fd);
        form.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save.");
      }
    });
  }

  function runFd(action: (fd: FormData) => Promise<void>, fields: Record<string, string>) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) fd.set(k, v);
    setError(null);
    startTransition(async () => {
      try {
        await action(fd);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not update.");
      }
    });
  }

  return (
    <div id="clinical-care" className="dash-surface p-5 space-y-5 scroll-mt-24">
      <div>
        <h2 className="text-sm font-semibold text-sand-50">Clinical care</h2>
        <p className="text-xs text-sand-50/40 mt-1">
          Allergies, treatment plans, perio, consents, recalls, insurance, and lab cases
        </p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-sand-50/10 pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setError(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === t.id
                ? "bg-turq-600 text-ink-950"
                : "text-sand-50/55 hover:bg-sand-50/8"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {tab === "history" && (
        <div className="space-y-6">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-sand-50/40">
              Allergies
            </h3>
            {data.allergies.length === 0 ? (
              <p className="text-sm text-sand-50/40">None recorded.</p>
            ) : (
              <ul className="space-y-2">
                {data.allergies.map((a) => (
                  <li
                    key={a.allergyId}
                    className="flex flex-wrap items-start justify-between gap-2 text-sm text-sand-50/80"
                  >
                    <span>
                      <span className="text-sand-50">{a.name}</span>
                      {a.severity ? ` · ${a.severity}` : ""}
                      {a.notes ? ` — ${a.notes}` : ""}
                    </span>
                    {canEdit && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          runFd(deleteAllergy, { allergyId: String(a.allergyId) })
                        }
                        className="text-xs text-red-400/80 hover:text-red-300"
                      >
                        Remove
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {canEdit && (
              <form
                className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(addAllergy, e.currentTarget);
                }}
              >
                <input name="name" required maxLength={80} placeholder="Allergy" className="dash-input" />
                <input name="severity" maxLength={20} placeholder="Severity" className="dash-input" />
                <input name="notes" maxLength={200} placeholder="Notes" className="dash-input" />
                <button
                  type="submit"
                  disabled={pending}
                  className="sm:col-span-3 bg-turq-600 text-ink-950 py-2 px-3 rounded-lg text-sm font-semibold disabled:opacity-60"
                >
                  Add allergy
                </button>
              </form>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-sand-50/40">
              Medical history notes
            </h3>
            {data.medicalNotes.length === 0 ? (
              <p className="text-sm text-sand-50/40">No notes yet.</p>
            ) : (
              <ul className="space-y-3">
                {data.medicalNotes.map((n) => (
                  <li key={n.noteId} className="text-sm text-sand-50/75">
                    <p className="text-[10px] text-sand-50/35 mb-0.5">
                      {new Date(n.recordedAt).toLocaleString()}
                    </p>
                    <p className="whitespace-pre-wrap">{n.body}</p>
                  </li>
                ))}
              </ul>
            )}
            {canEdit && (
              <form
                className="space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(addMedicalNote, e.currentTarget);
                }}
              >
                <textarea
                  name="body"
                  required
                  rows={3}
                  maxLength={4000}
                  placeholder="Relevant medical history…"
                  className="dash-input resize-y"
                />
                <button
                  type="submit"
                  disabled={pending}
                  className="bg-turq-600 text-ink-950 py-2 px-3 rounded-lg text-sm font-semibold disabled:opacity-60"
                >
                  Add note
                </button>
              </form>
            )}
          </section>
        </div>
      )}

      {tab === "plans" && (
        <div className="space-y-5">
          {data.treatmentPlans.length === 0 ? (
            <p className="text-sm text-sand-50/40">
              No clinical treatment plans yet (proposed procedures — not payment installments).
            </p>
          ) : (
            data.treatmentPlans.map((plan) => (
              <div key={plan.planId} className="space-y-2 border-b border-sand-50/8 pb-4 last:border-0">
                <div>
                  <p className="text-sm font-medium text-sand-50">{plan.title}</p>
                  {plan.notes && (
                    <p className="text-xs text-sand-50/45 mt-0.5 whitespace-pre-wrap">{plan.notes}</p>
                  )}
                </div>
                <ul className="space-y-1.5">
                  {plan.items.map((item) => (
                    <li
                      key={item.itemId}
                      className="flex flex-wrap items-center gap-2 text-sm text-sand-50/75"
                    >
                      <span>
                        {item.toothNumber != null && (
                          <span className="text-turq-300 mr-1">#{item.toothNumber}</span>
                        )}
                        {item.description}
                        {item.surfaces ? ` (${item.surfaces})` : ""}
                        {item.estimatedCharge != null
                          ? ` · ${formatNaira(item.estimatedCharge)}`
                          : ""}
                      </span>
                      {isDentist ? (
                        <select
                          value={item.status}
                          disabled={pending}
                          onChange={(e) =>
                            runFd(updatePlanItemStatus, {
                              itemId: String(item.itemId),
                              status: e.target.value,
                            })
                          }
                          className="dash-input w-auto text-xs py-1"
                        >
                          <option value="planned">Planned</option>
                          <option value="in_progress">In progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      ) : (
                        <span className="text-xs text-sand-50/40 capitalize">
                          {item.status.replace("_", " ")}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                {isDentist && (
                  <form
                    className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1"
                    onSubmit={(e) => {
                      e.preventDefault();
                      run(addPlanItem, e.currentTarget, {
                        planId: String(plan.planId),
                      });
                    }}
                  >
                    <input
                      name="description"
                      required
                      maxLength={200}
                      placeholder="Procedure"
                      className="dash-input sm:col-span-2"
                    />
                    <input
                      name="toothNumber"
                      type="number"
                      min={11}
                      max={85}
                      placeholder="Tooth"
                      className="dash-input"
                    />
                    <input
                      name="estimatedCharge"
                      type="number"
                      min={0}
                      placeholder="Est. ₦"
                      className="dash-input"
                    />
                    <input
                      name="surfaces"
                      maxLength={20}
                      placeholder="Surfaces e.g. MOD"
                      className="dash-input sm:col-span-2"
                    />
                    <button
                      type="submit"
                      disabled={pending}
                      className="sm:col-span-2 bg-turq-600/80 text-ink-950 py-2 px-3 rounded-lg text-sm font-semibold disabled:opacity-60"
                    >
                      Add item
                    </button>
                  </form>
                )}
              </div>
            ))
          )}
          {isDentist && (
            <form
              className="space-y-2 pt-2 border-t border-sand-50/10"
              onSubmit={(e) => {
                e.preventDefault();
                run(createTreatmentPlan, e.currentTarget);
              }}
            >
              <p className="text-xs font-medium text-sand-50/50">New clinical treatment plan</p>
              <input
                name="title"
                required
                maxLength={120}
                placeholder="e.g. Upper right restorations"
                className="dash-input"
              />
              <textarea
                name="notes"
                rows={2}
                maxLength={4000}
                placeholder="Clinical notes (optional)"
                className="dash-input resize-y"
              />
              <button
                type="submit"
                disabled={pending}
                className="bg-turq-600 text-ink-950 py-2 px-3 rounded-lg text-sm font-semibold disabled:opacity-60"
              >
                Create treatment plan
              </button>
            </form>
          )}
        </div>
      )}

      {tab === "perio" && (
        <div className="space-y-4">
          {data.perioReadings.length === 0 ? (
            <p className="text-sm text-sand-50/40">No active perio readings.</p>
          ) : (
            <ul className="space-y-1.5 text-sm text-sand-50/75">
              {data.perioReadings.map((r) => (
                <li key={r.readingId}>
                  <span className="text-turq-300">#{r.toothNumber}</span>
                  {r.pocketMm != null ? ` · ${r.pocketMm} mm` : ""}
                  {r.bleeding ? " · bleeding" : ""}
                  {r.mobility > 0 ? ` · mobility ${r.mobility}` : ""}
                  {r.notes ? ` — ${r.notes}` : ""}
                </li>
              ))}
            </ul>
          )}
          {isDentist && (
            <form
              className="grid grid-cols-2 sm:grid-cols-5 gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                run(upsertPerioReading, e.currentTarget);
              }}
            >
              <input
                name="toothNumber"
                type="number"
                required
                min={11}
                max={85}
                placeholder="Tooth"
                className="dash-input"
              />
              <input
                name="pocketMm"
                type="number"
                min={0}
                max={15}
                placeholder="Pocket mm"
                className="dash-input"
              />
              <input
                name="mobility"
                type="number"
                min={0}
                max={3}
                defaultValue={0}
                placeholder="Mobility"
                className="dash-input"
              />
              <label className="flex items-center gap-2 text-xs text-sand-50/60 px-1">
                <input type="checkbox" name="bleeding" /> Bleeding
              </label>
              <input name="notes" maxLength={200} placeholder="Notes" className="dash-input col-span-2 sm:col-span-3" />
              <button
                type="submit"
                disabled={pending}
                className="col-span-2 sm:col-span-2 bg-turq-600 text-ink-950 py-2 px-3 rounded-lg text-sm font-semibold disabled:opacity-60"
              >
                Save reading
              </button>
            </form>
          )}
        </div>
      )}

      {tab === "consents" && (
        <div className="space-y-4">
          {data.consents.length === 0 ? (
            <p className="text-sm text-sand-50/40">No consent records.</p>
          ) : (
            <ul className="space-y-3">
              {data.consents.map((c) => (
                <li key={c.consentId} className="text-sm space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sand-50 font-medium">{c.title}</span>
                    <span className="text-xs text-sand-50/40 capitalize">{c.status}</span>
                  </div>
                  {c.summary && <p className="text-sand-50/60 text-xs whitespace-pre-wrap">{c.summary}</p>}
                  {c.signedByName && (
                    <p className="text-xs text-sand-50/40">
                      Signed by {c.signedByName}
                      {c.signedAt ? ` · ${new Date(c.signedAt).toLocaleDateString()}` : ""}
                    </p>
                  )}
                  {canEdit && c.status === "pending" && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <input
                        id={`signer-${c.consentId}`}
                        maxLength={80}
                        placeholder="Signed by name"
                        className="dash-input w-40 text-xs"
                      />
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          const el = document.getElementById(
                            `signer-${c.consentId}`,
                          ) as HTMLInputElement | null;
                          runFd(updateConsentStatus, {
                            consentId: String(c.consentId),
                            status: "signed",
                            signedByName: el?.value || "",
                          });
                        }}
                        className="text-xs bg-turq-600 text-ink-950 px-2 py-1 rounded-md font-semibold"
                      >
                        Mark signed
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          runFd(updateConsentStatus, {
                            consentId: String(c.consentId),
                            status: "declined",
                          })
                        }
                        className="text-xs border border-sand-50/20 text-sand-50/60 px-2 py-1 rounded-md"
                      >
                        Declined
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          {canEdit && (
            <form
              className="space-y-2 border-t border-sand-50/10 pt-3"
              onSubmit={(e) => {
                e.preventDefault();
                run(addConsent, e.currentTarget);
              }}
            >
              <input name="title" required maxLength={120} placeholder="Consent title" className="dash-input" />
              <textarea
                name="summary"
                rows={2}
                maxLength={4000}
                placeholder="Summary / procedure explained"
                className="dash-input resize-y"
              />
              <button
                type="submit"
                disabled={pending}
                className="bg-turq-600 text-ink-950 py-2 px-3 rounded-lg text-sm font-semibold disabled:opacity-60"
              >
                Add consent
              </button>
            </form>
          )}
        </div>
      )}

      {tab === "recalls" && (
        <div className="space-y-4">
          {data.recalls.length === 0 ? (
            <p className="text-sm text-sand-50/40">No recalls scheduled.</p>
          ) : (
            <ul className="space-y-2">
              {data.recalls.map((r) => (
                <li
                  key={r.recallId}
                  className="flex flex-wrap items-center gap-2 text-sm text-sand-50/75"
                >
                  <span>
                    {r.reason} · due {r.dueDate.slice(0, 10)}
                    {r.notes ? ` — ${r.notes}` : ""}
                  </span>
                  {canEdit ? (
                    <select
                      value={r.status}
                      disabled={pending}
                      onChange={(e) =>
                        runFd(updateRecallStatus, {
                          recallId: String(r.recallId),
                          status: e.target.value,
                        })
                      }
                      className="dash-input w-auto text-xs py-1"
                    >
                      <option value="due">Due</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  ) : (
                    <span className="text-xs text-sand-50/40 capitalize">{r.status}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {canEdit && (
            <form
              className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-t border-sand-50/10 pt-3"
              onSubmit={(e) => {
                e.preventDefault();
                run(addRecall, e.currentTarget);
              }}
            >
              <input name="reason" required maxLength={120} placeholder="Reason" className="dash-input" />
              <input name="dueDate" type="date" required className="dash-input" />
              <input name="notes" maxLength={200} placeholder="Notes" className="dash-input" />
              <button
                type="submit"
                disabled={pending}
                className="sm:col-span-3 bg-turq-600 text-ink-950 py-2 px-3 rounded-lg text-sm font-semibold disabled:opacity-60"
              >
                Add recall
              </button>
            </form>
          )}
        </div>
      )}

      {tab === "insurance" && (
        <div className="space-y-4">
          {data.insurancePolicies.filter((p) => p.active).length === 0 ? (
            <p className="text-sm text-sand-50/40">No active insurance on file.</p>
          ) : (
            <ul className="space-y-2">
              {data.insurancePolicies
                .filter((p) => p.active)
                .map((p) => (
                  <li
                    key={p.insuranceId}
                    className="flex flex-wrap items-start justify-between gap-2 text-sm text-sand-50/75"
                  >
                    <span>
                      <span className="text-sand-50">{p.provider}</span>
                      {" · "}
                      {p.policyNumber}
                      {p.memberId ? ` · member ${p.memberId}` : ""}
                      {p.groupNumber ? ` · group ${p.groupNumber}` : ""}
                      {p.notes ? ` — ${p.notes}` : ""}
                    </span>
                    {canEdit && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          runFd(deactivateInsurance, {
                            insuranceId: String(p.insuranceId),
                          })
                        }
                        className="text-xs text-sand-50/40 hover:text-red-300"
                      >
                        Deactivate
                      </button>
                    )}
                  </li>
                ))}
            </ul>
          )}
          {canEdit && (
            <form
              className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-sand-50/10 pt-3"
              onSubmit={(e) => {
                e.preventDefault();
                run(addInsurance, e.currentTarget);
              }}
            >
              <input name="provider" required maxLength={80} placeholder="Provider" className="dash-input" />
              <input
                name="policyNumber"
                required
                maxLength={60}
                placeholder="Policy number"
                className="dash-input"
              />
              <input name="memberId" maxLength={60} placeholder="Member ID" className="dash-input" />
              <input name="groupNumber" maxLength={60} placeholder="Group number" className="dash-input" />
              <input name="notes" maxLength={200} placeholder="Notes" className="dash-input sm:col-span-2" />
              <button
                type="submit"
                disabled={pending}
                className="sm:col-span-2 bg-turq-600 text-ink-950 py-2 px-3 rounded-lg text-sm font-semibold disabled:opacity-60"
              >
                Add insurance
              </button>
            </form>
          )}
        </div>
      )}

      {tab === "labs" && (
        <div className="space-y-4">
          {data.labCases.length === 0 ? (
            <p className="text-sm text-sand-50/40">No lab cases.</p>
          ) : (
            <ul className="space-y-2">
              {data.labCases.map((l) => (
                <li
                  key={l.labCaseId}
                  className="flex flex-wrap items-center gap-2 text-sm text-sand-50/75"
                >
                  <span>
                    {l.labName}: {l.itemDescription}
                    {l.toothNumber != null ? ` (#${l.toothNumber})` : ""}
                    {l.dueDate ? ` · due ${l.dueDate.slice(0, 10)}` : ""}
                    {l.notes ? ` — ${l.notes}` : ""}
                  </span>
                  {isDentist ? (
                    <select
                      value={l.status}
                      disabled={pending}
                      onChange={(e) =>
                        runFd(updateLabCaseStatus, {
                          labCaseId: String(l.labCaseId),
                          status: e.target.value,
                        })
                      }
                      className="dash-input w-auto text-xs py-1"
                    >
                      <option value="sent">Sent</option>
                      <option value="in_lab">In lab</option>
                      <option value="received">Received</option>
                      <option value="fitted">Fitted</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  ) : (
                    <span className="text-xs text-sand-50/40 capitalize">
                      {l.status.replace("_", " ")}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {isDentist && (
            <form
              className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-sand-50/10 pt-3"
              onSubmit={(e) => {
                e.preventDefault();
                run(addLabCase, e.currentTarget);
              }}
            >
              <input name="labName" required maxLength={80} placeholder="Lab name" className="dash-input" />
              <input
                name="itemDescription"
                required
                maxLength={200}
                placeholder="Item (e.g. PFM crown)"
                className="dash-input"
              />
              <input
                name="toothNumber"
                type="number"
                min={11}
                max={85}
                placeholder="Tooth"
                className="dash-input"
              />
              <input name="dueDate" type="date" className="dash-input" />
              <input name="notes" maxLength={200} placeholder="Notes" className="dash-input sm:col-span-2" />
              <button
                type="submit"
                disabled={pending}
                className="sm:col-span-2 bg-turq-600 text-ink-950 py-2 px-3 rounded-lg text-sm font-semibold disabled:opacity-60"
              >
                Add lab case
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

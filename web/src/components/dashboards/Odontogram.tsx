"use client";

import { useState, useTransition } from "react";
import type { ToothCondition } from "@prisma/client";
import { clearToothFinding, upsertToothFinding } from "@/app/actions/chart";
import {
  LOWER_LEFT,
  LOWER_RIGHT,
  PRIMARY_LOWER_LEFT,
  PRIMARY_LOWER_RIGHT,
  PRIMARY_UPPER_LEFT,
  PRIMARY_UPPER_RIGHT,
  TOOTH_CONDITIONS,
  UPPER_LEFT,
  UPPER_RIGHT,
  conditionMeta,
} from "@/lib/odontogram";

export type ChartFinding = {
  toothNumber: number;
  condition: ToothCondition;
  notes: string | null;
};

type Props = {
  patientId: number;
  findings: ChartFinding[];
  canEdit: boolean;
};

export default function Odontogram({ patientId, findings, canEdit }: Props) {
  const [dentition, setDentition] = useState<"adult" | "primary">("adult");
  const [selected, setSelected] = useState<number | null>(null);
  const [condition, setCondition] = useState<ToothCondition>("caries");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const byTooth = new Map(findings.map((f) => [f.toothNumber, f]));
  const selectedFinding = selected != null ? byTooth.get(selected) : undefined;

  const arches =
    dentition === "adult"
      ? [
          { label: "Upper right", teeth: UPPER_RIGHT },
          { label: "Upper left", teeth: UPPER_LEFT },
          { label: "Lower left", teeth: LOWER_LEFT },
          { label: "Lower right", teeth: LOWER_RIGHT },
        ]
      : [
          { label: "Upper right (primary)", teeth: PRIMARY_UPPER_RIGHT },
          { label: "Upper left (primary)", teeth: PRIMARY_UPPER_LEFT },
          { label: "Lower left (primary)", teeth: PRIMARY_LOWER_LEFT },
          { label: "Lower right (primary)", teeth: PRIMARY_LOWER_RIGHT },
        ];

  function selectTooth(n: number) {
    setSelected(n);
    setError(null);
    const existing = byTooth.get(n);
    if (existing) {
      setCondition(existing.condition);
      setNotes(existing.notes ?? "");
    } else {
      setCondition("caries");
      setNotes("");
    }
  }

  function run(action: (fd: FormData) => Promise<void>, extra?: Record<string, string>) {
    if (selected == null) return;
    const fd = new FormData();
    fd.set("patientId", String(patientId));
    fd.set("toothNumber", String(selected));
    if (extra) {
      for (const [k, v] of Object.entries(extra)) fd.set(k, v);
    }
    setError(null);
    startTransition(async () => {
      try {
        await action(fd);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not update chart.");
      }
    });
  }

  return (
    <div className="dash-surface p-5 space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-sand-50">Dental chart</h2>
          <p className="text-xs text-sand-50/40 mt-1">
            FDI numbering · tap a tooth to mark condition
          </p>
        </div>
        <div className="flex rounded-lg border border-sand-50/15 overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => {
              setDentition("adult");
              setSelected(null);
            }}
            className={`px-3 py-1.5 ${dentition === "adult" ? "bg-turq-600 text-ink-950" : "text-sand-50/60 hover:bg-sand-50/8"}`}
          >
            Adult
          </button>
          <button
            type="button"
            onClick={() => {
              setDentition("primary");
              setSelected(null);
            }}
            className={`px-3 py-1.5 ${dentition === "primary" ? "bg-turq-600 text-ink-950" : "text-sand-50/60 hover:bg-sand-50/8"}`}
          >
            Kids
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TOOTH_CONDITIONS.filter((c) => c.value !== "healthy").map((c) => (
          <span
            key={c.value}
            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] border ${c.color}`}
          >
            {c.short} {c.label}
          </span>
        ))}
      </div>

      <div className="space-y-3 select-none">
        {arches.slice(0, 2).map((arch) => (
          <ArchRow
            key={arch.label}
            label={arch.label}
            teeth={arch.teeth}
            byTooth={byTooth}
            selected={selected}
            onSelect={selectTooth}
          />
        ))}
        <div className="border-t border-dashed border-sand-50/10 my-2" />
        {arches.slice(2).map((arch) => (
          <ArchRow
            key={arch.label}
            label={arch.label}
            teeth={arch.teeth}
            byTooth={byTooth}
            selected={selected}
            onSelect={selectTooth}
          />
        ))}
      </div>

      {selected != null && (
        <div className="pt-4 border-t border-sand-50/10 space-y-3">
          <p className="text-sm text-sand-50">
            Tooth <span className="font-display text-turq-300 text-lg">{selected}</span>
            {selectedFinding && (
              <span className="text-sand-50/50 text-xs ml-2">
                current: {conditionMeta(selectedFinding.condition).label}
              </span>
            )}
          </p>

          {canEdit ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-sand-50/50 mb-1">Condition</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as ToothCondition)}
                    className="dash-input"
                  >
                    {TOOTH_CONDITIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-sand-50/50 mb-1">Notes</label>
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={500}
                    className="dash-input"
                    placeholder="Optional clinical note"
                  />
                </div>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(upsertToothFinding, { condition, notes })}
                  className="bg-turq-600 text-ink-950 py-2 px-4 rounded-lg font-semibold text-sm hover:bg-turq-500 transition-colors disabled:opacity-60"
                >
                  {pending ? "Saving…" : "Save finding"}
                </button>
                {selectedFinding && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(clearToothFinding)}
                    className="border border-sand-50/20 text-sand-50/70 py-2 px-4 rounded-lg text-sm hover:bg-sand-50/8 transition-colors disabled:opacity-60"
                  >
                    Clear tooth
                  </button>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-sand-50/50">
              {selectedFinding
                ? `${conditionMeta(selectedFinding.condition).label}${
                    selectedFinding.notes ? ` — ${selectedFinding.notes}` : ""
                  }`
                : "No finding recorded on this tooth."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ArchRow({
  label,
  teeth,
  byTooth,
  selected,
  onSelect,
}: {
  label: string;
  teeth: readonly number[];
  byTooth: Map<number, ChartFinding>;
  selected: number | null;
  onSelect: (n: number) => void;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-sand-50/30 mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
        {teeth.map((n) => {
          const finding = byTooth.get(n);
          const meta = finding ? conditionMeta(finding.condition) : null;
          const isSelected = selected === n;
          return (
            <button
              key={n}
              type="button"
              title={finding ? `${n}: ${meta?.label}` : `Tooth ${n}`}
              onClick={() => onSelect(n)}
              className={`w-10 h-12 sm:w-11 sm:h-14 rounded-md border text-xs font-medium flex flex-col items-center justify-center transition-colors ${
                isSelected
                  ? "ring-2 ring-turq-400 border-turq-400 bg-turq-600/20 text-sand-50"
                  : meta
                    ? meta.color
                    : "border-sand-50/15 bg-sand-50/5 text-sand-50/70 hover:border-sand-50/30"
              }`}
            >
              <span>{n}</span>
              {meta && meta.value !== "healthy" && (
                <span className="text-[9px] opacity-80">{meta.short}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

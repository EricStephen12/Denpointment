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
  conditionFill,
  conditionMeta,
} from "@/lib/odontogram";
import { TOOTH_SURFACES, parseSurfaces, type ToothSurface } from "@/lib/tooth-surfaces";

export type ChartFinding = {
  toothNumber: number;
  condition: ToothCondition;
  surfaces: string | null;
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
  const [surfaces, setSurfaces] = useState<ToothSurface[]>([]);
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
      setSurfaces(parseSurfaces(existing.surfaces));
      setNotes(existing.notes ?? "");
    } else {
      setCondition("caries");
      setSurfaces([]);
      setNotes("");
    }
  }

  function toggleSurface(s: ToothSurface) {
    setSurfaces((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
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
            FDI numbering · illustrated teeth · tap one to mark condition
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

      <div className="space-y-4 select-none">
        {arches.slice(0, 2).map((arch) => (
          <ArchRow
            key={arch.label}
            label={arch.label}
            teeth={arch.teeth}
            archSide="upper"
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
            archSide="lower"
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
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-sand-50/50 mb-1.5">
                    Surfaces (M D O B L I)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {TOOTH_SURFACES.map((s) => {
                      const on = surfaces.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleSurface(s)}
                          className={`w-8 h-8 rounded-md border text-xs font-semibold transition-colors ${
                            on
                              ? "bg-turq-600 text-ink-950 border-turq-500"
                              : "border-sand-50/20 text-sand-50/55 hover:border-sand-50/40"
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    run(upsertToothFinding, {
                      condition,
                      notes,
                      surfaces: surfaces.join(","),
                    })
                  }
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
                    selectedFinding.surfaces ? ` · ${selectedFinding.surfaces}` : ""
                  }${selectedFinding.notes ? ` — ${selectedFinding.notes}` : ""}`
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
  archSide,
  byTooth,
  selected,
  onSelect,
}: {
  label: string;
  teeth: readonly number[];
  archSide: "upper" | "lower";
  byTooth: Map<number, ChartFinding>;
  selected: number | null;
  onSelect: (n: number) => void;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-sand-50/30 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
        {teeth.map((n) => {
          const finding = byTooth.get(n);
          const meta = finding ? conditionMeta(finding.condition) : null;
          const isSelected = selected === n;
          const fill = conditionFill(finding?.condition);
          return (
            <button
              key={n}
              type="button"
              title={finding ? `${n}: ${meta?.label}` : `Tooth ${n}`}
              onClick={() => onSelect(n)}
              className={`group relative w-11 h-[4.25rem] sm:w-12 sm:h-[4.75rem] rounded-lg p-0.5 transition-transform hover:scale-105 focus:outline-none ${
                isSelected ? "ring-2 ring-turq-400 ring-offset-2 ring-offset-ink-950" : ""
              }`}
            >
              <ToothSvg
                archSide={archSide}
                missing={finding?.condition === "missing"}
                fill={fill}
              />
              <span className="absolute inset-x-0 top-0.5 text-center text-[9px] font-semibold text-sand-50/90 drop-shadow">
                {n}
              </span>
              {meta && meta.value !== "healthy" && meta.value !== "missing" && (
                <span className="absolute inset-x-0 bottom-0.5 text-center text-[8px] font-medium text-sand-50/85">
                  {meta.short}
                  {finding?.surfaces ? ` ${finding.surfaces}` : ""}
                </span>
              )}
              {finding?.condition === "missing" && (
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-sand-50/50">
                  ×
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ToothSvg({
  archSide,
  missing,
  fill,
}: {
  archSide: "upper" | "lower";
  missing: boolean;
  fill: { crown: string; root: string; stroke: string };
}) {
  const flip = archSide === "upper";
  return (
    <svg
      viewBox="0 0 40 56"
      className={`h-full w-full ${missing ? "opacity-35" : ""}`}
      aria-hidden
    >
      <g transform={flip ? "translate(0 56) scale(1 -1)" : undefined}>
        {/* Roots */}
        <path
          d="M14 28 C12 36 10 46 11 52 C12 54 14 54 15 52 C16 46 17 38 18 32 Z"
          fill={fill.root}
          stroke={fill.stroke}
          strokeWidth="0.8"
          opacity="0.95"
        />
        <path
          d="M22 32 C23 38 24 46 25 52 C26 54 28 54 29 52 C30 46 28 36 26 28 Z"
          fill={fill.root}
          stroke={fill.stroke}
          strokeWidth="0.8"
          opacity="0.95"
        />
        {/* Crown */}
        <path
          d="M8 8 C8 3 14 1 20 1 C26 1 32 3 32 8 C33 14 31 22 28 26 C26 28 24 29 20 29 C16 29 14 28 12 26 C9 22 7 14 8 8 Z"
          fill={fill.crown}
          stroke={fill.stroke}
          strokeWidth="1.2"
        />
        {/* Highlight */}
        <path
          d="M14 6 C15 4 18 3 20 3 C22 4 23 6 22 8 C20 9 16 8 14 6 Z"
          fill="#ffffff"
          opacity="0.18"
        />
      </g>
    </svg>
  );
}

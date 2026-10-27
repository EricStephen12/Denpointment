"use client";

import React, { useState, useTransition } from "react";
import type { ToothCondition, PlanItemStatus } from "@prisma/client";
import {
  clearToothFinding,
  upsertToothFinding,
  planToothProcedure,
  completeToothProcedure,
} from "@/app/actions/chart";
import { deletePlanItem } from "@/app/actions/clinical-care";
import { formatNaira } from "@/lib/currency";
import {
  UPPER_RIGHT,
  UPPER_LEFT,
  LOWER_LEFT,
  LOWER_RIGHT,
  PRIMARY_UPPER_RIGHT,
  PRIMARY_UPPER_LEFT,
  PRIMARY_LOWER_LEFT,
  PRIMARY_LOWER_RIGHT,
  TOOTH_CONDITIONS,
  conditionMeta,
  getToothAnatomy,
  type ToothAnatomyKind,
  type ChartNotationSystem,
  getToothLabel,
} from "@/lib/odontogram";
import { TOOTH_SURFACES, type ToothSurface } from "@/lib/tooth-surfaces";
import {
  Check,
  X,
  Sparkles,
  AlertCircle,
  Trash2,
  Loader2,
  LayoutGrid,
  Eye,
  Layers,
  Plus,
  CheckCircle2,
  Clock,
  ClipboardList,
  Stethoscope,
  Calendar,
} from "lucide-react";

export type ChartFinding = {
  toothNumber: number;
  condition: ToothCondition;
  surfaces: string | null;
  notes: string | null;
};

export type ClinicServiceOption = {
  serviceId: number;
  name: string;
  price: number;
};

export type TreatmentPlanItemData = {
  itemId: number;
  planId: number;
  description: string;
  toothNumber: number | null;
  surfaces: string | null;
  estimatedCharge: number | null;
  status: PlanItemStatus;
};

const DEFAULT_CLINIC_SERVICES: ClinicServiceOption[] = [
  { serviceId: 901, name: "Composite Restoration (Filling)", price: 25000 },
  { serviceId: 902, name: "Root Canal Therapy (RCT)", price: 65000 },
  { serviceId: 903, name: "Porcelain Crown / Cap", price: 85000 },
  { serviceId: 904, name: "Simple Tooth Extraction", price: 20000 },
  { serviceId: 905, name: "Surgical Extraction / Disimpaction", price: 45000 },
  { serviceId: 906, name: "Scaling & Polishing (Prophylaxis)", price: 25000 },
  { serviceId: 907, name: "Dental Implant Placement", price: 350000 },
  { serviceId: 908, name: "Fluoride / Desensitizing Treatment", price: 15000 },
];

type Props = {
  patientId: number;
  findings: ChartFinding[];
  canEdit: boolean;
  clinicServices?: ClinicServiceOption[];
  treatmentPlanItems?: TreatmentPlanItemData[];
};

export default function Odontogram({
  patientId,
  findings,
  canEdit,
  clinicServices,
  treatmentPlanItems = [],
}: Props) {
  const [notation, setNotation] = useState<ChartNotationSystem>("palmer");
  const [dentition, setDentition] = useState<"adult" | "primary">("adult");
  const [selected, setSelected] = useState<number | null>(11);
  const [condition, setCondition] = useState<ToothCondition>("healthy");
  const [surfaces, setSurfaces] = useState<ToothSurface[]>([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const availableServices =
    clinicServices && clinicServices.length > 0
      ? clinicServices
      : DEFAULT_CLINIC_SERVICES;

  const [selectedProcedure, setSelectedProcedure] = useState<string>(
    availableServices[0]?.name || "Composite Restoration (Filling)"
  );
  const [estimatedFee, setEstimatedFee] = useState<number | string>(
    availableServices[0]?.price ?? 25000
  );
  const [customProcedure, setCustomProcedure] = useState<string>("");

  const byTooth = new Map(findings.map((f) => [f.toothNumber, f]));
  const selectedFinding = selected != null ? byTooth.get(selected) : undefined;
  const selectedAnatomy = selected != null ? getToothAnatomy(selected) : null;
  const selectedToothPlanItems = selected != null ? treatmentPlanItems.filter((i) => i.toothNumber === selected) : [];

  function handleSelectCondition(cond: ToothCondition) {
    setCondition(cond);
    if (cond === "caries") {
      const match = availableServices.find(
        (s) => s.name.toLowerCase().includes("composite") || s.name.toLowerCase().includes("fill")
      ) || availableServices[0];
      setSelectedProcedure(match.name);
      setEstimatedFee(match.price);
    } else if (cond === "crown") {
      const match = availableServices.find((s) => s.name.toLowerCase().includes("crown")) || {
        name: "Porcelain Crown / Cap",
        price: 85000,
      };
      setSelectedProcedure(match.name);
      setEstimatedFee(match.price);
    } else if (cond === "root_canal") {
      const match = availableServices.find(
        (s) => s.name.toLowerCase().includes("canal") || s.name.toLowerCase().includes("rct")
      ) || { name: "Root Canal Therapy (RCT)", price: 65000 };
      setSelectedProcedure(match.name);
      setEstimatedFee(match.price);
    } else if (cond === "extraction_planned") {
      const match = availableServices.find((s) => s.name.toLowerCase().includes("extract")) || {
        name: "Simple Tooth Extraction",
        price: 20000,
      };
      setSelectedProcedure(match.name);
      setEstimatedFee(match.price);
    } else if (cond === "missing") {
      const match = availableServices.find((s) => s.name.toLowerCase().includes("implant")) || {
        name: "Dental Implant Placement",
        price: 350000,
      };
      setSelectedProcedure(match.name);
      setEstimatedFee(match.price);
    }
  }

  function selectTooth(n: number) {
    setSelected(n);
    setError(null);
    const existing = byTooth.get(n);
    if (existing) {
      setCondition(existing.condition);
      setSurfaces(
        existing.surfaces
          ? (existing.surfaces.split(",").map((s) => s.trim().toUpperCase()) as ToothSurface[])
          : []
      );
      setNotes(existing.notes ?? "");
      handleSelectCondition(existing.condition);
    } else {
      setCondition("healthy");
      setSurfaces([]);
      setNotes("");
    }
  }

  function toggleSurface(s: ToothSurface) {
    setSurfaces((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  // Quick 1-click condition applier
  function handleQuickApplyCondition(cond: ToothCondition) {
    if (selected == null || !canEdit) return;
    handleSelectCondition(cond);
    const fd = new FormData();
    fd.set("patientId", String(patientId));
    fd.set("toothNumber", String(selected));
    fd.set("condition", cond);
    fd.set("surfaces", surfaces.join(","));
    if (notes.trim()) fd.set("notes", notes.trim());

    setError(null);
    startTransition(async () => {
      try {
        await upsertToothFinding(fd);
      } catch (err: any) {
        setError(err?.message || "Failed to save condition.");
      }
    });
  }

  function handleSaveCurrent() {
    if (selected == null || !canEdit) return;
    handleQuickApplyCondition(condition);
  }

  function handleClearCurrent() {
    if (selected == null || !canEdit) return;
    const fd = new FormData();
    fd.set("patientId", String(patientId));
    fd.set("toothNumber", String(selected));

    setError(null);
    startTransition(async () => {
      try {
        await clearToothFinding(fd);
        setCondition("healthy");
        setSurfaces([]);
        setNotes("");
      } catch (err: any) {
        setError(err?.message || "Failed to clear tooth.");
      }
    });
  }

  function handlePlanProcedure() {
    if (selected == null || !canEdit) return;
    const procName = customProcedure.trim() || selectedProcedure;
    if (!procName) {
      setError("Please select or enter a procedure name.");
      return;
    }

    const feeNum = typeof estimatedFee === "string" ? parseInt(estimatedFee, 10) : estimatedFee;

    const fd = new FormData();
    fd.set("patientId", String(patientId));
    fd.set("toothNumber", String(selected));
    fd.set("description", procName);
    fd.set("surfaces", surfaces.join(","));
    if (feeNum != null && !Number.isNaN(feeNum)) {
      fd.set("estimatedCharge", String(feeNum));
    }
    fd.set("condition", condition);

    setError(null);
    startTransition(async () => {
      try {
        await planToothProcedure(fd);
        setCustomProcedure("");
      } catch (err: any) {
        setError(err?.message || "Failed to plan procedure.");
      }
    });
  }

  function handleCompleteItem(item: TreatmentPlanItemData) {
    if (!canEdit) return;
    const fd = new FormData();
    fd.set("itemId", String(item.itemId));
    fd.set("patientId", String(patientId));
    if (item.toothNumber) fd.set("toothNumber", String(item.toothNumber));
    fd.set("description", item.description);

    setError(null);
    startTransition(async () => {
      try {
        await completeToothProcedure(fd);
      } catch (err: any) {
        setError(err?.message || "Failed to mark item completed.");
      }
    });
  }

  function handleDeletePlanItem(itemId: number) {
    if (!canEdit) return;
    if (!confirm("Remove this planned treatment item?")) return;
    const fd = new FormData();
    fd.set("itemId", String(itemId));

    setError(null);
    startTransition(async () => {
      try {
        await deletePlanItem(fd);
      } catch (err: any) {
        setError(err?.message || "Failed to delete item.");
      }
    });
  }

  const upperRightTeeth = dentition === "adult" ? UPPER_RIGHT : PRIMARY_UPPER_RIGHT;
  const upperLeftTeeth = dentition === "adult" ? UPPER_LEFT : PRIMARY_UPPER_LEFT;
  const lowerRightTeeth = dentition === "adult" ? LOWER_RIGHT : PRIMARY_LOWER_RIGHT;
  const lowerLeftTeeth = dentition === "adult" ? LOWER_LEFT : PRIMARY_LOWER_LEFT;

  const selectedDisplay = selected != null ? getToothLabel(selected, notation) : null;

  return (
    <div className="bg-ink-900 border border-sand-50/10 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
      {/* ── Top Toolbar: Charting System Toggles + Dentition + View Mode ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-sand-50/10">
        <div className="flex items-center gap-2">
          <h2 className="text-sm sm:text-base font-bold font-display text-sand-50">Dental Chart (Odontogram)</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Charting System / Notation Selector */}
          <div className="flex items-center gap-1 bg-ink-950 border border-sand-50/10 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setNotation("palmer")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                notation === "palmer"
                  ? "bg-turq-500 text-ink-950 shadow-sm"
                  : "text-sand-50/60 hover:text-sand-50"
              }`}
              title="4-Quadrant Palmer Notation (1 to 8 per quadrant from midline)"
            >
              4-Quadrant (1–8)
            </button>
            <button
              type="button"
              onClick={() => setNotation("fdi")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                notation === "fdi"
                  ? "bg-turq-500 text-ink-950 shadow-sm"
                  : "text-sand-50/60 hover:text-sand-50"
              }`}
              title="FDI 2-Digit International Notation (11–48)"
            >
              FDI (11–48)
            </button>
            <button
              type="button"
              onClick={() => setNotation("universal")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                notation === "universal"
                  ? "bg-turq-500 text-ink-950 shadow-sm"
                  : "text-sand-50/60 hover:text-sand-50"
              }`}
              title="Universal Numbering System (1–32)"
            >
              Universal (#1–32)
            </button>
          </div>

          {/* Dentition Selector */}
          <div className="flex items-center gap-1 bg-ink-950 border border-sand-50/10 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => {
                setDentition("adult");
                setSelected(11);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                dentition === "adult"
                  ? "bg-turq-500 text-ink-950 shadow-sm"
                  : "text-sand-50/60 hover:text-sand-50"
              }`}
            >
              Adult (32 Teeth)
            </button>
            <button
              type="button"
              onClick={() => {
                setDentition("primary");
                setSelected(51);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                dentition === "primary"
                  ? "bg-turq-500 text-ink-950 shadow-sm"
                  : "text-sand-50/60 hover:text-sand-50"
              }`}
            >
              Pediatric (20 Teeth)
            </button>
          </div>
        </div>
      </div>

      {/* ── Concise Condition Legend ── */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {TOOTH_CONDITIONS.map((c) => (
          <span
            key={c.value}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${c.color}`}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: c.badgeBg }}
            />
            <span>{c.label}</span>
          </span>
        ))}
      </div>

      {/* ── Standard Dental Arch Chart (Maxillary & Mandibular Arches) ── */}
      <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-b from-ink-950 to-ink-950/90 border border-sand-50/10 shadow-inner overflow-x-auto space-y-6">
        {/* Maxillary (Upper Arch) */}
        <div>
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-sand-50/50 font-semibold mb-2 px-2">
            <span>
              Maxillary — {notation === "palmer" ? "Upper Right Quadrant (UR)" : "Right (UR)"}
            </span>
            <span className="text-turq-400 font-mono text-xs">⏐ Midline ⏐</span>
            <span>
              {notation === "palmer" ? "Upper Left Quadrant (UL)" : "Left (UL)"} — Maxillary
            </span>
          </div>

          <div className="flex items-center justify-center gap-1 sm:gap-2 min-w-[620px]">
            {/* UR Quadrant */}
            <div className="flex items-center justify-end gap-1 sm:gap-1.5 flex-1 p-1 rounded-xl border border-sand-50/[0.04] bg-sand-50/[0.01]">
              {upperRightTeeth.map((n) => (
                <AnatomicalToothCard
                  key={n}
                  toothNumber={n}
                  notation={notation}
                  finding={byTooth.get(n)}
                  isSelected={selected === n}
                  onSelect={selectTooth}
                  isUpper={true}
                />
              ))}
            </div>

            {/* Midline Divider */}
            <div className="w-px h-28 bg-turq-400/40 shrink-0 mx-1 flex flex-col justify-between items-center py-2 text-[9px] text-turq-400 font-mono">
              <span>▲</span>
              <span>|</span>
              <span>▼</span>
            </div>

            {/* UL Quadrant */}
            <div className="flex items-center justify-start gap-1 sm:gap-1.5 flex-1 p-1 rounded-xl border border-sand-50/[0.04] bg-sand-50/[0.01]">
              {upperLeftTeeth.map((n) => (
                <AnatomicalToothCard
                  key={n}
                  toothNumber={n}
                  notation={notation}
                  finding={byTooth.get(n)}
                  isSelected={selected === n}
                  onSelect={selectTooth}
                  isUpper={true}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Arch Separator / Occlusal Plane */}
        <div className="relative flex items-center justify-center my-1">
          <div className="w-full border-t border-dashed border-sand-50/15" />
          <span className="absolute px-3 py-0.5 rounded-full bg-ink-900 border border-sand-50/10 text-[10px] font-mono text-sand-50/50 uppercase tracking-widest">
            {notation === "palmer" ? "Horizontal Quadrant Line (Occlusal)" : "Occlusal Plane"}
          </span>
        </div>

        {/* Mandibular (Lower Arch) */}
        <div>
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-sand-50/50 font-semibold mb-2 px-2">
            <span>
              Mandibular — {notation === "palmer" ? "Lower Right Quadrant (LR)" : "Right (LR)"}
            </span>
            <span className="text-turq-400 font-mono text-xs">⏐ Midline ⏐</span>
            <span>
              {notation === "palmer" ? "Lower Left Quadrant (LL)" : "Left (LL)"} — Mandibular
            </span>
          </div>

          <div className="flex items-center justify-center gap-1 sm:gap-2 min-w-[620px]">
            {/* LR Quadrant */}
            <div className="flex items-center justify-end gap-1 sm:gap-1.5 flex-1 p-1 rounded-xl border border-sand-50/[0.04] bg-sand-50/[0.01]">
              {lowerRightTeeth.map((n) => (
                <AnatomicalToothCard
                  key={n}
                  toothNumber={n}
                  notation={notation}
                  finding={byTooth.get(n)}
                  isSelected={selected === n}
                  onSelect={selectTooth}
                  isUpper={false}
                />
              ))}
            </div>

            {/* Midline Divider */}
            <div className="w-px h-28 bg-turq-400/40 shrink-0 mx-1 flex flex-col justify-between items-center py-2 text-[9px] text-turq-400 font-mono">
              <span>▲</span>
              <span>|</span>
              <span>▼</span>
            </div>

            {/* LL Quadrant */}
            <div className="flex items-center justify-start gap-1 sm:gap-1.5 flex-1 p-1 rounded-xl border border-sand-50/[0.04] bg-sand-50/[0.01]">
              {lowerLeftTeeth.map((n) => (
                <AnatomicalToothCard
                  key={n}
                  toothNumber={n}
                  notation={notation}
                  finding={byTooth.get(n)}
                  isSelected={selected === n}
                  onSelect={selectTooth}
                  isUpper={false}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Active Selected Tooth Workspace ── */}
      {selected != null && (
        <div className="p-4 sm:p-5 rounded-2xl bg-ink-950 border border-sand-50/15 shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sand-50/10">
            <div className="flex items-center gap-3">
              <div className="min-w-10 px-2.5 h-10 rounded-xl bg-turq-500/10 border border-turq-500/20 text-turq-400 flex items-center justify-center font-display font-bold text-sm shrink-0">
                {selectedDisplay?.fullLabel}
              </div>
              <div>
                <h3 className="text-sm font-bold text-sand-50 flex items-center gap-2">
                  <span>{selectedAnatomy?.name ?? `Tooth ${selected}`}</span>
                  <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-sand-50/10 text-sand-50/70 font-normal">
                    {selectedDisplay?.quadrantName} {notation !== "fdi" ? `(FDI #${selected})` : ""}
                  </span>
                </h3>
                <p className="text-xs text-sand-50/50 mt-0.5">
                  Current Status:{" "}
                  <strong className="text-sand-50">
                    {selectedFinding ? conditionMeta(selectedFinding.condition).label : "Healthy Enamel"}
                  </strong>
                  {selectedFinding?.surfaces ? ` · Surfaces: ${selectedFinding.surfaces}` : ""}
                </p>
              </div>
            </div>

            {canEdit && (
              <div className="flex items-center gap-2">
                {selectedFinding && (
                  <button
                    type="button"
                    onClick={handleClearCurrent}
                    disabled={pending}
                    className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 border border-red-500/20 hover:bg-red-500/10 px-3 py-1.5 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Clear Tooth
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveCurrent}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 text-xs font-bold bg-turq-500 hover:bg-turq-400 text-ink-950 px-4 py-2 rounded-xl transition-all shadow-md shadow-turq-500/10 disabled:opacity-50 cursor-pointer"
                >
                  {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Save Findings
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {canEdit && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Column 1: Quick 1-Click Condition Ribbon */}
                <div className="lg:col-span-7 space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-sand-50/50 block">
                    1. Tooth Condition Diagnosis
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {TOOTH_CONDITIONS.map((c) => {
                      const isActive = condition === c.value;
                      return (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => handleQuickApplyCondition(c.value)}
                          disabled={pending}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all text-left cursor-pointer ${
                            isActive
                              ? "bg-sand-50/15 border-turq-400 text-sand-50 shadow-md ring-1 ring-turq-400"
                              : "bg-ink-900 border-sand-50/10 text-sand-50/70 hover:text-sand-50 hover:border-sand-50/30"
                          }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: c.badgeBg }}
                          />
                          <span className="truncate">{c.label.split(" ")[0]}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2">
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Clinical notes (e.g. distal marginal ridge breakdown, cold sensitivity)"
                      className="w-full px-3.5 py-2 bg-ink-900 border border-sand-50/10 rounded-xl text-xs text-sand-50 placeholder:text-sand-50/30 focus:outline-none focus:border-turq-500"
                    />
                  </div>
                </div>

                {/* Column 2: 5-Surface Clinical Target Diagram (M-O-D-B-L) */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center p-3 rounded-2xl bg-ink-900/60 border border-sand-50/10 space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-sand-50/50">
                    2. Surface Mapping
                  </span>
                  <FiveSurfaceOdontogramTarget
                    surfaces={surfaces}
                    onToggle={toggleSurface}
                  />
                  <span className="text-[11px] text-sand-50/40">
                    Selected Surfaces: <strong className="text-sand-50">{surfaces.length > 0 ? surfaces.join("-") : "Whole Tooth"}</strong>
                  </span>
                </div>
              </div>

              {/* 3. Real Dental Clinic Treatment Planning Bridge */}
              <div className="p-4 rounded-xl bg-ink-900 border border-turq-500/20 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-turq-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-sand-50">
                      3. Plan Procedure for {selectedDisplay?.fullLabel}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-sand-50/10 text-sand-50/70 font-mono">
                      {surfaces.length > 0 ? `Surfaces: ${surfaces.join("-")}` : "Whole Tooth"}
                    </span>
                  </div>

                  {selectedToothPlanItems.length > 0 && (
                    <span className="text-[11px] text-turq-300 font-semibold bg-turq-500/10 border border-turq-500/20 px-2 py-0.5 rounded-md">
                      {selectedToothPlanItems.length} planned for this tooth
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-6 space-y-1">
                    <label className="text-[11px] text-sand-50/60 font-medium">Clinic Procedure</label>
                    <select
                      value={selectedProcedure}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedProcedure(val);
                        const found = availableServices.find((s) => s.name === val);
                        if (found) setEstimatedFee(found.price);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-ink-950 border border-sand-50/15 text-xs text-sand-50 focus:outline-none focus:border-turq-500"
                    >
                      {availableServices.map((srv) => (
                        <option key={srv.serviceId} value={srv.name}>
                          {srv.name} — {formatNaira(srv.price)}
                        </option>
                      ))}
                      <option value="custom">Custom Procedure (Type below)...</option>
                    </select>
                  </div>

                  {selectedProcedure === "custom" && (
                    <div className="sm:col-span-6 space-y-1">
                      <label className="text-[11px] text-sand-50/60 font-medium">Custom Procedure Name</label>
                      <input
                        type="text"
                        value={customProcedure}
                        onChange={(e) => setCustomProcedure(e.target.value)}
                        placeholder="e.g. Laser Gingivectomy, Veneer"
                        className="w-full px-3 py-2 rounded-xl bg-ink-950 border border-sand-50/15 text-xs text-sand-50 focus:outline-none focus:border-turq-500"
                      />
                    </div>
                  )}

                  <div className="sm:col-span-3 space-y-1">
                    <label className="text-[11px] text-sand-50/60 font-medium">Estimated Fee (₦)</label>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={estimatedFee}
                      onChange={(e) => setEstimatedFee(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-ink-950 border border-sand-50/15 text-xs text-sand-50 font-mono focus:outline-none focus:border-turq-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <button
                      type="button"
                      onClick={handlePlanProcedure}
                      disabled={pending}
                      className="w-full py-2 px-3 rounded-xl bg-turq-500 hover:bg-turq-400 text-ink-950 font-bold text-xs transition-all shadow-md shadow-turq-500/10 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      Add to Treatment Plan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Real Clinic Active Treatment Plan & Care Ledger (Directly on Same Screen) ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-ink-950 border border-sand-50/15 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sand-50/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-turq-500/10 border border-turq-500/20 text-turq-400 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-sand-50 flex items-center gap-2">
                <span>Active Treatment Plan &amp; Planned Procedures</span>
              </h3>
              <p className="text-xs text-sand-50/50">
                Connected directly to the chart above. Click &ldquo;Mark Complete&rdquo; to update tooth visually to restored enamel.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="px-3 py-1 rounded-lg bg-sand-50/5 border border-sand-50/10 text-sand-50/70 font-medium">
              {treatmentPlanItems.length} {treatmentPlanItems.length === 1 ? "Procedure" : "Procedures"}
            </span>
            <span className="px-3 py-1 rounded-lg bg-turq-500/10 border border-turq-500/20 text-turq-300 font-bold font-mono">
              Total: {formatNaira(treatmentPlanItems.reduce((sum, i) => sum + (i.estimatedCharge ?? 0), 0))}
            </span>
            <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold font-mono">
              Completed: {formatNaira(treatmentPlanItems.filter((i) => i.status === "completed").reduce((sum, i) => sum + (i.estimatedCharge ?? 0), 0))}
            </span>
          </div>
        </div>

        {treatmentPlanItems.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-sand-50/[0.02] border border-dashed border-sand-50/10 space-y-2">
            <Stethoscope className="w-8 h-8 text-turq-400/40 mx-auto" />
            <p className="text-xs font-semibold text-sand-50/70">No planned procedures recorded yet</p>
            <p className="text-[11px] text-sand-50/40 max-w-md mx-auto">
              Select any tooth on the odontogram above, mark a finding (such as Caries or Crown), and click &ldquo;Add to Treatment Plan&rdquo; to plan care with clinic pricing.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-sand-50/10 text-sand-50/50 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Tooth</th>
                  <th className="py-2.5 px-3">Surfaces</th>
                  <th className="py-2.5 px-3">Planned Procedure</th>
                  <th className="py-2.5 px-3 text-right">Fee</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  {canEdit && <th className="py-2.5 px-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-50/5">
                {treatmentPlanItems.map((item) => {
                  const toothLabel = item.toothNumber != null ? getToothLabel(item.toothNumber, notation) : null;
                  const isCompleted = item.status === "completed";
                  const isInProgress = item.status === "in_progress";
                  return (
                    <tr key={item.itemId} className="hover:bg-sand-50/[0.02] transition-colors">
                      <td className="py-2.5 px-3">
                        {toothLabel ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-turq-500/10 text-turq-300 border border-turq-500/20">
                            {toothLabel.fullLabel}
                            {notation !== "fdi" && <span className="text-[10px] text-sand-50/40">#{item.toothNumber}</span>}
                          </span>
                        ) : (
                          <span className="text-sand-50/40 italic">General</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-sand-50/70 font-mono text-[11px]">
                        {item.surfaces || "—"}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-sand-50">
                        {item.description}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-sand-50/90">
                        {item.estimatedCharge != null ? formatNaira(item.estimatedCharge) : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Completed
                          </span>
                        ) : isInProgress ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-950/60 text-sky-300 border border-sky-500/30">
                            <Clock className="w-3 h-3 text-sky-400" /> In Progress
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-500/30">
                            <Calendar className="w-3 h-3 text-amber-400" /> Planned
                          </span>
                        )}
                      </td>
                      {canEdit && (
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isCompleted && (
                              <button
                                type="button"
                                onClick={() => handleCompleteItem(item)}
                                disabled={pending}
                                className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                                title="Mark Complete & Restore Tooth on Chart"
                              >
                                <Check className="w-3 h-3" /> Mark Complete
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeletePlanItem(item.itemId)}
                              disabled={pending}
                              className="text-red-400/60 hover:text-red-300 p-1 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Anatomical Tooth Card: Realistic multi-part SVG representation
// -----------------------------------------------------------------------------

function AnatomicalToothCard({
  toothNumber,
  notation,
  finding,
  isSelected,
  onSelect,
  isUpper,
}: {
  toothNumber: number;
  notation: ChartNotationSystem;
  finding?: ChartFinding;
  isSelected: boolean;
  onSelect: (n: number) => void;
  isUpper: boolean;
}) {
  const anatomy = getToothAnatomy(toothNumber);
  const display = getToothLabel(toothNumber, notation);
  const condition = finding?.condition ?? "healthy";
  const isMissing = condition === "missing";
  const isCaries = condition === "caries";
  const isFilling = condition === "filling";
  const isCrown = condition === "crown";
  const isRootCanal = condition === "root_canal";
  const isExtractPlanned = condition === "extraction_planned";
  const isWatch = condition === "watch";

  return (
    <button
      type="button"
      onClick={() => onSelect(toothNumber)}
      title={`${display.fullLabel} · ${anatomy.name} (${conditionMeta(condition).label})`}
      className={`group relative flex flex-col items-center justify-between w-9 sm:w-11 h-28 sm:h-32 p-1 rounded-xl transition-all cursor-pointer ${
        isSelected
          ? "bg-turq-500/15 ring-2 ring-turq-400 ring-offset-2 ring-offset-ink-950 scale-105 z-10 shadow-lg shadow-turq-500/20"
          : "hover:bg-sand-50/5 hover:scale-102"
      }`}
    >
      {/* Upper tooth number is at the top */}
      {isUpper && (
        <span
          className={`text-[10px] font-mono font-bold transition-colors ${
            isSelected ? "text-turq-300" : "text-sand-50/80 group-hover:text-turq-300"
          }`}
        >
          {display.label}
        </span>
      )}

      {/* Realistic Anatomical SVG Tooth */}
      <div className="relative w-full flex-1 flex items-center justify-center my-0.5">
        <RealisticAnatomicalToothSvg
          kind={anatomy.kind}
          isUpper={isUpper}
          isMissing={isMissing}
          isCaries={isCaries}
          isFilling={isFilling}
          isCrown={isCrown}
          isRootCanal={isRootCanal}
          isExtractPlanned={isExtractPlanned}
          isWatch={isWatch}
        />

        {/* Condition Strikethrough for Missing / Extraction */}
        {isMissing && (
          <div className="absolute inset-0 flex items-center justify-center text-red-500 font-bold text-2xl drop-shadow pointer-events-none select-none">
            ✕
          </div>
        )}
        {isExtractPlanned && (
          <div className="absolute inset-0 flex items-center justify-center text-amber-400 font-bold text-2xl drop-shadow pointer-events-none select-none">
            ╱
          </div>
        )}
      </div>

      {/* Lower tooth number is at the bottom */}
      {!isUpper && (
        <span
          className={`text-[10px] font-mono font-bold transition-colors ${
            isSelected ? "text-turq-300" : "text-sand-50/80 group-hover:text-turq-300"
          }`}
        >
          {display.label}
        </span>
      )}

      {/* Condition Short Indicator Pill */}
      {condition !== "healthy" && !isMissing && (
        <span
          className="absolute -bottom-1 text-[8px] font-bold px-1.5 py-0.2 rounded-full border shadow uppercase font-mono"
          style={{
            backgroundColor: conditionMeta(condition).badgeBg,
            color: "#080c0c",
            borderColor: "rgba(255,255,255,0.4)",
          }}
        >
          {conditionMeta(condition).short}
        </span>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Realistic SVG Tooth Vectors (Distinct anatomical shapes per tooth type)
// ─────────────────────────────────────────────────────────────────────────────

function RealisticAnatomicalToothSvg({
  kind,
  isUpper,
  isMissing,
  isCaries,
  isFilling,
  isCrown,
  isRootCanal,
  isExtractPlanned,
  isWatch,
}: {
  kind: ToothAnatomyKind;
  isUpper: boolean;
  isMissing: boolean;
  isCaries: boolean;
  isFilling: boolean;
  isCrown: boolean;
  isRootCanal: boolean;
  isExtractPlanned: boolean;
  isWatch: boolean;
}) {
  const crownFill = isCrown
    ? "url(#gold-crown)"
    : isFilling
    ? "url(#porcelain-filling)"
    : "url(#enamel-natural)";

  const strokeColor = isWatch
    ? "#FACC15"
    : isCaries
    ? "#EF4444"
    : isCrown
    ? "#F59E0B"
    : isFilling
    ? "#38BDF8"
    : "#94A3B8";

  // On upper teeth, roots point UP (top), crown points DOWN (bottom).
  // On lower teeth, crown points UP (top), roots point DOWN (bottom).
  const transform = !isUpper ? "scale(1, -1) translate(0, -56)" : undefined;

  return (
    <svg
      viewBox="0 0 34 56"
      className={`w-full h-full max-h-24 transition-all ${
        isMissing ? "opacity-25 filter grayscale" : "drop-shadow-sm"
      }`}
      aria-hidden
    >
      <defs>
        {/* Luminous, Pristine Pearlescent White Enamel */}
        <linearGradient id="enamel-natural" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#F8FAFC" />
          <stop offset="80%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>

        {/* Clean Natural Dentine Root */}
        <linearGradient id="dentine-root" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFDF7" />
          <stop offset="60%" stopColor="#F5EDE0" />
          <stop offset="100%" stopColor="#E0D2BA" />
        </linearGradient>

        {/* Polished Gold / Ceramic Crown */}
        <linearGradient id="gold-crown" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>

        {/* Clinical Composite Restoration */}
        <linearGradient id="porcelain-filling" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#BAE6FD" />
          <stop offset="50%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>

        {/* Endodontic Canal Fill */}
        <linearGradient id="endo-canal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>
      </defs>

      <g transform={transform}>
        {/* ── 1. MOLAR ANATOMY ── */}
        {kind === "molar" && (
          <g>
            {/* Roots: Clean, defined anatomical roots */}
            <path
              d="M7 24 C6 15 4 8 7 3 C9 2 11 5 12 11 C13 16 13 20 13 24 Z"
              fill="url(#dentine-root)"
              stroke={strokeColor}
              strokeWidth="0.9"
            />
            <path
              d="M27 24 C28 15 30 8 27 3 C25 2 23 5 22 11 C21 16 21 20 21 24 Z"
              fill="url(#dentine-root)"
              stroke={strokeColor}
              strokeWidth="0.9"
            />
            <path
              d="M15 24 C16 17 17 9 17 3 C17 9 18 17 19 24 Z"
              fill="url(#dentine-root)"
              stroke={strokeColor}
              strokeWidth="0.7"
            />

            {/* Endodontic canal */}
            {isRootCanal && (
              <g stroke="url(#endo-canal)" strokeWidth="1.8" strokeLinecap="round">
                <line x1="8" y1="5" x2="11" y2="24" />
                <line x1="26" y1="5" x2="23" y2="24" />
                <line x1="17" y1="5" x2="17" y2="24" />
              </g>
            )}

            {/* Realistic Rounded 4-Cusp Molar Crown */}
            <path
              d="M3 24 C2 33 3 46 7 51 C11 54 14 53 17 53 C20 53 23 54 27 51 C31 46 32 33 31 24 C26 22 21 23 17 23 C13 23 8 22 3 24 Z"
              fill={crownFill}
              stroke={strokeColor}
              strokeWidth="1.2"
            />

            {/* Cervical Margin / Enamel Line */}
            <path d="M4 25 C10 27 24 27 30 25" stroke="#CBD5E1" strokeWidth="0.8" fill="none" />

            {/* Occlusal Fissures */}
            <path d="M10 40 C13 42 21 42 24 40" stroke="#94A3B8" strokeWidth="0.9" fill="none" opacity="0.7" />
            <path d="M17 33 L17 48" stroke="#94A3B8" strokeWidth="0.9" fill="none" opacity="0.7" />

            {/* Enamel Gloss Highlight */}
            <path d="M6 28 C9 26 13 26 15 28 L14 44 C12 46 7 44 6 42 Z" fill="#FFFFFF" opacity="0.3" />

            {/* Active Caries Decay Crater */}
            {isCaries && (
              <g>
                <circle cx="17" cy="41" r="4.2" fill="#EF4444" opacity="0.25" />
                <circle cx="17" cy="41" r="3.2" fill="#DC2626" stroke="#991B1B" strokeWidth="0.9" />
                <circle cx="17" cy="41" r="1.5" fill="#7F1D1D" />
              </g>
            )}
          </g>
        )}

        {/* ── 2. PREMOLAR ANATOMY ── */}
        {kind === "premolar" && (
          <g>
            {/* Roots */}
            <path
              d="M10 24 C9 15 8 7 11 3 C13 2 15 7 15 15 C15 19 14 21 14 24 Z"
              fill="url(#dentine-root)"
              stroke={strokeColor}
              strokeWidth="0.9"
            />
            <path
              d="M19 24 C19 19 19 15 21 11 C22 7 24 2 25 3 C26 7 24 15 23 24 Z"
              fill="url(#dentine-root)"
              stroke={strokeColor}
              strokeWidth="0.9"
            />

            {isRootCanal && (
              <line x1="13" y1="4" x2="15" y2="24" stroke="url(#endo-canal)" strokeWidth="1.8" strokeLinecap="round" />
            )}

            {/* Bicuspid Crown */}
            <path
              d="M5 24 C3 32 4 46 9 50 C12 53 16 52 20 52 C24 52 28 50 29 44 C31 34 30 26 28 24 C23 23 12 23 5 24 Z"
              fill={crownFill}
              stroke={strokeColor}
              strokeWidth="1.2"
            />

            <path d="M6 25 C12 26 22 26 27 25" stroke="#CBD5E1" strokeWidth="0.8" fill="none" />
            <path d="M14 38 C16 40 18 40 20 38" stroke="#94A3B8" strokeWidth="0.8" fill="none" opacity="0.7" />

            {/* Enamel Gloss */}
            <path d="M8 28 C10 26 13 26 15 27 L14 43 C12 45 8 44 8 42 Z" fill="#FFFFFF" opacity="0.3" />

            {isCaries && (
              <g>
                <circle cx="17" cy="39" r="3.8" fill="#EF4444" opacity="0.25" />
                <circle cx="17" cy="39" r="2.8" fill="#DC2626" stroke="#991B1B" strokeWidth="0.9" />
                <circle cx="17" cy="39" r="1.3" fill="#7F1D1D" />
              </g>
            )}
          </g>
        )}

        {/* ── 3. CANINE ANATOMY ── */}
        {kind === "canine" && (
          <g>
            {/* Long Canine Root */}
            <path
              d="M11 24 C11 14 12 6 16 2 C20 6 21 14 21 24 Z"
              fill="url(#dentine-root)"
              stroke={strokeColor}
              strokeWidth="0.9"
            />

            {isRootCanal && (
              <line x1="16" y1="3" x2="16" y2="24" stroke="url(#endo-canal)" strokeWidth="2" strokeLinecap="round" />
            )}

            {/* Pointed Cusp Canine Crown */}
            <path
              d="M5 24 C3 32 5 45 11 50 C14 52 16 55 16 55 C16 55 18 52 21 50 C27 45 29 32 27 24 C22 22 10 22 5 24 Z"
              fill={crownFill}
              stroke={strokeColor}
              strokeWidth="1.2"
            />

            <path d="M6 25 C11 26 21 26 26 25" stroke="#CBD5E1" strokeWidth="0.8" fill="none" />
            <path d="M16 26 L16 48" stroke="#FFFFFF" strokeWidth="1" fill="none" opacity="0.3" />

            {isCaries && (
              <g>
                <circle cx="16" cy="42" r="3.5" fill="#EF4444" opacity="0.25" />
                <circle cx="16" cy="42" r="2.6" fill="#DC2626" stroke="#991B1B" strokeWidth="0.9" />
                <circle cx="16" cy="42" r="1.2" fill="#7F1D1D" />
              </g>
            )}
          </g>
        )}

        {/* ── 4. INCISOR ANATOMY ── */}
        {kind === "incisor" && (
          <g>
            {/* Clean Conical Root */}
            <path
              d="M12 23 C12 13 13 6 16 2 C19 6 20 13 20 23 Z"
              fill="url(#dentine-root)"
              stroke={strokeColor}
              strokeWidth="0.9"
            />

            {isRootCanal && (
              <line x1="16" y1="3" x2="16" y2="23" stroke="url(#endo-canal)" strokeWidth="2" strokeLinecap="round" />
            )}

            {/* Classic Shovel Chisel Incisor Crown */}
            <path
              d="M5 23 C3 31 4 45 7 51 C8 53 11 54 16 54 C21 54 24 53 25 51 C28 45 29 31 27 23 C22 21 10 21 5 23 Z"
              fill={crownFill}
              stroke={strokeColor}
              strokeWidth="1.2"
            />

            <path d="M6 24 C11 25 21 25 26 24" stroke="#CBD5E1" strokeWidth="0.8" fill="none" />

            {/* Enamel Gloss Vertical Reflection */}
            <path d="M11 27 C12 25 19 25 20 27 L19 46 C18 48 12 48 11 46 Z" fill="#FFFFFF" opacity="0.3" />

            {isCaries && (
              <g>
                <circle cx="16" cy="41" r="3.5" fill="#EF4444" opacity="0.25" />
                <circle cx="16" cy="41" r="2.5" fill="#DC2626" stroke="#991B1B" strokeWidth="0.9" />
                <circle cx="16" cy="41" r="1.2" fill="#7F1D1D" />
              </g>
            )}
          </g>
        )}
      </g>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5-Surface Clinical Odontogram Target (M-O-D-B-L Interactive Cross)
// ─────────────────────────────────────────────────────────────────────────────

function FiveSurfaceOdontogramTarget({
  surfaces,
  onToggle,
}: {
  surfaces: ToothSurface[];
  onToggle: (s: ToothSurface) => void;
}) {
  const isB = surfaces.includes("B");
  const isL = surfaces.includes("L");
  const isM = surfaces.includes("M");
  const isD = surfaces.includes("D");
  const isO = surfaces.includes("O") || surfaces.includes("I");

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      {/* Buccal / Facial (Top) */}
      <button
        type="button"
        onClick={() => onToggle("B")}
        className={`absolute top-0 w-16 h-7 rounded-t-lg text-[10px] font-bold border transition-colors flex items-center justify-center ${
          isB
            ? "bg-turq-500 text-ink-950 border-turq-400 shadow"
            : "bg-ink-950 border-sand-50/20 text-sand-50/60 hover:border-sand-50/50"
        }`}
      >
        B (Buccal)
      </button>

      {/* Mesial (Left) */}
      <button
        type="button"
        onClick={() => onToggle("M")}
        className={`absolute left-0 w-7 h-16 rounded-l-lg text-[10px] font-bold border transition-colors flex items-center justify-center ${
          isM
            ? "bg-turq-500 text-ink-950 border-turq-400 shadow"
            : "bg-ink-950 border-sand-50/20 text-sand-50/60 hover:border-sand-50/50"
        }`}
      >
        M
      </button>

      {/* Occlusal / Incisal (Center) */}
      <button
        type="button"
        onClick={() => onToggle("O")}
        className={`w-11 h-11 rounded-lg text-[11px] font-bold border transition-colors flex items-center justify-center z-10 ${
          isO
            ? "bg-turq-500 text-ink-950 border-turq-400 shadow-md"
            : "bg-ink-900 border-sand-50/20 text-sand-50/80 hover:border-sand-50/50"
        }`}
      >
        O/I
      </button>

      {/* Distal (Right) */}
      <button
        type="button"
        onClick={() => onToggle("D")}
        className={`absolute right-0 w-7 h-16 rounded-r-lg text-[10px] font-bold border transition-colors flex items-center justify-center ${
          isD
            ? "bg-turq-500 text-ink-950 border-turq-400 shadow"
            : "bg-ink-950 border-sand-50/20 text-sand-50/60 hover:border-sand-50/50"
        }`}
      >
        D
      </button>

      {/* Lingual / Palatal (Bottom) */}
      <button
        type="button"
        onClick={() => onToggle("L")}
        className={`absolute bottom-0 w-16 h-7 rounded-b-lg text-[10px] font-bold border transition-colors flex items-center justify-center ${
          isL
            ? "bg-turq-500 text-ink-950 border-turq-400 shadow"
            : "bg-ink-950 border-sand-50/20 text-sand-50/60 hover:border-sand-50/50"
        }`}
      >
        L (Lingual)
      </button>
    </div>
  );
}

import type { ToothCondition } from "@prisma/client";

/** Adult permanent teeth in FDI notation (display rows). */
export const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11] as const;
export const UPPER_LEFT  = [21, 22, 23, 24, 25, 26, 27, 28] as const;
export const LOWER_LEFT  = [31, 32, 33, 34, 35, 36, 37, 38] as const;
export const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41] as const;

/** Primary (kids) teeth in FDI notation. */
export const PRIMARY_UPPER_RIGHT = [55, 54, 53, 52, 51] as const;
export const PRIMARY_UPPER_LEFT  = [61, 62, 63, 64, 65] as const;
export const PRIMARY_LOWER_LEFT  = [71, 72, 73, 74, 75] as const;
export const PRIMARY_LOWER_RIGHT = [85, 84, 83, 82, 81] as const;

export const ADULT_TEETH: readonly number[] = [
  ...UPPER_RIGHT,
  ...UPPER_LEFT,
  ...LOWER_LEFT,
  ...LOWER_RIGHT,
];

export const PRIMARY_TEETH: readonly number[] = [
  ...PRIMARY_UPPER_RIGHT,
  ...PRIMARY_UPPER_LEFT,
  ...PRIMARY_LOWER_LEFT,
  ...PRIMARY_LOWER_RIGHT,
];

export const ALL_FDI_TEETH: readonly number[] = [...ADULT_TEETH, ...PRIMARY_TEETH];

export type ToothAnatomyKind = "incisor" | "canine" | "premolar" | "molar";

export function getToothAnatomy(n: number): {
  kind: ToothAnatomyKind;
  isUpper: boolean;
  isRight: boolean;
  name: string;
} {
  const quad = Math.floor(n / 10);
  const pos = n % 10;
  const isUpper = quad === 1 || quad === 2 || quad === 5 || quad === 6;
  const isRight = quad === 1 || quad === 4 || quad === 5 || quad === 8;

  let kind: ToothAnatomyKind = "incisor";
  let name = "Incisor";
  if (pos === 1) name = "Central Incisor";
  else if (pos === 2) name = "Lateral Incisor";
  else if (pos === 3) {
    kind = "canine";
    name = "Canine (Cuspid)";
  } else if (pos === 4 || pos === 5) {
    kind = "premolar";
    name = pos === 4 ? "1st Premolar" : "2nd Premolar";
  } else if (pos >= 6) {
    kind = "molar";
    name = pos === 6 ? "1st Molar" : pos === 7 ? "2nd Molar" : "3rd Molar (Wisdom)";
  }

  return { kind, isUpper, isRight, name };
}

export const TOOTH_CONDITIONS: {
  value: ToothCondition;
  label: string;
  short: string;
  color: string;
  badgeBg: string;
}[] = [
  { value: "healthy", label: "Healthy Enamel", short: "OK", color: "bg-emerald-950/40 text-emerald-300 border-emerald-500/30", badgeBg: "#10B981" },
  { value: "caries", label: "Caries / Decay", short: "C", color: "bg-red-950/40 text-red-300 border-red-500/30", badgeBg: "#EF4444" },
  { value: "filling", label: "Restoration (Filling)", short: "F", color: "bg-sky-950/40 text-sky-300 border-sky-500/30", badgeBg: "#0EA5E9" },
  { value: "crown", label: "Crown / Cap", short: "Cr", color: "bg-amber-950/40 text-amber-300 border-amber-500/30", badgeBg: "#F59E0B" },
  { value: "missing", label: "Missing Tooth", short: "X", color: "bg-sand-50/10 text-sand-50/50 border-sand-50/20", badgeBg: "#71717A" },
  { value: "root_canal", label: "Root Canal (Endo)", short: "RC", color: "bg-purple-950/40 text-purple-300 border-purple-500/30", badgeBg: "#A855F7" },
  { value: "extraction_planned", label: "Plan Extraction", short: "Ex", color: "bg-orange-950/40 text-orange-300 border-orange-500/30", badgeBg: "#F97316" },
  { value: "watch", label: "Watch / Monitor", short: "W", color: "bg-yellow-950/40 text-yellow-300 border-yellow-500/30", badgeBg: "#EAB308" },
  { value: "other", label: "Other Condition", short: "?", color: "bg-sand-50/15 text-sand-50/70 border-sand-50/25", badgeBg: "#A1A1AA" },
];

export function isValidFdiTooth(n: number): boolean {
  return (ALL_FDI_TEETH as readonly number[]).includes(n);
}

export type ChartNotationSystem = "palmer" | "fdi" | "universal";

export interface ToothDisplayLabel {
  /** The primary number/letter to display on the tooth icon (e.g. "1" to "8", or "11" to "48") */
  label: string;
  /** Quadrant code: UR, UL, LL, LR */
  quadrantPrefix: "UR" | "UL" | "LL" | "LR";
  /** Descriptive quadrant name */
  quadrantName: string;
  /** Full clinical identifier (e.g. "UR1", "FDI 11", "#8") */
  fullLabel: string;
}

export function getToothLabel(fdiNumber: number, notation: ChartNotationSystem): ToothDisplayLabel {
  const quad = Math.floor(fdiNumber / 10);
  const pos = fdiNumber % 10;

  // Determine quadrant
  let quadrantPrefix: "UR" | "UL" | "LL" | "LR" = "UR";
  let quadrantName = "Upper Right (UR)";
  if (quad === 2 || quad === 6) {
    quadrantPrefix = "UL";
    quadrantName = "Upper Left (UL)";
  } else if (quad === 3 || quad === 7) {
    quadrantPrefix = "LL";
    quadrantName = "Lower Left (LL)";
  } else if (quad === 4 || quad === 8) {
    quadrantPrefix = "LR";
    quadrantName = "Lower Right (LR)";
  }

  const isPrimary = quad >= 5 && quad <= 8;
  const primaryLetters = ["A", "B", "C", "D", "E"];
  const palmerPos = isPrimary ? (primaryLetters[pos - 1] ?? String(pos)) : String(pos);

  // 1. 4-Quadrant Palmer Notation (1 to 8 per quadrant from midline)
  if (notation === "palmer") {
    return {
      label: palmerPos,
      quadrantPrefix,
      quadrantName,
      fullLabel: `${quadrantPrefix}${palmerPos}`,
    };
  }

  // 2. Universal Numbering System (1 to 32)
  if (notation === "universal") {
    const universalMap: Record<number, string> = {
      // Upper Adult
      18: "1", 17: "2", 16: "3", 15: "4", 14: "5", 13: "6", 12: "7", 11: "8",
      21: "9", 22: "10", 23: "11", 24: "12", 25: "13", 26: "14", 27: "15", 28: "16",
      // Lower Adult
      38: "17", 37: "18", 36: "19", 35: "20", 34: "21", 33: "22", 32: "23", 31: "24",
      41: "25", 42: "26", 43: "27", 44: "28", 45: "29", 46: "30", 47: "31", 48: "32",
      // Upper Primary
      55: "A", 54: "B", 53: "C", 52: "D", 51: "E",
      61: "F", 62: "G", 63: "H", 64: "I", 65: "J",
      // Lower Primary
      75: "K", 74: "L", 73: "M", 72: "N", 71: "O",
      81: "P", 82: "Q", 83: "R", 84: "S", 85: "T",
    };
    const uLabel = universalMap[fdiNumber] ?? String(fdiNumber);
    return {
      label: uLabel,
      quadrantPrefix,
      quadrantName,
      fullLabel: `#${uLabel}`,
    };
  }

  // 3. FDI 2-Digit World Dental Federation System (11 to 48)
  return {
    label: String(fdiNumber),
    quadrantPrefix,
    quadrantName,
    fullLabel: `FDI ${fdiNumber}`,
  };
}

export function conditionMeta(condition: ToothCondition) {
  return TOOTH_CONDITIONS.find((c) => c.value === condition) ?? TOOTH_CONDITIONS[TOOTH_CONDITIONS.length - 1];
}

export function parseToothCondition(raw: string): ToothCondition | null {
  const found = TOOTH_CONDITIONS.find((c) => c.value === raw);
  return found ? found.value : null;
}


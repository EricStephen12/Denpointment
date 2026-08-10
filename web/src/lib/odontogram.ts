import type { ToothCondition } from "@prisma/client";

/** Adult permanent teeth in FDI notation (display rows). */
export const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11] as const;
export const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28] as const;
export const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38] as const;
export const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41] as const;

/** Primary (kids) teeth in FDI notation. */
export const PRIMARY_UPPER_RIGHT = [55, 54, 53, 52, 51] as const;
export const PRIMARY_UPPER_LEFT = [61, 62, 63, 64, 65] as const;
export const PRIMARY_LOWER_LEFT = [71, 72, 73, 74, 75] as const;
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

export const TOOTH_CONDITIONS: {
  value: ToothCondition;
  label: string;
  short: string;
  color: string;
}[] = [
  { value: "healthy", label: "Healthy", short: "OK", color: "bg-turq-600/30 text-turq-200 border-turq-500/40" },
  { value: "caries", label: "Caries", short: "C", color: "bg-red-900/50 text-red-300 border-red-500/40" },
  { value: "filling", label: "Filling", short: "F", color: "bg-sky-900/50 text-sky-300 border-sky-500/40" },
  { value: "crown", label: "Crown", short: "Cr", color: "bg-amber-900/50 text-amber-300 border-amber-500/40" },
  { value: "missing", label: "Missing", short: "X", color: "bg-sand-50/10 text-sand-50/40 border-sand-50/20" },
  { value: "root_canal", label: "Root canal", short: "RC", color: "bg-violet-900/50 text-violet-300 border-violet-500/40" },
  { value: "extraction_planned", label: "Extract planned", short: "Ex", color: "bg-orange-900/50 text-orange-300 border-orange-500/40" },
  { value: "watch", label: "Watch", short: "W", color: "bg-yellow-900/40 text-yellow-300 border-yellow-500/40" },
  { value: "other", label: "Other", short: "?", color: "bg-sand-50/15 text-sand-50/70 border-sand-50/25" },
];

export function isValidFdiTooth(n: number): boolean {
  return (ALL_FDI_TEETH as readonly number[]).includes(n);
}

export function conditionMeta(condition: ToothCondition) {
  return TOOTH_CONDITIONS.find((c) => c.value === condition) ?? TOOTH_CONDITIONS[TOOTH_CONDITIONS.length - 1];
}

/** Solid fills for SVG tooth art (Tailwind classes don’t apply to SVG fill). */
export function conditionFill(condition: ToothCondition | null | undefined): {
  crown: string;
  root: string;
  stroke: string;
} {
  switch (condition) {
    case "caries":
      return { crown: "#7f1d1d", root: "#450a0a", stroke: "#f87171" };
    case "filling":
      return { crown: "#0c4a6e", root: "#082f49", stroke: "#38bdf8" };
    case "crown":
      return { crown: "#78350f", root: "#451a03", stroke: "#fbbf24" };
    case "missing":
      return { crown: "#3f3f46", root: "#27272a", stroke: "#71717a" };
    case "root_canal":
      return { crown: "#4c1d95", root: "#2e1065", stroke: "#c4b5fd" };
    case "extraction_planned":
      return { crown: "#7c2d12", root: "#431407", stroke: "#fb923c" };
    case "watch":
      return { crown: "#713f12", root: "#422006", stroke: "#facc15" };
    case "healthy":
      return { crown: "#134e4a", root: "#042f2e", stroke: "#2dd4bf" };
    case "other":
      return { crown: "#3f3f46", root: "#27272a", stroke: "#a1a1aa" };
    default:
      return { crown: "#1c1917", root: "#0c0a09", stroke: "#57534e" };
  }
}

export function parseToothCondition(raw: string): ToothCondition | null {
  const found = TOOTH_CONDITIONS.find((c) => c.value === raw);
  return found ? found.value : null;
}

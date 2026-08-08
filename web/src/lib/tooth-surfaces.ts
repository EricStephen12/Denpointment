export const TOOTH_SURFACES = ["M", "D", "O", "B", "L", "I"] as const;
export type ToothSurface = (typeof TOOTH_SURFACES)[number];

const SURFACE_SET = new Set<string>(TOOTH_SURFACES);

export function parseSurfaces(raw: string | null | undefined): ToothSurface[] {
  if (!raw) return [];
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim().toUpperCase())
    .filter((s): s is ToothSurface => SURFACE_SET.has(s));
}

export function serializeSurfaces(surfaces: string[]): string | null {
  const unique = Array.from(
    new Set(
      surfaces
        .map((s) => s.trim().toUpperCase())
        .filter((s) => SURFACE_SET.has(s)),
    ),
  );
  return unique.length ? unique.join(",") : null;
}

export function parseSurfacesFromForm(raw: FormDataEntryValue | null): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().toUpperCase();
  if (!trimmed) return null;
  // Accept "MOD" or "M,O,D" / "M O D"
  if (/^[MDOLBI]+$/.test(trimmed)) {
    return serializeSurfaces(trimmed.split(""));
  }
  return serializeSurfaces(parseSurfaces(trimmed));
}

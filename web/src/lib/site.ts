import { cache } from "react";
import { prisma } from "@/lib/prisma";
import {
  CLINIC_NAME,
  CLINIC_TAGLINE,
  CLINIC_ADDRESS,
  CLINIC_PHONE,
  CLINIC_EMAIL,
  CLINIC_HOURS,
  CLINIC_RATING,
  CLINIC_REVIEW_COUNT,
  CLINIC_LOCATION,
  HERO_LINE_1,
  HERO_LINE_2,
  PHILOSOPHY_LINE_1,
  PHILOSOPHY_LINE_2,
  DEFAULT_PACKAGES,
} from "@/lib/constants";

/**
 * Accent color presets an admin can pick from Dashboard → Website.
 * Each preset overrides the `--color-turq-*` CSS variables site-wide,
 * so the whole app (marketing pages + dashboard) recolors at once.
 */
export const ACCENT_PRESETS = {
  turquoise: { 100: "#dcf5ef", 200: "#b3e8dc", 300: "#8fe0d1", 400: "#5cccb8", 500: "#34a894", 600: "#248473", 700: "#1a6758" },
  ocean:     { 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd", 400: "#60a5fa", 500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8" },
  violet:    { 100: "#ede9fe", 200: "#ddd6fe", 300: "#c4b5fd", 400: "#a78bfa", 500: "#8b5cf6", 600: "#7c3aed", 700: "#6d28d9" },
  rose:      { 100: "#ffe4e6", 200: "#fecdd3", 300: "#fda4af", 400: "#fb7185", 500: "#f43f5e", 600: "#e11d48", 700: "#be123c" },
  gold:      { 100: "#fef3c7", 200: "#fde68a", 300: "#fcd34d", 400: "#fbbf24", 500: "#f59e0b", 600: "#d97706", 700: "#b45309" },
  emerald:   { 100: "#d1fae5", 200: "#a7f3d0", 300: "#6ee7b9", 400: "#34d399", 500: "#10b981", 600: "#059669", 700: "#047857" },
} as const;

export type AccentColorName = keyof typeof ACCENT_PRESETS;

export function isAccentColorName(value: string): value is AccentColorName {
  return value in ACCENT_PRESETS;
}

export type SitePackage = {
  title: string;
  price: number;
  desc: string;
};

export type SiteContent = {
  clinicName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  hoursLabel: string;
  location: string;
  heroLine1: string;
  heroLine2: string;
  philosophyLine1: string;
  philosophyLine2: string;
  rating: string;
  reviewCount: string;
  accentColor: AccentColorName;
  packages: SitePackage[];
};

export const SITE_DEFAULTS: SiteContent = {
  clinicName: CLINIC_NAME,
  tagline: CLINIC_TAGLINE,
  phone: CLINIC_PHONE,
  email: CLINIC_EMAIL,
  address: CLINIC_ADDRESS,
  hoursLabel: CLINIC_HOURS,
  location: CLINIC_LOCATION,
  heroLine1: HERO_LINE_1,
  heroLine2: HERO_LINE_2,
  philosophyLine1: PHILOSOPHY_LINE_1,
  philosophyLine2: PHILOSOPHY_LINE_2,
  rating: CLINIC_RATING,
  reviewCount: CLINIC_REVIEW_COUNT,
  accentColor: "turquoise",
  packages: DEFAULT_PACKAGES,
};

function parsePackages(value: unknown): SitePackage[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const parsed = value.filter(
    (p): p is SitePackage =>
      typeof p === "object" && p !== null &&
      typeof (p as SitePackage).title === "string" &&
      typeof (p as SitePackage).price === "number" &&
      typeof (p as SitePackage).desc === "string",
  );
  return parsed.length > 0 ? parsed : null;
}

/**
 * Loads the admin-editable website content (singleton row), falling back to
 * the defaults in lib/constants.ts for any field that hasn't been customized.
 * Cached per-request so layout + page can both call it with a single query.
 * Degrades to pure defaults if the database is unreachable, so the marketing
 * site never hard-fails on a DB outage.
 */
export const getSiteContent = cache(async (): Promise<SiteContent> => {
  let row = null;
  try {
    row = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  } catch (error) {
    console.error("[site] Failed to load site settings — serving defaults:", error);
  }
  if (!row) return SITE_DEFAULTS;

  return {
    clinicName: row.clinicName || SITE_DEFAULTS.clinicName,
    tagline: row.tagline || SITE_DEFAULTS.tagline,
    phone: row.phone || SITE_DEFAULTS.phone,
    email: row.email || SITE_DEFAULTS.email,
    address: row.address || SITE_DEFAULTS.address,
    hoursLabel: row.hoursLabel || SITE_DEFAULTS.hoursLabel,
    location: row.location || SITE_DEFAULTS.location,
    heroLine1: row.heroLine1 || SITE_DEFAULTS.heroLine1,
    heroLine2: row.heroLine2 || SITE_DEFAULTS.heroLine2,
    philosophyLine1: row.philosophyLine1 || SITE_DEFAULTS.philosophyLine1,
    philosophyLine2: row.philosophyLine2 || SITE_DEFAULTS.philosophyLine2,
    rating: row.rating || SITE_DEFAULTS.rating,
    reviewCount: row.reviewCount || SITE_DEFAULTS.reviewCount,
    accentColor:
      row.accentColor && isAccentColorName(row.accentColor)
        ? row.accentColor
        : SITE_DEFAULTS.accentColor,
    packages: parsePackages(row.packages) ?? SITE_DEFAULTS.packages,
  };
});

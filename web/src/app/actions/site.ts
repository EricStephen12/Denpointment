"use server"

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isAdmin } from "@/lib/auth";
import { isAccentColorName, type SitePackage } from "@/lib/site";

async function requireAdmin() {
  const person = await getCurrentPerson();
  if (!person || !isAdmin(person)) {
    throw new Error("You're not authorized to manage the website.");
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(formData: FormData, name: string, maxLength: number): string | null {
  const value = ((formData.get(name) as string) || "").trim();
  if (!value) return null;
  if (value.length > maxLength) {
    throw new Error(`"${name}" is too long (max ${maxLength} characters).`);
  }
  return value;
}

function parsePackagesForm(formData: FormData): SitePackage[] | null {
  const packages: SitePackage[] = [];
  const MAX = 12;

  for (let i = 0; i < MAX; i++) {
    const title = ((formData.get(`pkgTitle${i}`) as string) || "").trim();
    const priceRaw = ((formData.get(`pkgPrice${i}`) as string) || "").trim();
    const desc = ((formData.get(`pkgDesc${i}`) as string) || "").trim();

    // Stop when this index and higher have no fields at all (removed trailing rows).
    if (!title && !priceRaw && !desc) {
      const hasLater = Array.from({ length: MAX - i - 1 }, (_, k) => i + 1 + k).some((j) => {
        const t = ((formData.get(`pkgTitle${j}`) as string) || "").trim();
        const p = ((formData.get(`pkgPrice${j}`) as string) || "").trim();
        const d = ((formData.get(`pkgDesc${j}`) as string) || "").trim();
        return Boolean(t || p || d);
      });
      if (!hasLater) break;
      continue;
    }

    if (!title || !priceRaw || !desc) {
      throw new Error(
        `Package ${i + 1} needs a title, price, and description (or clear/remove the row).`,
      );
    }
    const price = parseInt(priceRaw, 10);
    if (Number.isNaN(price) || price < 0) {
      throw new Error(`Package ${i + 1} has an invalid price.`);
    }
    packages.push({
      title: title.slice(0, 40),
      price,
      desc: desc.slice(0, 200),
    });
  }

  return packages.length > 0 ? packages : null;
}

/**
 * Saves the admin-editable website content (Dashboard → Website).
 * Empty fields are stored as null and fall back to the code defaults.
 */
export async function updateSiteSettings(formData: FormData) {
  await requireAdmin();

  const email = text(formData, "email", 60);
  if (email && !EMAIL_RE.test(email)) {
    throw new Error("Please enter a valid contact email address.");
  }

  const rating = text(formData, "rating", 4);
  if (rating) {
    const num = parseFloat(rating);
    if (Number.isNaN(num) || num < 0 || num > 5) {
      throw new Error("Rating must be a number between 0 and 5.");
    }
  }

  const accentColorRaw = ((formData.get("accentColor") as string) || "").trim();
  if (accentColorRaw && !isAccentColorName(accentColorRaw)) {
    throw new Error("Please pick a valid accent color.");
  }

  const packages = parsePackagesForm(formData);

  const data = {
    clinicName: text(formData, "clinicName", 60),
    tagline: text(formData, "tagline", 200),
    phone: text(formData, "phone", 20),
    email,
    address: text(formData, "address", 120),
    hoursLabel: text(formData, "hoursLabel", 60),
    location: text(formData, "location", 60),
    heroLine1: text(formData, "heroLine1", 40),
    heroLine2: text(formData, "heroLine2", 40),
    philosophyLine1: text(formData, "philosophyLine1", 200),
    philosophyLine2: text(formData, "philosophyLine2", 200),
    rating,
    reviewCount: text(formData, "reviewCount", 10),
    accentColor: accentColorRaw || null,
    packages: packages ?? Prisma.JsonNull,
  };

  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  });

  // Content appears in the root layout, marketing pages, and emails —
  // revalidate everything under the root layout in one go.
  revalidatePath("/", "layout");
  redirect("/dashboard/admin/site?saved=1");
}

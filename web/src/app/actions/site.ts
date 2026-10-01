"use server"

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, hasCapability } from "@/lib/auth";
import { isAccentColorName } from "@/lib/site";

async function requireAdmin() {
  const person = await getCurrentPerson();
  if (!hasCapability(person, "manageClinic")) {
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
    packages: Prisma.JsonNull,
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

import React from "react";
import { redirect } from "next/navigation";
import { getCurrentPerson, isAdmin } from "@/lib/auth";
import { getSiteContent, ACCENT_PRESETS, type AccentColorName } from "@/lib/site";
import { updateSiteSettings } from "@/app/actions/site";
import { Palette } from "lucide-react";
import PackageFieldsEditor from "@/components/dashboards/PackageFieldsEditor";

export default async function WebsiteSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isAdmin(dbUser)) redirect("/dashboard");

  const { saved } = await searchParams;
  const site = await getSiteContent();
  const accentNames = Object.keys(ACCENT_PRESETS) as AccentColorName[];

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg bg-turq-600/20">
          <Palette className="h-5 w-5 text-turq-400" />
        </div>
        <div>
          <h1 className="dash-title font-display">Website</h1>
          <p className="dash-body mt-0.5">
            Edit clinic write-ups, contact details, accent color, and package prices — no code needed.
          </p>
        </div>
      </div>

      {saved === "1" && (
        <div className="mb-6 rounded-lg border border-turq-500/30 bg-turq-600/10 px-4 py-3 text-sm text-turq-300">
          Website settings saved. Marketing pages will reflect these changes shortly.
        </div>
      )}

      <form action={updateSiteSettings} className="space-y-10">
        {/* Brand & contact */}
        <section className="dash-surface p-5 space-y-4">
          <h2 className="text-sm font-semibold text-sand-50">Brand &amp; Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Clinic name" name="clinicName" defaultValue={site.clinicName} maxLength={60} />
            <Field label="Location label" name="location" defaultValue={site.location} maxLength={60} />
            <div className="md:col-span-2">
              <Field label="Tagline" name="tagline" defaultValue={site.tagline} maxLength={200} />
            </div>
            <Field label="Phone" name="phone" defaultValue={site.phone} maxLength={20} />
            <Field label="Email" name="email" type="email" defaultValue={site.email} maxLength={60} />
            <div className="md:col-span-2">
              <Field label="Address" name="address" defaultValue={site.address} maxLength={120} />
            </div>
            <Field label="Hours label" name="hoursLabel" defaultValue={site.hoursLabel} maxLength={60} />
          </div>
        </section>

        {/* Hero & philosophy */}
        <section className="dash-surface p-5 space-y-4">
          <h2 className="text-sm font-semibold text-sand-50">Hero &amp; Philosophy</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Hero line 1" name="heroLine1" defaultValue={site.heroLine1} maxLength={40} />
            <Field label="Hero line 2" name="heroLine2" defaultValue={site.heroLine2} maxLength={40} />
            <div className="md:col-span-2">
              <Field label="Philosophy line 1" name="philosophyLine1" defaultValue={site.philosophyLine1} maxLength={200} />
            </div>
            <div className="md:col-span-2">
              <Field label="Philosophy line 2" name="philosophyLine2" defaultValue={site.philosophyLine2} maxLength={200} />
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section className="dash-surface p-5 space-y-4">
          <h2 className="text-sm font-semibold text-sand-50">Reviews</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Rating (0–5)" name="rating" defaultValue={site.rating} maxLength={4} placeholder="4.6" />
            <Field label="Review count label" name="reviewCount" defaultValue={site.reviewCount} maxLength={10} placeholder="16" />
          </div>
        </section>

        {/* Accent color */}
        <section className="dash-surface p-5 space-y-4">
          <h2 className="text-sm font-semibold text-sand-50">Accent Color</h2>
          <p className="text-xs text-sand-50/40">
            Recolors buttons, links, and highlights across the marketing site and dashboard.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {accentNames.map((name) => {
              const swatch = ACCENT_PRESETS[name][500];
              return (
                <label
                  key={name}
                  className="flex flex-col items-center gap-2 cursor-pointer rounded-lg border border-sand-50/10 p-3 hover:border-sand-50/30 transition-colors has-[:checked]:border-turq-400 has-[:checked]:bg-turq-600/10"
                >
                  <input
                    type="radio"
                    name="accentColor"
                    value={name}
                    defaultChecked={site.accentColor === name}
                    className="sr-only"
                  />
                  <span
                    className="h-8 w-8 rounded-full ring-2 ring-sand-50/10"
                    style={{ backgroundColor: swatch }}
                    aria-hidden
                  />
                  <span className="text-[10px] uppercase tracking-wider text-sand-50/60 capitalize">{name}</span>
                </label>
              );
            })}
          </div>
        </section>

        {/* Packages */}
        <section className="dash-surface p-5 space-y-4">
          <h2 className="text-sm font-semibold text-sand-50">Featured Packages</h2>
          <PackageFieldsEditor
            initial={site.packages.map((pkg) => ({
              title: pkg.title,
              price: String(pkg.price),
              desc: pkg.desc,
            }))}
          />
        </section>

        <button
          type="submit"
          className="bg-turq-600 text-ink-950 py-2.5 px-6 rounded-lg font-semibold text-sm hover:bg-turq-500 transition-colors"
        >
          Save Website Settings
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  maxLength,
  type = "text",
  placeholder,
  min,
}: {
  label: string;
  name: string;
  defaultValue: string;
  maxLength?: number;
  type?: string;
  placeholder?: string;
  min?: number;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs font-medium text-sand-50/50 mb-1">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        maxLength={maxLength}
        placeholder={placeholder}
        min={min}
        className="dash-input"
      />
    </div>
  );
}

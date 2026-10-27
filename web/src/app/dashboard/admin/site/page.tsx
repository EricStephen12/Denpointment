import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentPerson, isAdmin } from "@/lib/auth";
import { getSiteContent, ACCENT_PRESETS, type AccentColorName } from "@/lib/site";
import { updateSiteSettings } from "@/app/actions/site";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Globe, Palette, CheckCircle2, Building, MessageSquare, Star } from "lucide-react";

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
    <div className="space-y-6">
      <AdminPageHeader
        section="Configuration"
        title="Website Branding & Content"
        description="Customize public clinic identity, marketing page copy, social contact details, and brand theme accents."
        action={
          <Link
            href="/dashboard/admin/settings#pricing"
            className="inline-flex items-center gap-1.5 rounded-xl border border-sand-50/15 px-3.5 py-2 text-xs font-semibold text-sand-50/80 transition-colors hover:border-turq-400/40 hover:text-turq-400 bg-ink-900 shadow-sm"
          >
            Procedure Fee Schedule →
          </Link>
        }
      />

      {saved === "1" && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/40 flex items-center gap-3 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Website settings successfully saved. Public website pages will immediately reflect these updates.</span>
        </div>
      )}

      <form action={updateSiteSettings} className="space-y-6">
        {/* Brand & contact info */}
        <section className="bg-ink-900 border border-sand-50/10 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-sand-50/10">
            <div className="p-2 rounded-xl bg-turq-500/10 text-turq-400">
              <Building className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-sand-50">Clinic Identity &amp; Contact Details</h2>
              <p className="text-xs text-sand-50/40">Visible across website header, footer, and patient notifications</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Clinic Legal / Brand Name" name="clinicName" defaultValue={site.clinicName} maxLength={60} />
            <Field label="City / Region Label" name="location" defaultValue={site.location} maxLength={60} />
            <div className="md:col-span-2">
              <Field label="Brand Tagline" name="tagline" defaultValue={site.tagline} maxLength={200} />
            </div>
            <Field label="Official Reception Phone" name="phone" defaultValue={site.phone} maxLength={20} />
            <Field label="Support / Booking Email" name="email" type="email" defaultValue={site.email} maxLength={60} />
            <div className="md:col-span-2">
              <Field label="Clinic Physical Address" name="address" defaultValue={site.address} maxLength={120} />
            </div>
            <div className="md:col-span-2 space-y-1">
              <Field
                label="Footer Operating Hours Label"
                name="hoursLabel"
                defaultValue={site.hoursLabel}
                maxLength={60}
                placeholder="e.g. Mon – Fri: 8:00 AM – 6:00 PM · Sat: 9:00 AM – 2:00 PM"
              />
              <p className="text-[11px] text-sand-50/40">
                Marketing text displayed on the website footer. To adjust actual appointment booking hours, configure{" "}
                <Link href="/dashboard/admin/settings" className="text-turq-400 hover:underline">
                  Clinic Schedule &amp; Working Days
                </Link>.
              </p>
            </div>
          </div>
        </section>

        {/* Hero & Philosophy */}
        <section className="bg-ink-900 border border-sand-50/10 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-sand-50/10">
            <div className="p-2 rounded-xl bg-turq-500/10 text-turq-400">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-sand-50">Homepage Marketing Copy</h2>
              <p className="text-xs text-sand-50/40">Hero headers and clinic mission statement</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Hero Heading Line 1" name="heroLine1" defaultValue={site.heroLine1} maxLength={40} />
            <Field label="Hero Heading Line 2" name="heroLine2" defaultValue={site.heroLine2} maxLength={40} />
            <div className="md:col-span-2">
              <Field label="Philosophy Statement (Part 1)" name="philosophyLine1" defaultValue={site.philosophyLine1} maxLength={200} />
            </div>
            <div className="md:col-span-2">
              <Field label="Philosophy Statement (Part 2)" name="philosophyLine2" defaultValue={site.philosophyLine2} maxLength={200} />
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section className="bg-ink-900 border border-sand-50/10 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-sand-50/10">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Star className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-sand-50">Social Proof &amp; Reviews</h2>
              <p className="text-xs text-sand-50/40">Overall Google/Trustpilot rating display</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Rating (0.0 – 5.0)" name="rating" defaultValue={site.rating} maxLength={4} placeholder="4.9" />
            <Field label="Review Count Display" name="reviewCount" defaultValue={site.reviewCount} maxLength={10} placeholder="1,240+" />
          </div>
        </section>

        {/* Accent Color Preset Palette */}
        <section className="bg-ink-900 border border-sand-50/10 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-sand-50/10">
            <div className="p-2 rounded-xl bg-turq-500/10 text-turq-400">
              <Palette className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-sand-50">Brand Accent Theme</h2>
              <p className="text-xs text-sand-50/40">Select the primary accent color across buttons, pills, and highlights</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {accentNames.map((name) => {
              const swatch = ACCENT_PRESETS[name][500];
              return (
                <label
                  key={name}
                  className="flex flex-col items-center gap-2.5 cursor-pointer rounded-xl border border-sand-50/10 p-4 hover:border-sand-50/30 transition-all has-[:checked]:border-turq-400 has-[:checked]:bg-turq-500/10 bg-sand-50/[0.01]"
                >
                  <input
                    type="radio"
                    name="accentColor"
                    value={name}
                    defaultChecked={site.accentColor === name}
                    className="sr-only"
                  />
                  <span
                    className="h-9 w-9 rounded-full ring-2 ring-sand-50/20 shadow-md transition-transform group-hover:scale-105"
                    style={{ backgroundColor: swatch }}
                    aria-hidden
                  />
                  <span className="text-xs font-semibold uppercase tracking-wider text-sand-50/80 capitalize">
                    {name}
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            className="bg-turq-500 hover:bg-turq-400 text-ink-950 py-3 px-6 rounded-xl font-bold text-xs transition-all shadow-md shadow-turq-500/10 cursor-pointer"
          >
            Save Website &amp; Brand Settings
          </button>
        </div>
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
      <label htmlFor={name} className="block text-xs font-semibold uppercase tracking-wider text-sand-50/50 mb-1.5">
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
        className="w-full px-3.5 py-2.5 bg-ink-950 border border-sand-50/10 rounded-xl text-xs text-sand-50 focus:outline-none focus:border-turq-500 placeholder:text-sand-50/30"
      />
    </div>
  );
}

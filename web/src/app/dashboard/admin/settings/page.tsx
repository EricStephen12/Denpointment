import React from 'react';
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isAdmin } from "@/lib/auth";
import {
  updateClinicHours,
  createService,
} from "@/app/actions/settings";
import { Plus, DollarSign, Clock, Globe } from 'lucide-react';
import { formatNaira } from "@/lib/currency";
import ServiceRowActions from "@/components/admin/ServiceRowActions";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import SubmitButton from "@/components/common/SubmitButton";

const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export default async function ClinicSettingsPage() {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isAdmin(dbUser)) redirect("/dashboard");

  const settings = await prisma.clinicSettings.findUnique({ where: { id: 1 } });
  const openHour = settings?.openHour ?? 8;
  const closeHour = settings?.closeHour ?? 18;
  const workingDays = settings?.workingDays ?? [1, 2, 3, 4, 5];

  const services = await prisma.service.findMany({ orderBy: { name: 'asc' } });

  return (
    <div>
      <AdminPageHeader
        section="Configuration"
        title="Hours & Fee Schedule"
        description="Set clinic operating hours and manage official procedure catalog fees used for billing."
        action={
          <Link
            href="/dashboard/admin/site"
            className="inline-flex items-center gap-1.5 rounded-xl border border-sand-50/15 px-3.5 py-2 text-xs font-medium text-sand-50/70 transition-colors hover:border-turq-400/30 hover:text-turq-400"
          >
            <Globe className="h-3.5 w-3.5 text-turq-400" /> Website Branding
          </Link>
        }
      />

      <div className="space-y-8">
        {/* 1. Operating Hours Card */}
        <section className="dash-surface p-6 rounded-2xl border border-sand-50/10">
          <div className="flex items-center gap-2.5 pb-4 border-b border-sand-50/10 mb-5">
            <div className="p-2 rounded-xl bg-turq-500/10 text-turq-400">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-sand-50">Clinic Schedule & Working Days</h2>
              <p className="text-xs text-sand-50/50">
                Controls available booking slots generated across the appointment calendar.
              </p>
            </div>
          </div>

          <form action={updateClinicHours} className="space-y-5 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="openHour" className="block text-xs font-semibold uppercase tracking-wider text-sand-50/50 mb-1.5">
                  Opening Time
                </label>
                <select id="openHour" name="openHour" defaultValue={openHour} className="dash-input">
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h}>{h < 10 ? `0${h}` : h}:00 {h >= 12 ? "PM" : "AM"}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="closeHour" className="block text-xs font-semibold uppercase tracking-wider text-sand-50/50 mb-1.5">
                  Closing Time
                </label>
                <select id="closeHour" name="closeHour" defaultValue={closeHour} className="dash-input">
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h}>{h < 10 ? `0${h}` : h}:00 {h >= 12 ? "PM" : "AM"}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-sand-50/50 mb-2">
                Active Working Days
              </span>
              <div className="flex flex-wrap gap-2.5">
                {WEEKDAYS.map((d) => {
                  const isChecked = workingDays.includes(d.value);
                  return (
                    <label
                      key={d.value}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-sand-50/10 hover:border-sand-50/20 bg-white/[0.02] cursor-pointer text-xs font-medium text-sand-50/80 transition-colors"
                    >
                      <input
                        type="checkbox"
                        name="workingDays"
                        value={d.value}
                        defaultChecked={isChecked}
                        className="rounded border-sand-50/20 bg-ink-950 text-turq-500 focus:ring-0"
                      />
                      <span>{d.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <SubmitButton
                pendingText="Saving..."
                className="bg-turq-500 hover:bg-turq-400 text-ink-950 px-5 py-2.5 rounded-xl font-semibold text-xs transition-colors shadow-sm"
              >
                Save Schedule Settings
              </SubmitButton>
            </div>
          </form>
        </section>

        {/* 2. Fee Schedule Card */}
        <section className="dash-surface p-6 rounded-2xl border border-sand-50/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-sand-50/10 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <DollarSign className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold font-display text-sand-50">Procedure Catalog & Fees</h2>
                <p className="text-xs text-sand-50/50">
                  Standard billing rates applied when recording treatments and issuing invoices.
                </p>
              </div>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-sand-50/5 text-sand-50/60 border border-sand-50/10 self-start sm:self-auto">
              {services.length} Total Procedures
            </span>
          </div>

          {/* Add Procedure Form */}
          <form action={createService} className="mb-6 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              name="name"
              required
              placeholder="Procedure name (e.g. Scaling & Polishing, Root Canal)"
              className="dash-input flex-1 text-xs"
            />
            <input
              type="number"
              name="price"
              required
              min={0}
              placeholder="Fee (₦)"
              className="dash-input sm:w-40 text-xs"
            />
            <SubmitButton
              pendingText="Adding..."
              icon={<Plus className="h-4 w-4" />}
              className="bg-turq-500 hover:bg-turq-400 text-ink-950 px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors shrink-0 shadow-sm"
            >
              Add Procedure
            </SubmitButton>
          </form>

          {/* Procedures Table */}
          <div className="overflow-x-auto rounded-xl border border-sand-50/10">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-sand-50/10 bg-white/[0.02] text-[10px] uppercase font-bold text-sand-50/40 tracking-wider">
                  <th className="py-3 px-4">Procedure</th>
                  <th className="py-3 px-4">Standard Fee</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-50/5">
                {services.length > 0 ? (
                  services.map((s) => (
                    <tr key={s.serviceId} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-medium text-sand-50">{s.name}</td>
                      <td className="py-3 px-4 font-semibold text-sand-50 tabular-nums">
                        {formatNaira(s.price)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            s.active
                              ? "bg-turq-500/10 text-turq-300 border-turq-500/20"
                              : "bg-sand-50/5 text-sand-50/40 border-sand-50/10"
                          }`}
                        >
                          {s.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <ServiceRowActions service={s} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-sand-50/40">
                      No procedures added yet. Use the form above to add your first procedure.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

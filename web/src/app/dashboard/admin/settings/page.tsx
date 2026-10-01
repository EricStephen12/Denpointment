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
        section="Practice setup"
        title="Hours and Fee Schedule"
        description="Configure appointment booking hours and maintain the official clinical procedure prices used for patient billing."
        action={
          <Link
            href="/dashboard/admin/site#packages"
            className="inline-flex items-center gap-1.5 rounded-lg border border-sand-50/15 px-3 py-2 text-xs font-medium text-sand-50/70 transition-colors hover:border-turq-400/30 hover:text-turq-400"
          >
            <Globe className="h-3.5 w-3.5 text-turq-400" /> Public Website Packages →
          </Link>
        }
      />

      {/* Quick Jump Bar */}
      <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-ink-900/80 border border-sand-50/10 my-6">
        <span className="text-xs font-semibold text-sand-50/40 uppercase tracking-wider px-2">Jump to:</span>
        <a href="#hours" className="px-3 py-1.5 rounded-lg text-xs font-medium bg-sand-50/5 hover:bg-turq-500/15 text-sand-50/80 hover:text-turq-300 border border-sand-50/10 transition-colors">
          🕒 Clinic Schedule &amp; Working Days
        </a>
        <a href="#pricing" className="px-3 py-1.5 rounded-lg text-xs font-medium bg-sand-50/5 hover:bg-turq-500/15 text-sand-50/80 hover:text-turq-300 border border-sand-50/10 transition-colors">
          🏷️ Clinical Fee Schedule ({services.length} services)
        </a>
      </div>

      <div className="space-y-10">
        {/* Business hours */}
        <div id="hours" className="scroll-mt-24">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-turq-400" />
            <h2 className="text-base font-semibold text-sand-50">Clinic Operating Hours &amp; Working Days</h2>
          </div>
          <p className="mb-4 text-xs text-sand-50/60">
            These hours determine available chair time slots generated on the appointment calendar and booking desk.
          </p>
          <form action={updateClinicHours} className="dash-surface max-w-3xl rounded-lg p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="openHour" className="block text-xs font-medium text-sand-50/50 mb-1">Opens at</label>
                <select id="openHour" name="openHour" defaultValue={openHour} className="dash-input">
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h}>{h}:00</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="closeHour" className="block text-xs font-medium text-sand-50/50 mb-1">Closes at</label>
                <select id="closeHour" name="closeHour" defaultValue={closeHour} className="dash-input">
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h}>{h}:00</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <span className="block text-xs font-medium text-sand-50/50 mb-2">Working Days</span>
              <div className="flex flex-wrap gap-3">
                {WEEKDAYS.map((d) => (
                  <label key={d.value} className="flex items-center gap-1.5 text-sm text-sand-50/70 cursor-pointer">
                    <input type="checkbox" name="workingDays" value={d.value} defaultChecked={workingDays.includes(d.value)} />
                    {d.label}
                  </label>
                ))}
              </div>
            </div>
            <button type="submit"
              className="bg-turq-600 text-ink-950 py-2.5 px-4 rounded-lg font-semibold text-sm hover:bg-turq-500 transition-colors">
              Save Business Hours
            </button>
          </form>
        </div>

        {/* Services / Fee Schedule */}
        <div id="pricing" className="scroll-mt-24">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-turq-400" />
            <h2 className="text-base font-semibold text-sand-50">Clinical Procedure Fee Schedule (Billing Prices)</h2>
          </div>
          <p className="mb-4 text-xs text-sand-50/60 leading-relaxed max-w-3xl">
            These are the official clinical charges used across the practice. When receptionists or dentists checkout a patient under <Link href="/dashboard/admin/billing" className="text-turq-300 underline font-medium">Billing &amp; Payments</Link>, the system loads these procedure fees.
          </p>
          <form action={createService} className="dash-surface mb-4 flex max-w-3xl flex-col gap-3 rounded-lg p-4 sm:flex-row">
            <input type="text" name="name" required placeholder="Service name (e.g. Scaling & Polishing, Root Canal)"
              className="dash-input flex-1" />
            <input type="number" name="price" required min={0} placeholder="Price (₦)"
              className="dash-input sm:w-36" />
            <button type="submit" className="bg-turq-600 text-ink-950 px-4 rounded-lg font-semibold text-sm hover:bg-turq-500 transition-colors flex items-center gap-1 shrink-0">
              <Plus className="h-4 w-4" /> Add Procedure
            </button>
          </form>

          <div className="dash-table-wrap max-w-5xl">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.length > 0 ? services.map((s) => (
                  <tr key={s.serviceId}>
                    <td className="td-primary">{s.name}</td>
                    <td>{formatNaira(s.price)}</td>
                    <td>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${s.active ? 'bg-turq-600/20 text-turq-300' : 'bg-sand-50/8 text-sand-50/40'}`}>
                        {s.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-right">
                      <ServiceRowActions service={s} />
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="td-empty">No services yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isAdmin } from "@/lib/auth";
import {
  updateClinicHours,
  createService,
  toggleServiceActive,
  updateService,
  deleteService,
} from "@/app/actions/settings";
import { Settings, Plus, DollarSign, Pencil, Trash2 } from 'lucide-react';
import { formatNaira } from "@/lib/currency";

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
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg bg-purple-500/20">
          <Settings className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h1 className="dash-title font-display">Clinic Settings</h1>
          <p className="dash-body mt-0.5">Business hours and the service price list used across the clinic.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Business hours */}
        <div>
          <h2 className="text-sm font-semibold text-sand-50 mb-4">Business Hours</h2>
          <form action={updateClinicHours} className="dash-surface p-5 space-y-4">
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

        {/* Services */}
        <div>
          <h2 className="text-sm font-semibold text-sand-50 mb-4 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-sand-50/50" /> Service Price List
          </h2>
          <form action={createService} className="dash-surface p-4 flex gap-3 mb-4">
            <input type="text" name="name" required placeholder="Service name (e.g. Cleaning)"
              className="dash-input flex-1" />
            <input type="number" name="price" required min={0} placeholder="Price (₦)"
              className="dash-input w-28" />
            <button type="submit" className="bg-turq-600 text-ink-950 px-4 rounded-lg font-semibold text-sm hover:bg-turq-500 transition-colors flex items-center gap-1 shrink-0">
              <Plus className="h-4 w-4" /> Add
            </button>
          </form>

          <div className="dash-table-wrap">
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
                      <div className="flex items-center justify-end gap-3">
                        {/* Toggle active */}
                        <form action={toggleServiceActive} className="inline">
                          <input type="hidden" name="serviceId" value={s.serviceId} />
                          <input type="hidden" name="active" value={String(s.active)} />
                          <button type="submit" className="text-xs text-sand-50/50 hover:text-turq-400 font-medium transition-colors">
                            {s.active ? 'Deactivate' : 'Activate'}
                          </button>
                        </form>

                        {/* Edit — inline popover form using details/summary */}
                        <details className="relative inline-block group">
                          <summary className="cursor-pointer text-xs text-turq-400 hover:text-turq-300 font-medium list-none flex items-center gap-1 transition-colors">
                            <Pencil className="h-3 w-3" /> Edit
                          </summary>
                          <div className="absolute right-0 top-6 z-20 w-72 bg-ink-900 border border-sand-50/15 rounded-xl p-4 shadow-2xl">
                            <p className="text-xs font-semibold text-sand-50/60 mb-3 uppercase tracking-wider">Edit Service</p>
                            <form action={updateService} className="space-y-3">
                              <input type="hidden" name="serviceId" value={s.serviceId} />
                              <div>
                                <label className="block text-[10px] text-sand-50/40 mb-1">Name</label>
                                <input
                                  type="text"
                                  name="name"
                                  required
                                  maxLength={100}
                                  defaultValue={s.name}
                                  className="dash-input w-full"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-sand-50/40 mb-1">Price (₦)</label>
                                <input
                                  type="number"
                                  name="price"
                                  required
                                  min={0}
                                  defaultValue={s.price}
                                  className="dash-input w-full"
                                />
                              </div>
                              <button
                                type="submit"
                                className="w-full bg-turq-600 text-ink-950 py-2 rounded-lg text-xs font-semibold hover:bg-turq-500 transition-colors"
                              >
                                Save Changes
                              </button>
                            </form>
                          </div>
                        </details>

                        {/* Delete — only if no treatments linked (server validates too) */}
                        <form action={deleteService} className="inline">
                          <input type="hidden" name="serviceId" value={s.serviceId} />
                          <button
                            type="submit"
                            className="text-xs text-red-400/70 hover:text-red-300 font-medium flex items-center gap-1 transition-colors"
                            onClick={(e) => {
                              if (!confirm(`Delete "${s.name}"? This will fail if the service is used in any treatment records.`)) {
                                e.preventDefault();
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </form>
                      </div>
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

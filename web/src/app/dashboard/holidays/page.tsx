import React from 'react';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isDentist } from "@/lib/auth";
import { addHoliday, deleteHoliday } from "@/app/actions/holidays";
import { Palmtree, Trash2 } from 'lucide-react';

export default async function HolidaysPage() {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isDentist(dbUser)) redirect("/dashboard");

  const dentistId = dbUser.dentists[0].dentistId;
  const now = new Date();

  const holidays = await prisma.holidayDate.findMany({
    where: { restingId: dentistId },
    orderBy: { restDate: 'asc' },
  });

  const upcoming = holidays.filter((h) => h.restDate >= now);
  const past = holidays.filter((h) => h.restDate < now).reverse();

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="dash-icon-badge">
          <Palmtree className="h-5 w-5 text-turq-400" />
        </div>
        <div>
          <h1 className="dash-title font-display">Holidays</h1>
          <p className="dash-body mt-0.5">Block out days you&apos;re unavailable for appointments.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2">
          <div className="dash-surface p-5">
            <h2 className="text-sm font-semibold text-sand-50 mb-4">Add Holiday</h2>
            <form action={addHoliday} className="space-y-3">
              <div>
                <label htmlFor="date" className="block text-xs font-medium text-sand-50/50 mb-1">Date</label>
                <input type="date" id="date" name="date" required className="dash-input" />
              </div>
              <div>
                <label htmlFor="reason" className="block text-xs font-medium text-sand-50/50 mb-1">Reason (optional)</label>
                <input type="text" id="reason" name="reason" maxLength={25} placeholder="e.g. Vacation" className="dash-input" />
              </div>
              <button type="submit"
                className="w-full bg-turq-600 text-ink-950 py-2.5 px-4 rounded-lg font-semibold text-sm hover:bg-turq-500 transition-colors">
                Add Holiday
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-8">
          <div>
            <h2 className="text-sm font-semibold text-sand-50/70 mb-3">Upcoming</h2>
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Reason</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.length > 0 ? upcoming.map((h) => (
                    <tr key={h.holidayId}>
                      <td className="td-primary">{h.restDate.toLocaleDateString()}</td>
                      <td>{h.reason || "—"}</td>
                      <td className="text-right">
                        <form action={deleteHoliday}>
                          <input type="hidden" name="holidayId" value={h.holidayId} />
                          <button type="submit" className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-medium">
                            <Trash2 className="h-3 w-3" /> Delete
                          </button>
                        </form>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={3} className="td-empty">No upcoming holidays.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-sand-50/70 mb-3">Past</h2>
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {past.length > 0 ? past.map((h) => (
                    <tr key={h.holidayId}>
                      <td>{h.restDate.toLocaleDateString()}</td>
                      <td>{h.reason || "—"}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={2} className="td-empty">No past holidays.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

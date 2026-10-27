import React from 'react';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isDentist } from "@/lib/auth";
import { addHoliday } from "@/app/actions/holidays";
import DeleteHolidayButton from "@/components/holidays/DeleteHolidayButton";
import SubmitButton from "@/components/common/SubmitButton";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Palmtree, Calendar, Plus, Clock, CheckCircle2 } from 'lucide-react';
import { formatAppointmentDate, getClinicDay } from "@/lib/clinic-date";

export default async function HolidaysPage() {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isDentist(dbUser)) redirect("/dashboard");

  const dentistId = dbUser.dentists[0].dentistId;
  const today = getClinicDay();
  const todayStart = new Date(Date.UTC(today.year, today.month - 1, today.day));

  const holidays = await prisma.holidayDate.findMany({
    where: { restingId: dentistId },
    orderBy: { restDate: 'asc' },
  });

  const upcoming = holidays.filter((h) => h.restDate >= todayStart);
  const past = holidays.filter((h) => h.restDate < todayStart).reverse();

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <AdminPageHeader
        section="Practice Management"
        title="Doctor Leave & Calendar Holidays"
        subtitle="Block out unavailability to prevent patient bookings on scheduled off-days"
      />

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-ink-900 border border-sand-50/10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-sand-50/40 font-medium">Upcoming Leave Days</p>
            <p className="text-2xl font-bold font-display text-turq-400 mt-1">{upcoming.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-turq-500/10 text-turq-400">
            <Palmtree className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-ink-900 border border-sand-50/10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-sand-50/40 font-medium">Past Leave Recorded</p>
            <p className="text-2xl font-bold font-display text-sand-50 mt-1">{past.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-sand-50/5 text-sand-50/60">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-ink-900 border border-sand-50/10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-sand-50/40 font-medium">Next Scheduled Leave</p>
            <p className="text-base font-bold font-display text-sand-50 mt-1.5 truncate">
              {upcoming[0]
                ? formatAppointmentDate({
                    year: upcoming[0].restDate.getUTCFullYear(),
                    month: upcoming[0].restDate.getUTCMonth() + 1,
                    day: upcoming[0].restDate.getUTCDate(),
                  })
                : "None Scheduled"}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-sand-50/5 text-sand-50/60">
            <Calendar className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Card */}
        <div className="lg:col-span-1">
          <div className="bg-ink-900 border border-sand-50/10 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-sand-50/10">
              <Plus className="h-4 w-4 text-turq-400" />
              <h2 className="text-sm font-semibold text-sand-50">Schedule Off-Day</h2>
            </div>
            <form action={addHoliday} className="space-y-4">
              <div>
                <label htmlFor="date" className="block text-xs font-semibold uppercase tracking-wider text-sand-50/60 mb-1.5">
                  Leave Date <span className="text-turq-400">*</span>
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  className="w-full px-3.5 py-2.5 bg-ink-950 border border-sand-50/10 rounded-xl text-sm text-sand-50 focus:outline-none focus:border-turq-500"
                />
              </div>
              <div>
                <label htmlFor="reason" className="block text-xs font-semibold uppercase tracking-wider text-sand-50/60 mb-1.5">
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  id="reason"
                  name="reason"
                  maxLength={25}
                  placeholder="e.g. Annual Vacation, Conference"
                  className="w-full px-3.5 py-2.5 bg-ink-950 border border-sand-50/10 rounded-xl text-sm text-sand-50 placeholder:text-sand-50/30 focus:outline-none focus:border-turq-500"
                />
              </div>
              <SubmitButton
                pendingText="Scheduling Leave..."
                className="w-full bg-turq-500 hover:bg-turq-400 text-ink-950 py-2.5 px-4 rounded-xl font-bold text-xs transition-all shadow-md shadow-turq-500/10 cursor-pointer"
              >
                Block Calendar Date
              </SubmitButton>
            </form>
          </div>
        </div>

        {/* Schedule Tables */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-ink-900 border border-sand-50/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 sm:p-5 border-b border-sand-50/10 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-sand-50">Upcoming Blocked Days</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-turq-500/10 text-turq-400 border border-turq-500/20 font-medium">
                {upcoming.length} scheduled
              </span>
            </div>

            {upcoming.length === 0 ? (
              <div className="text-center py-12 px-4 text-xs text-sand-50/40">
                No upcoming leave days scheduled. You are fully available on the clinic calendar.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-sand-50/[0.02] border-b border-sand-50/10 uppercase tracking-wider text-sand-50/40 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-50/5">
                    {upcoming.map((h) => {
                      const dateLabel = formatAppointmentDate({
                        year: h.restDate.getUTCFullYear(),
                        month: h.restDate.getUTCMonth() + 1,
                        day: h.restDate.getUTCDate(),
                      });
                      return (
                        <tr key={h.holidayId} className="hover:bg-sand-50/[0.02] transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-sand-50">
                            {dateLabel}
                          </td>
                          <td className="py-3.5 px-4 text-sand-50/70">
                            {h.reason || <span className="text-sand-50/20">—</span>}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <DeleteHolidayButton
                              holidayId={h.holidayId}
                              dateLabel={dateLabel}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {past.length > 0 && (
            <div className="bg-ink-900 border border-sand-50/10 rounded-2xl overflow-hidden shadow-xl opacity-75">
              <div className="p-4 border-b border-sand-50/10 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-sand-50/60">Past Leave Archive</h2>
                <span className="text-xs text-sand-50/40">{past.length} past</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-sand-50/[0.02] border-b border-sand-50/10 uppercase tracking-wider text-sand-50/30 font-semibold">
                    <tr>
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-50/5">
                    {past.slice(0, 5).map((h) => (
                      <tr key={h.holidayId}>
                        <td className="py-2.5 px-4 text-sand-50/60">
                          {formatAppointmentDate({
                            year: h.restDate.getUTCFullYear(),
                            month: h.restDate.getUTCMonth() + 1,
                            day: h.restDate.getUTCDate(),
                          })}
                        </td>
                        <td className="py-2.5 px-4 text-sand-50/40">{h.reason || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

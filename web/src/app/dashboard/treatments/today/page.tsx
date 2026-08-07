import React from 'react';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isDentist, isReceptionist, isAdmin } from "@/lib/auth";
import { addTreatment } from "@/app/actions/treatments";
import { toggleCheckedIn } from "@/app/actions/checkin";
import { CalendarCheck, CheckCircle2, LayoutGrid } from 'lucide-react';
import { formatNaira } from "@/lib/currency";
import { formatAppointmentDate, getClinicDay } from "@/lib/clinic-date";
import Link from "next/link";

export default async function TodaysAppointmentsPage() {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");

  const staffView = isReceptionist(dbUser) || isAdmin(dbUser);
  if (!isDentist(dbUser) && !staffView) redirect("/dashboard");

  const now = new Date();
  const { year, month, day } = getClinicDay(now);

  const [appointments, services, settings, allDentists] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        year,
        month,
        day,
        ...(staffView ? {} : { dId: dbUser.dentists[0].dentistId }),
      },
      include: {
        patient: { include: { person: true } },
        dentist: { include: { person: true } },
        treatments: true,
      },
      orderBy: { hour: 'asc' },
    }),
    isDentist(dbUser) ? prisma.service.findMany({ where: { active: true }, orderBy: { name: 'asc' } }) : Promise.resolve([]),
    prisma.clinicSettings.findUnique({ where: { id: 1 } }),
    staffView ? prisma.dentist.findMany({ include: { person: true } }) : Promise.resolve([]),
  ]);

  const openHour = settings?.openHour ?? 8;
  const closeHour = settings?.closeHour ?? 18;
  const hours = Array.from({ length: closeHour - openHour }, (_, i) => openHour + i);

  const gridDentists = staffView
    ? allDentists
    : [{ dentistId: dbUser.dentists?.[0]?.dentistId, person: { firstName: dbUser.firstName, lastName: dbUser.lastName } }];

  const apptByDentistHour = new Map<string, (typeof appointments)[number]>();
  for (const app of appointments) {
    apptByDentistHour.set(`${app.dId}-${app.hour}`, app);
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="dash-icon-badge">
          <CalendarCheck className="h-5 w-5 text-turq-400" />
        </div>
        <div>
          <h1 className="dash-title font-display">Today&apos;s Appointments</h1>
          <p className="dash-body mt-0.5">
            {formatAppointmentDate({ year, month, day })} · Abuja time
          </p>
        </div>
      </div>

      {/* At-a-glance grid */}
      {gridDentists.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-sand-50/60">
            <LayoutGrid className="h-4 w-4" /> Schedule Overview
          </div>
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th className="w-20">Time</th>
                  {gridDentists.map((d) => (
                    <th key={d.dentistId}>
                      {staffView ? `Dr. ${d.person.lastName}` : 'You'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hours.map((h) => (
                  <tr key={h}>
                    <td className="font-medium text-sand-50/60">{h}:00</td>
                    {gridDentists.map((d) => {
                      const app = d.dentistId ? apptByDentistHour.get(`${d.dentistId}-${h}`) : undefined;
                      return (
                        <td key={d.dentistId}>
                          {app ? (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              app.checkedIn ? 'bg-turq-600/20 text-turq-300' : 'bg-amber-900/40 text-amber-400'
                            }`}>
                              {app.patient.person.firstName} {app.patient.person.lastName}
                            </span>
                          ) : (
                            <span className="text-sand-50/20 text-xs">Free</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {appointments.length > 0 ? appointments.map((app) => {
          const alreadyTreated = app.treatments.length > 0;
          return (
            <div key={app.appointmentId} className="dash-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <p className="font-semibold text-sand-50">
                    {app.hour}:00 —{" "}
                    <Link href={`/dashboard/patients/${app.patient.patientId}`} className="hover:text-turq-400 transition-colors">
                      {app.patient.person.firstName} {app.patient.person.lastName}
                    </Link>
                  </p>
                  <p className="text-sm text-sand-50/50">
                    {staffView && <>Dr. {app.dentist.person.firstName} {app.dentist.person.lastName} · </>}
                    Room {app.room}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {staffView && (
                    <form action={toggleCheckedIn}>
                      <input type="hidden" name="appointmentId" value={app.appointmentId} />
                      <input type="hidden" name="checkedIn" value={String(app.checkedIn)} />
                      <button type="submit"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          app.checkedIn ? 'bg-turq-600/20 text-turq-300' : 'bg-sand-50/8 text-sand-50/50 hover:bg-sand-50/12'
                        }`}>
                        <CheckCircle2 className="h-3 w-3" /> {app.checkedIn ? 'Checked in' : 'Check in'}
                      </button>
                    </form>
                  )}
                  {alreadyTreated ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-turq-600/20 text-turq-300">
                      Treatment recorded
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-900/40 text-amber-400">
                      Pending
                    </span>
                  )}
                </div>
              </div>

              {!staffView && !alreadyTreated && (
                <form action={addTreatment} className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-sand-50/8">
                  <input type="hidden" name="appointmentId" value={app.appointmentId} />
                  <div>
                    <label className="block text-xs font-medium text-sand-50/50 mb-1">Complaint</label>
                    <input type="text" name="complaint" required maxLength={25} className="dash-input" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-sand-50/50 mb-1">Action Taken</label>
                    <input type="text" name="action" required maxLength={25} className="dash-input" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-sand-50/50 mb-1">Service (sets price)</label>
                    <select name="serviceId" className="dash-input">
                      <option value="">Custom charge instead</option>
                      {services.map((s) => (
                        <option key={s.serviceId} value={s.serviceId}>{s.name} — {formatNaira(s.price)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-sand-50/50 mb-1">Charge ($, if no service selected)</label>
                    <input type="number" name="charge" min={0} className="dash-input" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-sand-50/50 mb-1">Medicines (comma-separated)</label>
                    <input type="text" name="medicines" placeholder="e.g. Ibuprofen, Amoxicillin" className="dash-input" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-sand-50/50 mb-1">Notes (optional)</label>
                    <input type="text" name="description" maxLength={50} className="dash-input" />
                  </div>
                  <div className="sm:col-span-2">
                    <button type="submit"
                      className="bg-turq-600 text-ink-950 py-2 px-4 rounded-lg font-semibold text-sm hover:bg-turq-500 transition-colors">
                      Save Treatment
                    </button>
                  </div>
                </form>
              )}
            </div>
          );
        }) : (
          <div className="text-center text-sand-50/30 py-12 border border-dashed border-sand-50/10 rounded-xl">
            No appointments scheduled for today.
          </div>
        )}
      </div>
    </div>
  );
}

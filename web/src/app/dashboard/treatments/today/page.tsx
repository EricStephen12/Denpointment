import React from 'react';
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isDentist, isReceptionist, isAdmin } from "@/lib/auth";
import { addTreatment } from "@/app/actions/treatments";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { CalendarCheck, LayoutGrid, CreditCard, Clock, UserCheck, Stethoscope, CheckCircle2 } from 'lucide-react';
import { formatNaira } from "@/lib/currency";
import { formatAppointmentDate, getClinicDay } from "@/lib/clinic-date";
import { statusMeta } from "@/lib/appointment-status";
import PrescriptionFields from "@/components/dashboards/PrescriptionFields";
import VisitStatusSelect from "@/components/dashboards/VisitStatusSelect";
import TreatmentEditor from "@/components/dashboards/TreatmentEditor";
import ReassignAppointmentModal from "@/components/reception/ReassignAppointmentModal";
import PrintScheduleButton from "@/components/common/PrintScheduleButton";
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
        treatments: { include: { medicines: true } },
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

  const dentistOptions = allDentists.map((d) => ({
    dentistId: d.dentistId,
    name: `${d.person.firstName} ${d.person.lastName}`,
    defaultRoom: d.roomNumber,
  }));

  const apptByDentistHour = new Map<string, (typeof appointments)[number]>();
  for (const app of appointments) {
    apptByDentistHour.set(`${app.dId}-${app.hour}`, app);
  }

  const checkedInCount = appointments.filter((a) => a.status === 'checked_in').length;
  const inChairCount = appointments.filter((a) => a.status === 'in_chair').length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <AdminPageHeader
        section="Clinic Operations"
        title="Today's Appointments"
        subtitle={`${formatAppointmentDate({ year, month, day })} · Abuja Clinic Time`}
        action={<PrintScheduleButton />}
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-ink-900 border border-sand-50/10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-sand-50/40 font-medium">Total Bookings</p>
            <p className="text-2xl font-bold font-display text-sand-50 mt-1">{appointments.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-sand-50/5 text-sand-50/60">
            <CalendarCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-ink-900 border border-sand-50/10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-sand-50/40 font-medium">Checked In / Waiting</p>
            <p className="text-2xl font-bold font-display text-turq-400 mt-1">{checkedInCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-turq-500/10 text-turq-400">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-ink-900 border border-sand-50/10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-sand-50/40 font-medium">In Chair / Treatment</p>
            <p className="text-2xl font-bold font-display text-amber-400 mt-1">{inChairCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <Stethoscope className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-ink-900 border border-sand-50/10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-sand-50/40 font-medium">Completed Visits</p>
            <p className="text-2xl font-bold font-display text-emerald-400 mt-1">{completedCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* At-a-glance Chair Grid */}
      {gridDentists.length > 0 && (
        <div className="bg-ink-900 border border-sand-50/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 sm:p-5 border-b border-sand-50/10 flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-turq-400" />
            <h2 className="text-sm font-semibold text-sand-50">Surgery Room &amp; Chair Overview</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sand-50/[0.02] border-b border-sand-50/10 font-semibold uppercase tracking-wider text-sand-50/40">
                <tr>
                  <th className="py-3 px-4 w-24">Time</th>
                  {gridDentists.map((d) => (
                    <th key={d.dentistId} className="py-3 px-4">
                      {staffView ? `Dr. ${d.person.lastName}` : 'Your Chair'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-50/5">
                {hours.map((h) => (
                  <tr key={h} className="hover:bg-sand-50/[0.01]">
                    <td className="py-2.5 px-4 font-mono font-medium text-sand-50/60">{h}:00</td>
                    {gridDentists.map((d) => {
                      const app = d.dentistId ? apptByDentistHour.get(`${d.dentistId}-${h}`) : undefined;
                      return (
                        <td key={d.dentistId} className="py-2.5 px-4">
                          {app ? (
                            <Link
                              href={`/dashboard/patients/${app.patient.patientId}`}
                              className={`inline-flex items-center px-2.5 py-1 rounded-lg font-medium transition-opacity hover:opacity-80 ${statusMeta(app.status).tone}`}
                            >
                              {app.patient.person.firstName} {app.patient.person.lastName}
                            </Link>
                          ) : (
                            <span className="text-sand-50/15">Available</span>
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

      {/* Appointment Cards */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-sand-50/80 flex items-center gap-2">
          <span>Detailed Daily Schedule</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-sand-50/10 text-sand-50/60 font-medium">
            {appointments.length} patients
          </span>
        </h2>

        {appointments.length > 0 ? (
          appointments.map((app) => {
            const treatmentCount = app.treatments.length;
            const patientFullName = `${app.patient.person.firstName} ${app.patient.person.lastName}`;
            const initials = `${app.patient.person.firstName[0] || ""}${app.patient.person.lastName[0] || ""}`.toUpperCase();

            return (
              <div key={app.appointmentId} className="bg-ink-900 border border-sand-50/10 rounded-2xl p-5 hover:border-sand-50/20 transition-all shadow-md space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-turq-500/10 border border-turq-500/20 text-turq-400 flex items-center justify-center text-xs font-bold shrink-0">
                      {initials}
                    </div>
                    <div>
                      <p className="font-semibold text-sand-50 flex items-center gap-2">
                        <span className="text-turq-400 font-mono text-sm">{app.hour}:00</span>
                        <span>—</span>
                        <Link href={`/dashboard/patients/${app.patient.patientId}`} className="hover:text-turq-400 transition-colors">
                          {patientFullName}
                        </Link>
                      </p>
                      <p className="text-xs text-sand-50/50 mt-0.5">
                        {staffView && <>Dr. {app.dentist.person.firstName} {app.dentist.person.lastName} · </>}
                        Room {app.room}
                        {" · "}
                        <Link
                          href={`/dashboard/patients/${app.patient.patientId}#dental-chart`}
                          className="text-turq-400 hover:text-turq-300 underline font-medium"
                        >
                          Dental Chart
                        </Link>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <VisitStatusSelect appointmentId={app.appointmentId} status={app.status} />
                    {staffView && (
                      <ReassignAppointmentModal
                        appointmentId={app.appointmentId}
                        currentDentistId={app.dId}
                        currentDentistName={`Dr. ${app.dentist.person.firstName} ${app.dentist.person.lastName}`}
                        currentRoom={app.room}
                        currentDate={`${app.year}-${String(app.month).padStart(2,"0")}-${String(app.day).padStart(2,"0")}`}
                        currentHour={app.hour}
                        patientName={patientFullName}
                        dentists={dentistOptions}
                        openHour={openHour}
                        closeHour={closeHour}
                        buttonLabel="Reassign"
                        compact={true}
                      />
                    )}
                    {treatmentCount > 0 ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-turq-500/10 text-turq-300 border border-turq-500/20">
                        {treatmentCount} procedure{treatmentCount === 1 ? "" : "s"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-900/30 text-amber-400 border border-amber-500/20">
                        No procedure yet
                      </span>
                    )}
                  </div>
                </div>

                {treatmentCount > 0 && (
                  <ul className="space-y-2 text-xs text-sand-50/70 border-t border-sand-50/5 pt-3">
                    {app.treatments.map((t) => (
                      <li key={t.treatmentId} className="bg-sand-50/[0.02] p-3 rounded-xl border border-sand-50/5">
                        {!staffView ? (
                          <TreatmentEditor
                            treatment={{
                              treatmentId: t.treatmentId,
                              action: t.action,
                              complaint: t.complaint,
                              description: t.description,
                              toothNumber: t.toothNumber,
                              charge: t.charge,
                              paid: t.paid,
                              medicines: t.medicines,
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              {t.toothNumber != null && (
                                <span className="text-turq-300 font-semibold mr-1.5">Tooth #{t.toothNumber}:</span>
                              )}
                              <span className="text-sand-50 font-medium">{t.action}</span>
                              <span className="text-sand-50/50 block mt-0.5">{t.complaint}</span>
                            </div>
                            <span className="text-sand-50 font-mono font-semibold">{formatNaira(t.charge)}</span>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Patient actions & billing */}
                {treatmentCount > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-sand-50/5 text-xs">
                    <span className="text-sand-50/40">
                      Procedures documented.
                    </span>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/patients/${app.patient.patientId}#dental-chart`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sand-50/10 text-sand-50/70 hover:text-sand-50 hover:bg-sand-50/5 transition-colors"
                      >
                        Dental Chart
                      </Link>
                      <Link
                        href={`/dashboard/admin/billing?q=${encodeURIComponent(app.patient.person.lastName)}`}
                        className="inline-flex items-center gap-1.5 font-bold bg-turq-500 hover:bg-turq-400 text-ink-950 px-3.5 py-1.5 rounded-lg transition-all shadow-sm"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>Billing &amp; Invoice</span>
                      </Link>
                    </div>
                  </div>
                )}

                {!staffView && (
                  <form action={addTreatment} className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-sand-50/5">
                    <input type="hidden" name="appointmentId" value={app.appointmentId} />
                    <div className="sm:col-span-2">
                      <p className="text-xs font-semibold text-sand-50/50">
                        {treatmentCount > 0
                          ? "Add another procedure for this visit"
                          : "Record treatment procedure"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-sand-50/50 mb-1">Complaint</label>
                      <input type="text" name="complaint" required maxLength={200} className="dash-input" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-sand-50/50 mb-1">Action taken</label>
                      <input type="text" name="action" required maxLength={200} className="dash-input" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-sand-50/50 mb-1">Tooth (FDI, optional)</label>
                      <input
                        type="number"
                        name="toothNumber"
                        min={11}
                        max={85}
                        placeholder="e.g. 16 or 51"
                        className="dash-input"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-sand-50/50 mb-1">Update chart as</label>
                      <select name="chartCondition" className="dash-input" defaultValue="">
                        <option value="">Don’t update chart</option>
                        <option value="caries">Caries</option>
                        <option value="filling">Filling</option>
                        <option value="crown">Crown</option>
                        <option value="missing">Missing</option>
                        <option value="root_canal">Root canal</option>
                        <option value="extraction_planned">Extract planned</option>
                        <option value="watch">Watch</option>
                        <option value="healthy">Healthy</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-sand-50/50 mb-1">Service Catalog</label>
                      <select name="serviceId" className="dash-input">
                        <option value="">Custom charge instead</option>
                        {services.map((s) => (
                          <option key={s.serviceId} value={s.serviceId}>{s.name} — {formatNaira(s.price)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-sand-50/50 mb-1">Custom Charge (₦)</label>
                      <input type="number" name="charge" min={0} className="dash-input" />
                    </div>
                    <PrescriptionFields />
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-sand-50/50 mb-1">Clinical notes</label>
                      <textarea name="description" rows={3} maxLength={4000} className="dash-input resize-y" />
                    </div>
                    {/* SOAP notes */}
                    <div className="sm:col-span-2 border-t border-sand-50/8 pt-3">
                      <p className="text-xs font-semibold text-sand-50/40 uppercase tracking-wider mb-2">SOAP Notes (optional)</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-sand-50/50 mb-1">S — Subjective</label>
                          <textarea name="soapSubjective" rows={2} maxLength={2000} className="dash-input resize-y" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-sand-50/50 mb-1">O — Objective</label>
                          <textarea name="soapObjective" rows={2} maxLength={2000} className="dash-input resize-y" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-sand-50/50 mb-1">A — Assessment</label>
                          <textarea name="soapAssessment" rows={2} maxLength={2000} className="dash-input resize-y" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-sand-50/50 mb-1">P — Plan</label>
                          <textarea name="soapPlan" rows={2} maxLength={2000} className="dash-input resize-y" />
                        </div>
                      </div>
                    </div>
                    {/* Vitals */}
                    <div className="sm:col-span-2 border-t border-sand-50/8 pt-3">
                      <p className="text-xs font-semibold text-sand-50/40 uppercase tracking-wider mb-2">Vital Signs (optional)</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-sand-50/50 mb-1">Blood Pressure (e.g. 120/80)</label>
                          <input type="text" name="vitalsBP" maxLength={10} placeholder="120/80" className="dash-input" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-sand-50/50 mb-1">Heart Rate (bpm)</label>
                          <input type="number" name="vitalsHR" min={30} max={220} placeholder="72" className="dash-input" />
                        </div>
                      </div>
                    </div>
                    <div className="sm:col-span-2 pt-2">
                      <button
                        type="submit"
                        className="bg-turq-500 hover:bg-turq-400 text-ink-950 py-2.5 px-5 rounded-xl font-bold text-xs transition-colors shadow-sm cursor-pointer"
                      >
                        Save Clinical Procedure
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 px-4 bg-ink-900 border border-dashed border-sand-50/10 rounded-2xl">
            <div className="w-12 h-12 rounded-2xl bg-sand-50/5 border border-sand-50/10 flex items-center justify-center mx-auto mb-3 text-sand-50/30">
              <CalendarCheck className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-sand-50">No appointments scheduled for today</p>
            <p className="text-xs text-sand-50/40 max-w-sm mx-auto mt-1">
              New bookings will automatically appear here once scheduled.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

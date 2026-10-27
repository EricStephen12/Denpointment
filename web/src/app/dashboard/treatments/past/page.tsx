import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isDentist } from "@/lib/auth";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { History, Calendar, FileText, CheckCircle2, Search, X } from "lucide-react";
import { formatNaira } from "@/lib/currency";
import { formatAppointmentDate, isAppointmentUpcoming } from "@/lib/clinic-date";
import Link from "next/link";
import TreatmentEditor from "@/components/dashboards/TreatmentEditor";

export default async function PastTreatmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isDentist(dbUser)) redirect("/dashboard");

  const dentistId = dbUser.dentists[0].dentistId;
  const now = new Date();
  const { date } = await searchParams;

  const appointments = await prisma.appointment.findMany({
    where: { dId: dentistId },
    include: {
      patient: { include: { person: true } },
      treatments: { include: { medicines: true } },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }, { day: "desc" }, { hour: "desc" }],
  });

  let past = appointments.filter((app) => !isAppointmentUpcoming(app, now));

  if (date) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const day = parseInt(match[3], 10);
      past = past.filter(
        (app) => app.year === year && app.month === month && app.day === day,
      );
    }
  }

  const allTreatments = past.flatMap((a) => a.treatments);
  const totalRevenue = allTreatments.reduce((sum, t) => sum + t.charge, 0);

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <AdminPageHeader
        section="Clinic Operations"
        title="Past Treatments & History"
        subtitle="Search and review historical treatment records and clinical procedures"
      />

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-ink-900 border border-sand-50/10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-sand-50/40 font-medium">Historical Visits</p>
            <p className="text-2xl font-bold font-display text-sand-50 mt-1">{appointments.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-sand-50/5 text-sand-50/60">
            <History className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-ink-900 border border-sand-50/10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-sand-50/40 font-medium">Shown in Query</p>
            <p className="text-2xl font-bold font-display text-turq-400 mt-1">{past.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-turq-500/10 text-turq-400">
            <Calendar className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-ink-900 border border-sand-50/10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-sand-50/40 font-medium">Procedures Documented</p>
            <p className="text-2xl font-bold font-display text-emerald-400 mt-1">{allTreatments.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <FileText className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-ink-900 border border-sand-50/10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-sand-50/40 font-medium">Recorded Production</p>
            <p className="text-xl font-bold font-display text-sand-50 mt-1">{formatNaira(totalRevenue)}</p>
          </div>
          <div className="p-3 rounded-xl bg-sand-50/5 text-sand-50/60">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-ink-900 border border-sand-50/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <form className="flex items-center gap-3" method="get">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sand-50/30 pointer-events-none" />
            <input
              type="date"
              id="date"
              name="date"
              defaultValue={date || ""}
              className="pl-9 pr-3 py-2 bg-ink-950 border border-sand-50/10 rounded-xl text-xs text-sand-50 focus:outline-none focus:border-turq-500"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 bg-turq-500 hover:bg-turq-400 text-ink-950 font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
          >
            <Search className="h-3.5 w-3.5" />
            Filter Date
          </button>
          {date && (
            <Link
              href="/dashboard/treatments/past"
              className="inline-flex items-center gap-1 text-xs text-sand-50/50 hover:text-sand-50 px-2 py-2 transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Clear
            </Link>
          )}
        </form>

        <span className="text-xs text-sand-50/40">
          Showing {past.length} past record{past.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Past Appointments List */}
      <div className="space-y-4">
        {past.length === 0 ? (
          <div className="text-center py-16 px-4 bg-ink-900 border border-dashed border-sand-50/10 rounded-2xl">
            <div className="w-12 h-12 rounded-2xl bg-sand-50/5 border border-sand-50/10 flex items-center justify-center mx-auto mb-3 text-sand-50/30">
              <History className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-sand-50">No past treatments found</p>
            <p className="text-xs text-sand-50/40 max-w-sm mx-auto mt-1">
              {date ? "Try clearing the date filter to view other past records." : "Completed visits and treatment notes will be cataloged here."}
            </p>
          </div>
        ) : (
          past.map((app) => {
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
                      <Link
                        href={`/dashboard/patients/${app.patient.patientId}`}
                        className="font-semibold text-sand-50 hover:text-turq-400 transition-colors"
                      >
                        {patientFullName}
                      </Link>
                      <p className="text-xs text-sand-50/50 mt-0.5">
                        {formatAppointmentDate(app)} · {app.hour}:00 · Room {app.room}
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

                  <span className="text-xs px-2.5 py-1 rounded-lg bg-sand-50/5 border border-sand-50/10 text-sand-50/70 font-medium">
                    {app.treatments.length} procedure{app.treatments.length === 1 ? "" : "s"}
                  </span>
                </div>

                {app.treatments.length === 0 ? (
                  <p className="text-xs italic text-sand-50/30 pl-1">No treatments recorded for this past visit.</p>
                ) : (
                  <ul className="space-y-3 border-t border-sand-50/5 pt-3">
                    {app.treatments.map((t) => (
                      <li key={t.treatmentId} className="bg-sand-50/[0.02] p-3.5 rounded-xl border border-sand-50/5">
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
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-sand-50/50">
                          <span>Complaint: <strong className="text-sand-50/80 font-medium">{t.complaint}</strong></span>
                          {t.medicines.length > 0 && (
                            <span>· Rx: {t.medicines.map((m) => m.medicineName).join(", ")}</span>
                          )}
                          {!t.paid && (
                            <span className="text-red-400 font-medium">· {formatNaira(t.charge)} unpaid</span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isDentist, isAdmin, isReceptionist } from "@/lib/auth";
import { updateReferral } from "@/app/actions/clinical-care";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ReferralStatusSelect from "@/components/clinical/ReferralStatusSelect";
import { Share2, AlertTriangle, Send, CheckCircle2, Clock, Phone, Stethoscope } from "lucide-react";

const URGENCY_TONE: Record<string, string> = {
  routine:   "bg-sand-50/10 text-sand-50/70 border-sand-50/15",
  urgent:    "bg-amber-900/30 text-amber-400 border-amber-500/20",
  emergency: "bg-red-900/30 text-red-400 border-red-500/20",
};

const STATUS_TONE: Record<string, string> = {
  pending:   "bg-sand-50/10 text-sand-50/70 border-sand-50/15",
  sent:      "bg-sky-900/30 text-sky-400 border-sky-500/20",
  completed: "bg-emerald-900/30 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-sand-50/5 text-sand-50/30 border-sand-50/10",
};

export default async function ReferralsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isDentist(dbUser) && !isAdmin(dbUser) && !isReceptionist(dbUser)) redirect("/dashboard");

  const { filter } = await searchParams;
  const showAll = filter === "all";
  const isDoc   = isDentist(dbUser);
  const dentistId = isDoc ? dbUser.dentists[0].dentistId : undefined;

  const referrals = await prisma.referral.findMany({
    where: {
      ...(dentistId && !isAdmin(dbUser) ? { dentistId } : {}),
      ...(!showAll ? { status: { in: ["pending", "sent"] } } : {}),
    },
    include: {
      patient: { include: { person: { include: { contacts: true } } } },
      dentist: { include: { person: true } },
    },
    orderBy: [
      { urgency: "desc" },
      { createdAt: "desc" },
    ],
  });

  const active   = referrals.filter((r) => r.status === "pending" || r.status === "sent");
  const resolved = referrals.filter((r) => r.status === "completed" || r.status === "cancelled");
  const urgentCount = referrals.filter((r) => r.urgency === "urgent" || r.urgency === "emergency").length;
  const sentCount = referrals.filter((r) => r.status === "sent").length;

  function fmtDate(d: Date) {
    return new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  }

  const ReferralCard = ({ r }: { r: typeof referrals[0] }) => {
    const phone = r.patient.person.contacts[0]?.contactNumber;
    const patientFullName = `${r.patient.person.firstName} ${r.patient.person.lastName}`;
    const initials = `${r.patient.person.firstName[0] || ""}${r.patient.person.lastName[0] || ""}`.toUpperCase();

    return (
      <div className="bg-ink-900 border border-sand-50/10 rounded-2xl p-5 hover:border-sand-50/20 transition-all shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-turq-500/10 border border-turq-500/20 text-turq-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/dashboard/patients/${r.patient.patientId}`}
                  className="font-semibold text-sand-50 hover:text-turq-400 transition-colors"
                >
                  {patientFullName}
                </Link>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border capitalize ${URGENCY_TONE[r.urgency] ?? ""}`}>
                  {r.urgency}
                </span>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium border capitalize ${STATUS_TONE[r.status] ?? ""}`}>
                  {r.status}
                </span>
              </div>
              <p className="text-sm font-semibold text-turq-400 mt-1">{r.specialistType}</p>
              <p className="text-xs text-sand-50/70 mt-0.5 leading-relaxed">{r.reason}</p>
              {r.notes && <p className="text-xs text-sand-50/40 italic mt-1">Notes: {r.notes}</p>}
              
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-sand-50/40">
                {!isDoc && (
                  <span className="flex items-center gap-1">
                    <Stethoscope className="h-3 w-3 text-sand-50/30" />
                    Dr. {r.dentist.person.firstName} {r.dentist.person.lastName}
                  </span>
                )}
                {phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3 text-sand-50/30" />
                    <a href={`tel:${phone}`} className="hover:text-turq-400 transition-colors">{phone}</a>
                  </span>
                )}
                <span>Created {fmtDate(r.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          {isDoc && (
            <div className="flex shrink-0 items-center gap-2">
              <ReferralStatusSelect referralId={r.referralId} status={r.status} />

              <details className="relative">
                <summary className="cursor-pointer list-none rounded-xl border border-sand-50/10 px-3 py-1.5 text-xs text-sand-50/70 hover:text-sand-50 hover:bg-sand-50/5 transition-colors">
                  Edit
                </summary>
                <form action={updateReferral} className="absolute right-0 z-20 mt-2 grid w-72 gap-2.5 rounded-2xl border border-sand-50/15 bg-ink-900 p-4 shadow-2xl">
                  <input type="hidden" name="referralId" value={r.referralId} />
                  <label className="grid gap-1 text-xs text-sand-50/60 font-medium">Specialist type
                    <input name="specialistType" required maxLength={60} defaultValue={r.specialistType} className="dash-input" />
                  </label>
                  <label className="grid gap-1 text-xs text-sand-50/60 font-medium">Urgency
                    <select name="urgency" defaultValue={r.urgency} className="dash-input">
                      <option value="routine">Routine</option>
                      <option value="urgent">Urgent</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </label>
                  <label className="grid gap-1 text-xs text-sand-50/60 font-medium">Reason
                    <textarea name="reason" required rows={3} maxLength={300} defaultValue={r.reason} className="dash-input resize-y" />
                  </label>
                  <label className="grid gap-1 text-xs text-sand-50/60 font-medium">Notes
                    <textarea name="notes" rows={2} maxLength={500} defaultValue={r.notes ?? ""} className="dash-input resize-y" />
                  </label>
                  <button type="submit" className="rounded-xl bg-turq-500 hover:bg-turq-400 px-3 py-2 text-xs font-bold text-ink-950 transition-colors">
                    Save changes
                  </button>
                </form>
              </details>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <AdminPageHeader
        section="Clinical Care"
        title="Specialist Referrals"
        subtitle="Specialist coordination, case transfers, and external consultation tracking"
        action={
          <div className="flex items-center gap-1.5 bg-ink-900 p-1 rounded-xl border border-sand-50/10">
            <Link
              href="/dashboard/clinical/referrals"
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                !showAll
                  ? "bg-turq-500 text-ink-950 font-bold"
                  : "text-sand-50/60 hover:text-sand-50"
              }`}
            >
              Open Only ({active.length})
            </Link>
            <Link
              href="/dashboard/clinical/referrals?filter=all"
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                showAll
                  ? "bg-turq-500 text-ink-950 font-bold"
                  : "text-sand-50/60 hover:text-sand-50"
              }`}
            >
              All Referrals
            </Link>
          </div>
        }
      />

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-ink-900 border border-sand-50/10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-sand-50/40 font-medium">Open Cases</p>
            <p className="text-2xl font-bold font-display text-turq-400 mt-1">{active.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-turq-500/10 text-turq-400">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-ink-900 border border-sand-50/10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-sand-50/40 font-medium">Urgent / Emergency</p>
            <p className="text-2xl font-bold font-display text-amber-400 mt-1">{urgentCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-ink-900 border border-sand-50/10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-sand-50/40 font-medium">Sent to Specialist</p>
            <p className="text-2xl font-bold font-display text-sky-400 mt-1">{sentCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400">
            <Send className="h-5 w-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-ink-900 border border-sand-50/10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-sand-50/40 font-medium">Resolved / Completed</p>
            <p className="text-2xl font-bold font-display text-emerald-400 mt-1">{resolved.length}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Referrals Content */}
      {referrals.length === 0 ? (
        <div className="text-center py-16 px-4 bg-ink-900 border border-dashed border-sand-50/10 rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-sand-50/5 border border-sand-50/10 flex items-center justify-center mx-auto mb-3 text-sand-50/30">
            <Share2 className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-sand-50">
            {showAll ? "No referrals recorded in system" : "No open referrals awaiting follow-up"}
          </p>
          <p className="text-xs text-sand-50/40 max-w-sm mx-auto mt-1">
            Referrals can be created directly from any patient file under the Referrals section.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-turq-400">
                <span className="w-2 h-2 rounded-full bg-turq-400" />
                <span>Active Referrals ({active.length})</span>
              </div>
              <div className="space-y-3">
                {active.map((r) => <ReferralCard key={r.referralId} r={r} />)}
              </div>
            </div>
          )}

          {showAll && resolved.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sand-50/40">
                <span className="w-2 h-2 rounded-full bg-sand-50/40" />
                <span>Resolved Cases ({resolved.length})</span>
              </div>
              <div className="space-y-3 opacity-60">
                {resolved.map((r) => <ReferralCard key={r.referralId} r={r} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

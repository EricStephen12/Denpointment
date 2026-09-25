import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isDentist, isAdmin, isReceptionist } from "@/lib/auth";
import { updateReferralStatus } from "@/app/actions/clinical-care";
import { Share2 } from "lucide-react";

const URGENCY_TONE: Record<string, string> = {
  routine:   "bg-sand-50/8 text-sand-50/50 border-sand-50/10",
  urgent:    "bg-amber-900/30 text-amber-400 border-amber-500/20",
  emergency: "bg-red-900/30 text-red-400 border-red-500/20",
};

const STATUS_TONE: Record<string, string> = {
  pending:   "bg-sand-50/8 text-sand-50/50",
  sent:      "bg-sky-900/30 text-sky-400",
  completed: "bg-turq-600/20 text-turq-400",
  cancelled: "bg-sand-50/5 text-sand-50/20",
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
      { urgency: "desc" },  // emergency → urgent → routine
      { createdAt: "desc" },
    ],
  });

  // Group by status
  const active   = referrals.filter((r) => r.status === "pending" || r.status === "sent");
  const resolved = referrals.filter((r) => r.status === "completed" || r.status === "cancelled");

  function fmtDate(d: Date) {
    return new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  }

  const ReferralCard = ({ r }: { r: typeof referrals[0] }) => {
    const phone = r.patient.person.contacts[0]?.contactNumber;
    return (
      <div className="dash-surface p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/dashboard/patients/${r.patient.patientId}`}
                className="font-semibold text-sand-50 hover:text-turq-400 transition-colors"
              >
                {r.patient.person.firstName} {r.patient.person.lastName}
              </Link>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium border ${URGENCY_TONE[r.urgency] ?? ""}`}>
                {r.urgency}
              </span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_TONE[r.status] ?? ""}`}>
                {r.status}
              </span>
            </div>
            <p className="text-sm font-medium text-turq-300 mt-1">{r.specialistType}</p>
            <p className="text-xs text-sand-50/55 mt-0.5">{r.reason}</p>
            {r.notes && <p className="text-xs text-sand-50/30 mt-0.5">{r.notes}</p>}
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[10px] text-sand-50/25">
              {!isDoc && <span>Dr. {r.dentist.person.firstName} {r.dentist.person.lastName}</span>}
              {phone && (
                <a href={`tel:${phone}`} className="hover:text-turq-400 transition-colors">{phone}</a>
              )}
              <span>Created {fmtDate(r.createdAt)}</span>
            </div>
          </div>

          {/* Status updater — dentist only */}
          {isDoc && (
            <form action={updateReferralStatus} className="shrink-0">
              <input type="hidden" name="referralId" value={r.referralId} />
              <select
                name="status"
                defaultValue={r.status}
                onChange={(e) => e.currentTarget.form?.requestSubmit()}
                className="dash-input text-xs py-1 w-auto"
              >
                <option value="pending">Pending</option>
                <option value="sent">Sent to Specialist</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </form>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="dash-icon-badge">
            <Share2 className="h-5 w-5 text-turq-400" />
          </div>
          <div>
            <h1 className="dash-title font-display">Referrals</h1>
            <p className="dash-body mt-0.5">
              {active.length} open · {resolved.length} resolved
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/clinical/referrals"
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              !showAll
                ? "bg-turq-600 text-ink-950 border-turq-600"
                : "border-sand-50/15 text-sand-50/50 hover:border-turq-400/30 hover:text-turq-400"
            }`}
          >
            Open Only
          </Link>
          <Link
            href="/dashboard/clinical/referrals?filter=all"
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              showAll
                ? "bg-turq-600 text-ink-950 border-turq-600"
                : "border-sand-50/15 text-sand-50/50 hover:border-turq-400/30 hover:text-turq-400"
            }`}
          >
            All
          </Link>
        </div>
      </div>

      {referrals.length === 0 ? (
        <div className="text-center py-16 text-sand-50/30 border border-dashed border-sand-50/10 rounded-2xl">
          {showAll
            ? "No referrals recorded. Create them from a patient record → Referrals tab."
            : "No open referrals."}
        </div>
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-sand-50/35 font-semibold mb-3">
                Open — {active.length}
              </p>
              <div className="space-y-3">
                {active.map((r) => <ReferralCard key={r.referralId} r={r} />)}
              </div>
            </div>
          )}
          {showAll && resolved.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-sand-50/25 font-semibold mb-3">
                Resolved — {resolved.length}
              </p>
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

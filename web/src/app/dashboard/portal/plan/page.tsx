import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentPerson, isPatient } from "@/lib/auth";
import { formatNaira } from "@/lib/currency";
import { ClipboardList, CheckCircle2, Circle, Clock, XCircle } from "lucide-react";

const STATUS_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  planned:     { label: "Planned",     icon: <Circle className="h-3.5 w-3.5" />,        color: "text-sand-50/40" },
  in_progress: { label: "In Progress", icon: <Clock className="h-3.5 w-3.5" />,          color: "text-amber-400" },
  completed:   { label: "Done",        icon: <CheckCircle2 className="h-3.5 w-3.5" />,   color: "text-turq-400" },
  cancelled:   { label: "Cancelled",   icon: <XCircle className="h-3.5 w-3.5" />,        color: "text-sand-50/25" },
};

export default async function MyTreatmentPlanPage() {
  const dbUser = await getCurrentPerson();
  if (!dbUser) redirect("/");
  if (!isPatient(dbUser)) redirect("/dashboard");

  const patientId = dbUser.patients[0].patientId;

  const plans = await prisma.treatmentPlan.findMany({
    where: { patientId },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      dentist: { include: { person: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <p className="text-xs font-medium text-turq-400 uppercase tracking-widest mb-3">My Care</p>
        <h1 className="text-3xl font-display text-sand-50">Treatment Plan</h1>
        <p className="mt-2 text-sm text-sand-50/50">Your planned procedures and their current progress.</p>
      </div>

      {plans.length === 0 ? (
        <div className="dash-surface p-10 text-center">
          <ClipboardList className="h-10 w-10 text-sand-50/20 mx-auto mb-3" />
          <p className="text-sand-50/40 text-sm">No treatment plans have been created for you yet.</p>
          <p className="text-sand-50/25 text-xs mt-1">Your dentist will add one after your consultation.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {plans.map((plan) => {
            const total      = plan.items.reduce((s, i) => s + (i.estimatedCharge ?? 0), 0);
            const completed  = plan.items.filter((i) => i.status === "completed").length;
            const pct        = plan.items.length > 0 ? Math.round((completed / plan.items.length) * 100) : 0;

            return (
              <div key={plan.planId} className="dash-surface overflow-hidden">
                {/* Plan header */}
                <div className="p-5 border-b border-sand-50/8">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-sand-50">{plan.title}</h2>
                      <p className="text-xs text-sand-50/40 mt-0.5">
                        Dr. {plan.dentist.person.firstName} {plan.dentist.person.lastName} ·{" "}
                        {new Date(plan.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-sand-50/35 uppercase tracking-wider">Est. cost</p>
                      <p className="text-sm font-display text-turq-400">{total > 0 ? formatNaira(total) : "—"}</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {plan.items.length > 0 && (
                    <div className="mt-4">
                      <div className="flex justify-between text-[10px] text-sand-50/35 mb-1">
                        <span>{completed} of {plan.items.length} completed</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-sand-50/10 rounded-full">
                        <div className="h-full bg-turq-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )}
                  {plan.notes && (
                    <p className="text-xs text-sand-50/40 mt-3 whitespace-pre-wrap">{plan.notes}</p>
                  )}
                </div>

                {/* Items */}
                <ul className="divide-y divide-sand-50/8">
                  {plan.items.map((item) => {
                    const meta = STATUS_META[item.status] ?? STATUS_META.planned;
                    return (
                      <li key={item.itemId} className={`flex items-center justify-between gap-3 px-5 py-3.5 ${item.status === "cancelled" ? "opacity-40" : ""}`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={meta.color}>{meta.icon}</span>
                          <div className="min-w-0">
                            <p className={`text-sm ${item.status === "completed" ? "line-through text-sand-50/40" : "text-sand-50/80"}`}>
                              {item.toothNumber && <span className="text-turq-300 mr-1">#{item.toothNumber}</span>}
                              {item.description}
                              {item.surfaces && <span className="text-sand-50/30"> ({item.surfaces})</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {item.estimatedCharge != null && (
                            <span className="text-xs text-sand-50/40">{formatNaira(item.estimatedCharge)}</span>
                          )}
                          <span className={`text-[10px] uppercase tracking-wider font-medium ${meta.color}`}>
                            {meta.label}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8">
        <Link href="/dashboard/book" className="inline-flex items-center gap-2 bg-turq-600 hover:bg-turq-500 text-ink-950 px-6 py-3 rounded-full text-xs font-semibold uppercase tracking-wider transition-all">
          Book Next Appointment
        </Link>
      </div>
    </div>
  );
}

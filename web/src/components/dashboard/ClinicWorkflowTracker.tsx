"use client";

import React from "react";
import Link from "next/link";
import {
  CalendarPlus,
  CalendarCheck,
  Stethoscope,
  CreditCard,
  RefreshCw,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

export type WorkflowCounts = {
  booked?: number;
  checkedIn?: number;
  inChair?: number;
  needBilling?: number;
  recallsDue?: number;
};

type Props = {
  currentStep?: 1 | 2 | 3 | 4 | 5;
  counts?: WorkflowCounts;
  compact?: boolean;
};

export default function ClinicWorkflowTracker({
  currentStep,
  counts = {},
  compact = false,
}: Props) {
  const steps = [
    {
      step: 1,
      name: "Book & Schedule",
      shortName: "Book",
      subtext: "Appointments",
      href: "/dashboard/reception/calendar",
      count: counts.booked,
      icon: CalendarPlus,
      tone: "text-turq-400 bg-turq-500/10 border-turq-500/25",
    },
    {
      step: 2,
      name: "Check-in Desk",
      shortName: "Check-in",
      subtext: "Waiting Lounge",
      href: "/dashboard/reception/checkin",
      count: counts.checkedIn,
      icon: CalendarCheck,
      tone: "text-blue-400 bg-blue-500/10 border-blue-500/25",
    },
    {
      step: 3,
      name: "Clinical Treatment",
      shortName: "Surgery",
      subtext: "In Chair",
      href: "/dashboard/treatments/today",
      count: counts.inChair,
      icon: Stethoscope,
      tone: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    },
    {
      step: 4,
      name: "Billing & Cash Desk",
      shortName: "Billing",
      subtext: "Cash / POS",
      href: "/dashboard/admin/billing",
      count: counts.needBilling,
      icon: CreditCard,
      tone: "text-amber-400 bg-amber-500/10 border-amber-500/25",
    },
    {
      step: 5,
      name: "Recalls & Follow-Up",
      shortName: "Recalls",
      subtext: "6-Mo Checkup",
      href: "/dashboard/reception/recalls",
      count: counts.recallsDue,
      icon: RefreshCw,
      tone: "text-purple-400 bg-purple-500/10 border-purple-500/25",
    },
  ];

  return (
    <div className="rounded-2xl border border-sand-50/10 bg-ink-900/70 backdrop-blur-xl p-4 sm:p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5 pb-3 border-b border-sand-50/10">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-turq-400 animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-sand-50/60 font-display">
            Daily Patient Journey · 5-Step Clinic Flow
          </span>
        </div>
        {currentStep && (
          <span className="text-xs font-medium text-turq-300 bg-turq-500/10 border border-turq-500/20 px-2.5 py-0.5 rounded-full w-fit">
            Currently on Step {currentStep}: {steps[currentStep - 1]?.name}
          </span>
        )}
      </div>

      {/* Steps bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {steps.map((s, idx) => {
          const isCurrent = currentStep === s.step;
          const Icon = s.icon;

          return (
            <Link
              key={s.step}
              href={s.href}
              className={`group relative flex flex-col justify-between p-3 rounded-xl border transition-all duration-200 ${
                isCurrent
                  ? "bg-turq-500/15 border-turq-400/50 shadow-md shadow-turq-500/5"
                  : "bg-ink-950/50 border-sand-50/10 hover:border-sand-50/25 hover:bg-white/[0.03]"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-sand-50/45">
                  <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold ${
                    isCurrent ? "bg-turq-400 text-ink-950" : "bg-sand-50/10 text-sand-50/70"
                  }`}>
                    {s.step}
                  </span>
                  Step {s.step}
                </span>

                {s.count !== undefined && (
                  <span
                    className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-full border ${
                      s.count > 0 ? s.tone : "text-sand-50/30 bg-sand-50/5 border-sand-50/10"
                    }`}
                  >
                    {s.count}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 mt-1">
                <div
                  className={`p-2 rounded-lg border transition-colors ${
                    isCurrent
                      ? "bg-turq-400 text-ink-950 border-turq-300"
                      : "bg-white/[0.04] text-sand-50/70 border-sand-50/10 group-hover:text-turq-400 group-hover:border-turq-500/30"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-semibold truncate ${
                    isCurrent ? "text-sand-50 font-display" : "text-sand-50/85 group-hover:text-sand-50"
                  }`}>
                    {compact ? s.shortName : s.name}
                  </p>
                  <p className="text-[10px] text-sand-50/40 truncate">
                    {s.subtext}
                  </p>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-sand-50/5 flex items-center justify-between text-[10px] text-sand-50/40 group-hover:text-turq-300 transition-colors">
                <span>{isCurrent ? "Active Step" : "Open Stage"}</span>
                <ArrowRight className="h-3 w-3 opacity-60 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

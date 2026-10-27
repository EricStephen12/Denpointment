import type { ReactNode } from "react";

export default function AdminPageHeader({
  section,
  title,
  description,
  subtitle,
  action,
}: {
  section: string;
  title: string;
  description?: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-sand-50/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-sand-50/40">
            Admin
          </span>
          <span className="text-sand-50/20 text-xs">/</span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-turq-400">
            {section}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-sand-50 tracking-tight">
          {title}
        </h1>
      </div>
      {action && (
        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          {action}
        </div>
      )}
    </header>
  );
}

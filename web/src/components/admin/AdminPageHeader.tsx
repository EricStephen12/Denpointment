import type { ReactNode } from "react";

export default function AdminPageHeader({
  section,
  title,
  description,
  action,
}: {
  section: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-col gap-4 border-b border-sand-50/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="mb-1 text-xs font-medium text-turq-400">Admin / {section}</p>
        <h1 className="text-2xl font-semibold leading-tight text-sand-50">{title}</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-sand-50/50">{description}</p>
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </header>
  );
}

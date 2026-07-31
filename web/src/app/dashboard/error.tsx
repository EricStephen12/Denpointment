"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="p-3 bg-red-500/20 rounded-full mb-4">
        <AlertTriangle className="h-8 w-8 text-red-400" />
      </div>
      <h2 className="text-xl font-semibold text-sand-50 mb-2">Something went wrong</h2>
      <p className="text-sm text-sand-50/50 max-w-md mb-6">
        {error.message || "An unexpected error occurred while loading this page."}
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="bg-turq-600 text-ink-950 py-2.5 px-5 rounded-lg font-semibold text-sm hover:bg-turq-500 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="border border-sand-50/15 text-sand-50/60 py-2.5 px-5 rounded-lg font-semibold text-sm hover:bg-sand-50/8 transition-colors"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

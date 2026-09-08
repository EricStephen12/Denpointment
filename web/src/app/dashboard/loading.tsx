export default function DashboardLoading() {
  return (
    <div className="space-y-12 animate-pulse">
      {/* Greeting skeleton */}
      <div className="space-y-4">
        <div className="h-3 w-32 bg-turq-400/20 rounded-full" />
        <div className="h-10 md:h-12 w-72 bg-sand-50/10 rounded-xl" />
        <div className="h-4 w-48 bg-sand-50/5 rounded-lg" />
      </div>

      {/* KPI Stats Grid skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-sand-50/10 border border-sand-50/10 rounded-2xl overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-ink-900 p-8 flex flex-col gap-4">
            <div className="h-3 w-24 bg-sand-50/10 rounded-full" />
            <div className="h-8 w-16 bg-sand-50/20 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Main card skeleton */}
      <div className="p-8 rounded-2xl bg-sand-50/5 border border-sand-50/10 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-40 bg-sand-50/20 rounded-md" />
            <div className="h-3 w-64 bg-sand-50/10 rounded-md" />
          </div>
          <div className="h-9 w-28 bg-turq-600/20 rounded-full" />
        </div>
        <div className="h-24 bg-sand-50/5 rounded-xl border border-sand-50/5" />
      </div>
    </div>
  );
}


export default function DashboardLoading() {
  return (
    <div className="relative w-full min-h-[320px] flex flex-col items-center justify-center py-16 animate-fade-in">
      {/* Non-intrusive hairline top progress indicator */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[2.5px] bg-ink-950/80 overflow-hidden backdrop-blur-sm">
        <div className="h-full bg-gradient-to-r from-transparent via-turq-400 to-transparent w-2/5 animate-pulse mx-auto" />
      </div>

      {/* Subtle, calm loading badge without heavy screen-shaking skeletons */}
      <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-sand-50/[0.04] border border-sand-50/10 text-sand-50/60 text-xs font-mono tracking-wide">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-turq-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-turq-500" />
        </span>
        <span>Loading clinic workspace…</span>
      </div>
    </div>
  );
}



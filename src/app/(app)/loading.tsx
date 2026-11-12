export default function DashboardLoading() {
  return (
    <div className="shell py-8 md:py-10">
      <div className="flex items-baseline justify-between">
        <span className="label-sm text-muted-foreground">Dashboard</span>
        <span className="label-sm text-muted-foreground">Memuat catatan</span>
      </div>

      <div className="mt-8 animate-pulse md:mt-10" aria-hidden="true">
        <div className="border-t border-line pt-6">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-[132px_minmax(0,1fr)] md:gap-x-10">
            <div className="h-4 w-24 bg-ink/10" />
            <div className="flex flex-col gap-6">
              <div className="h-20 w-48 bg-ink/10" />
              <div className="h-12 w-3/4 bg-ink/10" />
              <div className="h-4 w-40 bg-ink/10" />
              <div className="h-4 w-full max-w-xl bg-ink/10" />
              <div className="h-11 w-64 bg-ink/10" />
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-0 border-l border-t border-line lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="border-r border-b border-line p-5">
              <div className="h-3 w-16 bg-ink/10" />
              <div className="mt-4 h-9 w-20 bg-ink/10" />
              <div className="mt-3 h-3 w-24 bg-ink/10" />
            </div>
          ))}
        </div>

        <div className="mt-10 h-44 w-full border-t border-line bg-ink/5" />
      </div>

      <p className="sr-only" role="status">
        Memuat dashboard.
      </p>
    </div>
  );
}

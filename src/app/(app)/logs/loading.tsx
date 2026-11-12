export default function LogsLoading() {
  return (
    <div className="shell py-8 md:py-10">
      <div className="flex items-baseline justify-between">
        <span className="label-sm text-muted-foreground">Riwayat</span>
        <span className="label-sm text-muted-foreground">Memuat kalender</span>
      </div>

      <div className="mt-8 animate-pulse" aria-hidden="true">
        <div className="h-12 w-1/2 max-w-md bg-ink/10" />
        <div className="mt-4 h-4 w-2/3 max-w-lg bg-ink/10" />

        <div className="mt-8 flex items-center justify-between border-y border-line py-2">
          <div className="flex gap-2">
            <div className="h-11 w-40 bg-ink/10" />
            <div className="h-11 w-40 bg-ink/10" />
          </div>
          <div className="h-3 w-32 bg-ink/10" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-y-5 md:grid-cols-[132px_minmax(0,1fr)] md:gap-x-10">
          <div className="h-4 w-24 bg-ink/10" />
          <div>
            <div className="grid grid-cols-7 gap-px">
              {Array.from({ length: 35 }, (_, index) => (
                <div key={index} className="h-[76px] border border-line-soft" />
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="sr-only" role="status">
        Memuat halaman riwayat.
      </p>
    </div>
  );
}

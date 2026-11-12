export default function QuotesLoading() {
  return (
    <div className="shell py-8 md:py-10">
      <div className="flex items-baseline justify-between">
        <span className="label-sm text-muted-foreground">Quotes</span>
        <span className="label-sm text-muted-foreground">Memuat kutipan</span>
      </div>

      <div className="mt-8 animate-pulse" aria-hidden="true">
        <div className="h-12 w-2/3 max-w-lg bg-ink/10" />
        <div className="mt-4 h-4 w-1/2 max-w-md bg-ink/10" />
        <div className="mt-8 flex flex-wrap gap-2 border-y border-line py-3">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-11 w-28 bg-ink/10" />
          ))}
        </div>
        <div className="mt-6 columns-1 gap-5 sm:columns-2 xl:columns-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="mb-5 break-inside-avoid border border-line p-5">
              <div className="h-3 w-20 bg-ink/10" />
              <div className="mt-4 h-4 w-full bg-ink/10" />
              <div className="mt-2 h-4 w-11/12 bg-ink/10" />
              <div className="mt-2 h-4 w-2/3 bg-ink/10" />
              <div className="mt-5 h-3 w-24 bg-ink/10" />
            </div>
          ))}
        </div>
      </div>

      <p className="sr-only" role="status">
        Memuat halaman kutipan.
      </p>
    </div>
  );
}

export default function BooksLoading() {
  return (
    <div className="shell py-8 md:py-10">
      <div className="flex items-baseline justify-between">
        <span className="label-sm text-muted-foreground">Koleksi</span>
        <span className="label-sm text-muted-foreground">Memuat rak</span>
      </div>

      <div className="mt-8 animate-pulse" aria-hidden="true">
        <div className="h-12 w-1/2 max-w-md bg-ink/10" />
        <div className="mt-4 h-4 w-2/3 max-w-lg bg-ink/10" />

        <div className="mt-8 flex flex-wrap gap-2 border-y border-line py-3">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-11 w-32 bg-ink/10" />
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index}>
              <div className="aspect-[2/3] w-full bg-ink/10" />
              <div className="mt-3 h-3 w-16 bg-ink/10" />
              <div className="mt-3 h-4 w-full bg-ink/10" />
              <div className="mt-2 h-3 w-24 bg-ink/10" />
            </div>
          ))}
        </div>
      </div>

      <p className="sr-only" role="status">
        Memuat halaman koleksi.
      </p>
    </div>
  );
}

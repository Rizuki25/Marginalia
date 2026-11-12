export default function BookDetailLoading() {
  return (
    <div className="shell py-8 md:py-10">
      <div className="flex items-baseline justify-between">
        <span className="label-sm text-muted-foreground">Detail buku</span>
        <span className="label-sm text-muted-foreground">Memuat</span>
      </div>

      <div className="mt-8 animate-pulse md:mt-10" aria-hidden="true">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-4 lg:col-span-3">
            <div className="aspect-[2/3] w-full max-w-[220px] bg-ink/10" />
          </div>
          <div className="md:col-span-8 lg:col-span-9">
            <div className="h-11 w-3/4 max-w-lg bg-ink/10" />
            <div className="mt-4 h-4 w-40 bg-ink/10" />
            <div className="mt-8 h-4 w-full max-w-xl bg-ink/10" />
            <div className="mt-6 h-14 w-full max-w-md bg-ink/10" />
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-8">
          {Array.from({ length: 2 }, (_, index) => (
            <div key={index} className="border-t border-line pt-6">
              <div className="h-3 w-24 bg-ink/10" />
              <div className="mt-5 h-11 w-full max-w-md bg-ink/10" />
            </div>
          ))}
        </div>
      </div>

      <p className="sr-only" role="status">
        Memuat detail buku.
      </p>
    </div>
  );
}

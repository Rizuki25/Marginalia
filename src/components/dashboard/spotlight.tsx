import Image from "next/image";
import type { BookRow } from "@/lib/types";
import { LogDialog } from "./log-dialog";
import { QuoteDialog } from "./quote-dialog";
import type { BookOption } from "./types";

export function Spotlight({
  book,
  readingBooks,
  allBooks,
}: {
  book: BookRow;
  readingBooks: BookOption[];
  allBooks: BookOption[];
}) {
  const pct =
    book.total_pages > 0
      ? Math.min(100, Math.round((book.current_page / book.total_pages) * 100))
      : 0;

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
      <div className="lg:col-span-7">
        <p className="label-sm text-muted-foreground">Halaman terakhir</p>
        <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-3">
          <span className="num text-[clamp(60px,10vw,124px)] font-semibold leading-[0.8] tracking-[-0.05em]">
            {book.current_page}
          </span>
          <span className="num mb-1 text-[clamp(18px,2.4vw,26px)] leading-none text-muted-foreground">
            / {book.total_pages}
          </span>
          <span className="label mb-1 border border-ink px-2 py-1">{pct}%</span>
        </div>

        <h1 className="display mt-8 text-[clamp(34px,4.6vw,62px)]">{book.title}</h1>
        <p className="label mt-4 text-muted-foreground">
          {book.author}
          {book.category ? ` · ${book.category}` : ""}
        </p>

        <div className="mt-8 max-w-xl">
          <div className="flex items-baseline justify-between gap-4">
            <span className="label">Progres halaman</span>
            <span className="num text-[11px] text-muted-foreground">
              {book.current_page} / {book.total_pages}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label={`Progres membaca ${book.title}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            className="mt-2 h-4 w-full border border-ink bg-paper p-[2px]"
          >
            <div className="h-full bg-neon" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <LogDialog books={readingBooks} />
          <QuoteDialog books={allBooks} />
        </div>
      </div>

      <div className="lg:col-span-5">
        <div className="w-full max-w-[300px] lg:ml-auto">
          <div className="relative aspect-[2/3] w-full overflow-hidden border border-ink bg-ink">
            {book.cover_url ? (
              <Image
                src={book.cover_url}
                alt={`Sampul ${book.title}`}
                fill
                sizes="(min-width: 1024px) 300px, 70vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full flex-col justify-between p-4">
                <span className="label-sm text-paper/60">Sampul</span>
                <div>
                  <p className="font-sans text-[22px] font-extrabold leading-[1.05] tracking-[-0.03em] text-paper">
                    {book.title}
                  </p>
                  <p className="label-sm mt-2 text-paper/60">{book.author}</p>
                </div>
              </div>
            )}
          </div>
          {book.cover_url ? null : (
            <p className="label-sm mt-2 text-muted-foreground">
              Sampul belum diunggah
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

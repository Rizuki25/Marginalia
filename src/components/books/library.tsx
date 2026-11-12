"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "cn";
import { formatShortDate } from "@/lib/date";
import { STATUS_LABEL, STATUS_ORDER } from "@/lib/status";
import type { BookStatus } from "@/lib/types";
import type { LibraryBook } from "@/lib/data/books";
import { BookCover } from "./book-cover";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="num text-[11px] tracking-[0.18em] text-ink" aria-label={`${rating} dari 5 bintang`}>
      <span aria-hidden="true">
        {"★".repeat(rating)}
        <span className="text-ink/25">{"★".repeat(5 - rating)}</span>
      </span>
    </span>
  );
}

function BookCard({ book }: { book: LibraryBook }) {
  return (
    <article className="group flex flex-col">
      <Link
        href={`/books/${book.id}`}
        className="pixel-lift block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink hover:[&>div]:shadow-[4px_4px_0_0_var(--ink)]"
      >
        <BookCover
          title={book.title}
          author={book.author}
          src={book.cover_url}
          sizes="(min-width: 1280px) 280px, (min-width: 768px) 30vw, 45vw"
        />
      </Link>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="label-sm border border-line px-1.5 py-0.5 text-muted-foreground">
          {STATUS_LABEL[book.status]}
        </span>
        {book.status === "FINISHED" && book.rating ? (
          <Stars rating={book.rating} />
        ) : (
          <span className="num text-[10px] text-muted-foreground">
            {book.percent}%
          </span>
        )}
      </div>

      <Link
        href={`/books/${book.id}`}
        className="mt-2 font-sans text-[17px] font-semibold leading-[1.2] tracking-[-0.02em] text-ink underline-offset-4 hover:underline"
      >
        {book.title}
      </Link>
      <p className="label-sm mt-1 text-muted-foreground">{book.author}</p>

      {book.status === "READING" ? (
        <div className="mt-3">
          <div className="flex items-baseline justify-between">
            <span className="num text-[10px] text-muted-foreground">
              {book.current_page} / {book.total_pages}
            </span>
            <span className="num text-[10px] text-muted-foreground">
              {book.sessions} sesi
            </span>
          </div>
          <div
            role="progressbar"
            aria-label={`Progres ${book.title}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={book.percent}
            className="mt-1.5 h-2 w-full border border-ink bg-paper p-[1px]"
          >
            <div className="h-full bg-neon" style={{ width: `${book.percent}%` }} />
          </div>
        </div>
      ) : (
        <p className="label-sm mt-3 text-muted-foreground">
          {book.status === "FINISHED" && book.finished_at
            ? `Tamat ${formatShortDate(book.finished_at)}`
            : book.status === "WANT_TO_READ"
              ? `${book.total_pages} halaman`
              : book.lastLogDate
                ? `Terakhir ${formatShortDate(book.lastLogDate)}`
                : "Belum ada catatan"}
        </p>
      )}
    </article>
  );
}

export function Library({
  books,
  counts,
}: {
  books: LibraryBook[];
  counts: Record<BookStatus, number>;
}) {
  const initial = useMemo<BookStatus>(() => {
    if (counts.READING > 0) return "READING";
    const firstWithBooks = STATUS_ORDER.find((status) => counts[status] > 0);
    return firstWithBooks ?? "READING";
  }, [counts]);

  const [tab, setTab] = useState<BookStatus>(initial);
  const visible = books.filter((book) => book.status === tab);

  return (
    <div>
      <div
        role="group"
        aria-label="Filter rak buku"
        className="flex flex-wrap gap-2 border-y border-line py-3"
      >
        {STATUS_ORDER.map((status) => {
          const active = tab === status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => setTab(status)}
              aria-pressed={active}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 border px-3 transition-colors",
                active
                  ? "border-ink bg-ink text-paper"
                  : "border-line text-ink hover:border-ink",
              )}
            >
              <span className="label">{STATUS_LABEL[status]}</span>
              <span
                className={cn(
                  "num text-[10px]",
                  active ? "text-paper/60" : "text-muted-foreground",
                )}
              >
                {counts[status]}
              </span>
            </button>
          );
        })}
      </div>

      <p className="label-sm mt-4 text-muted-foreground" role="status">
        {visible.length} buku di rak {STATUS_LABEL[tab].toLowerCase()}
      </p>

      {visible.length === 0 ? (
        <div className="mt-6 border border-line p-6 md:p-8">
          <p className="display-2 max-w-xl text-[clamp(20px,2.2vw,26px)]">
            Rak ini masih kosong.
          </p>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground">
            Pindahkan buku ke rak ini dari halaman detail buku, atau tambahkan
            buku baru.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
          {visible.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}

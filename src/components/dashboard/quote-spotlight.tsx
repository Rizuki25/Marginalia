"use client";

import { useState } from "react";
import type { DashboardQuote } from "@/lib/data/dashboard";
import { QuoteDialog } from "./quote-dialog";
import type { BookOption } from "./types";

export function QuoteSpotlight({
  quotes,
  books,
}: {
  quotes: DashboardQuote[];
  books: BookOption[];
}) {
  const [index, setIndex] = useState(0);

  if (quotes.length === 0) {
    return (
      <div className="border border-line p-6 md:p-8">
        <p className="display-2 max-w-xl text-[clamp(20px,2.2vw,26px)]">
          Belum ada kutipan tersimpan.
        </p>
        <p className="mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground">
          Kutipan yang kamu simpan akan muncul di sini, satu setiap kali kamu
          membuka dashboard.
        </p>
        <div className="mt-6">
          {books.length > 0 ? (
            <QuoteDialog books={books} triggerLabel="Simpan kutipan" />
          ) : (
            <p className="label-sm text-muted-foreground">
              Tambahkan buku dulu, kutipan selalu menempel pada satu buku.
            </p>
          )}
        </div>
      </div>
    );
  }

  const quote = quotes[index % quotes.length];
  const source = [
    quote.bookTitle,
    quote.page_number ? `Hal. ${quote.page_number}` : null,
    quote.chapter,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <figure className="bg-ink px-6 py-8 text-paper md:px-10 md:py-12">
      <div className="flex items-center justify-between gap-4">
        <p className="label-sm text-paper/60">Kutipan pilihan</p>
        {quote.is_favorite ? (
          <span className="label-sm border border-paper/40 px-2 py-1 text-paper/80">
            Favorit
          </span>
        ) : null}
      </div>

      <blockquote className="display-2 mt-6 max-w-3xl text-[clamp(21px,2.4vw,32px)] text-paper">
        &ldquo;{quote.content}&rdquo;
      </blockquote>

      <figcaption className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-paper/20 pt-4">
        <span className="label-sm text-paper/70">{source}</span>
        {quotes.length > 1 ? (
          <button
            type="button"
            onClick={() => setIndex((current) => (current + 1) % quotes.length)}
            className="label-sm inline-flex min-h-11 items-center border border-paper/40 px-4 text-paper transition-colors hover:bg-paper hover:text-ink"
          >
            Kutipan lain
          </button>
        ) : null}
      </figcaption>
    </figure>
  );
}

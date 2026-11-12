"use client";

import { useMemo, useState } from "react";
import { cn } from "cn";
import type { VaultBook, VaultQuote, VaultTag } from "@/lib/data/quotes";
import { QuoteCard } from "./quote-card";

type BookFilter = "all" | "favorite" | string;

function normalize(value: string): string {
  return value.toLowerCase().normalize("NFKD");
}

function matchesQuery(quote: VaultQuote, query: string): boolean {
  if (query === "") return true;
  const haystack = normalize(
    [
      quote.content,
      quote.personal_note ?? "",
      quote.chapter ?? "",
      quote.bookTitle,
      quote.bookAuthor,
      quote.tags.join(" "),
    ].join(" "),
  );
  return query
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

function Chip({
  active,
  count,
  onClick,
  children,
  label,
}: {
  active: boolean;
  count: number;
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`${label}, ${count} kutipan`}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 border px-3 transition-colors",
        active
          ? "border-ink bg-ink text-paper"
          : "border-line text-ink hover:border-ink",
      )}
    >
      <span className="label">{children}</span>
      <span
        className={cn(
          "num text-[10px]",
          active ? "text-paper/60" : "text-muted-foreground",
        )}
      >
        {count}
      </span>
    </button>
  );
}

export function QuotesGallery({
  quotes,
  filterBooks,
  filterTags,
}: {
  quotes: VaultQuote[];
  filterBooks: VaultBook[];
  filterTags: VaultTag[];
}) {
  const [book, setBook] = useState<BookFilter>("all");
  const [tag, setTag] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const normalizedQuery = normalize(query.trim());

  const afterBook = useMemo(() => {
    if (book === "all") return quotes;
    if (book === "favorite") return quotes.filter((quote) => quote.is_favorite);
    return quotes.filter((quote) => quote.book_id === book);
  }, [quotes, book]);

  const visible = useMemo(
    () =>
      afterBook.filter(
        (quote) =>
          (tag === null || quote.tags.includes(tag)) &&
          matchesQuery(quote, normalizedQuery),
      ),
    [afterBook, tag, normalizedQuery],
  );

  const bookCount = (id: BookFilter) => {
    if (id === "all") return quotes.length;
    if (id === "favorite")
      return quotes.filter((quote) => quote.is_favorite).length;
    return quotes.filter((quote) => quote.book_id === id).length;
  };

  const tagCount = (name: string) =>
    afterBook.filter((quote) => quote.tags.includes(name)).length;

  // Tags are scoped to the current book filter, so a chip never points at an
  // empty result.
  const visibleTags = filterTags.filter((item) => tagCount(item.name) > 0);

  // Switching books drops a tag that does not exist under the new book, so the
  // grid never lands on a confusing zero-result combination.
  const selectBook = (next: BookFilter) => {
    setBook(next);
    if (tag === null) return;
    const stillThere = quotes.some(
      (quote) =>
        quote.tags.includes(tag) &&
        (next === "all" ||
          (next === "favorite" ? quote.is_favorite : quote.book_id === next)),
    );
    if (!stillThere) setTag(null);
  };

  const bookOptions: Array<{ id: BookFilter; label: string }> = [
    { id: "all", label: "Semua" },
    { id: "favorite", label: "Favorit" },
    ...filterBooks.map((item) => ({ id: item.id, label: item.title })),
  ];

  const activeFilters =
    (book !== "all" ? 1 : 0) + (tag !== null ? 1 : 0) + (query.trim() ? 1 : 0);

  const reset = () => {
    setBook("all");
    setTag(null);
    setQuery("");
  };

  return (
    <div>
      <div className="border-t border-line pt-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="quote-search" className="label text-ink">
            Cari kutipan
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              id="quote-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Kata di kutipan, judul buku, bab, atau tag"
              className="h-11 w-full max-w-xl rounded-[6px] border border-line bg-paper px-3 font-sans text-[15px] text-ink placeholder:text-muted-foreground transition-colors hover:border-ink/30 focus-visible:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="label-sm inline-flex min-h-11 items-center border border-line px-3 text-muted-foreground transition-colors hover:border-ink hover:text-ink"
              >
                Hapus teks
              </button>
            ) : null}
            {activeFilters > 0 ? (
              <button
                type="button"
                onClick={reset}
                className="label-sm inline-flex min-h-11 items-center border border-ink px-3 text-ink transition-colors hover:bg-ink hover:text-paper"
              >
                Reset filter
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-1.5">
          <p className="label-sm text-muted-foreground">Buku</p>
          <div
            role="group"
            aria-label="Filter kutipan"
            className="flex flex-wrap gap-2"
          >
            {bookOptions.map((option) => (
              <Chip
                key={option.id}
                label={option.label}
                active={book === option.id}
                count={bookCount(option.id)}
                onClick={() => selectBook(option.id)}
              >
                {option.label}
              </Chip>
            ))}
          </div>
        </div>

        {visibleTags.length > 0 ? (
          <div className="mt-4 flex flex-col gap-1.5">
            <p className="label-sm text-muted-foreground">Tag</p>
            <div
              role="group"
              aria-label="Filter tag kutipan"
              className="flex flex-wrap gap-2"
            >
              {visibleTags.map((item) => (
                <Chip
                  key={item.name}
                  label={`Tag ${item.name}`}
                  active={tag === item.name}
                  count={tagCount(item.name)}
                  onClick={() => setTag(tag === item.name ? null : item.name)}
                >
                  #{item.name}
                </Chip>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2 border-t border-line pt-4">
        <p className="label-sm text-muted-foreground" role="status">
          Menampilkan {visible.length} dari {quotes.length} kutipan
        </p>
        {activeFilters > 0 ? (
          <p className="label-sm text-muted-foreground">
            {activeFilters} filter aktif
          </p>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <div className="mt-6 border border-line p-6 md:p-8">
          <p className="display-2 max-w-xl text-[clamp(20px,2.2vw,26px)]">
            {normalizedQuery || tag || book !== "all"
              ? "Tidak ada kutipan yang cocok."
              : "Belum ada kutipan."}
          </p>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground">
            Coba kata lain, atau longgarkan filter. Klik Reset filter untuk
            melihat seluruh koleksi.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-11 items-center rounded-[6px] border border-ink bg-neon px-5 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-on-accent transition-colors hover:bg-[#c6eb00]"
            >
              Reset filter
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 columns-1 gap-5 sm:columns-2 xl:columns-3">
          {visible.map((quote) => (
            <QuoteCard key={quote.id} quote={quote} />
          ))}
        </div>
      )}
    </div>
  );
}

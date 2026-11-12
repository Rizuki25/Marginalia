import { deleteQuoteAction, toggleQuoteFavoriteAction } from "@/lib/actions";
import { ConfirmAction } from "@/components/wild/confirm-action";
import { EditQuoteDialog } from "./edit-quote-dialog";
import { ExportQuoteCard } from "./export-quote-card";
import type { VaultQuote } from "@/lib/data/quotes";

export function QuoteCard({ quote }: { quote: VaultQuote }) {
  const place = [
    quote.page_number ? `Hal. ${quote.page_number}` : null,
    quote.chapter,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="pixel-lift mb-5 break-inside-avoid border border-line bg-paper p-5 hover:border-ink/50 hover:shadow-[4px_4px_0_0_var(--ink)]">
      <div className="flex items-start justify-between gap-3">
        <p className="label-sm text-muted-foreground">{place || "Tanpa halaman"}</p>
        <form action={toggleQuoteFavoriteAction}>
          <input type="hidden" name="quoteId" value={quote.id} />
          <input
            type="hidden"
            name="isFavorite"
            value={quote.is_favorite ? "false" : "true"}
          />
          <button
            type="submit"
            aria-pressed={quote.is_favorite}
            aria-label={
              quote.is_favorite
                ? `Hapus ${quote.bookTitle} dari favorit`
                : `Tandai ${quote.bookTitle} sebagai favorit`
            }
            className={
              quote.is_favorite
                ? "label-sm inline-flex min-h-11 items-center gap-1.5 border border-ink bg-ink px-2.5 text-paper"
                : "label-sm inline-flex min-h-11 items-center gap-1.5 border border-line px-2.5 text-muted-foreground transition-colors hover:border-ink hover:text-ink"
            }
          >
            <span
              aria-hidden="true"
              className={
                quote.is_favorite
                  ? "size-2 bg-neon"
                  : "size-2 border border-current"
              }
            />
            Favorit
          </button>
        </form>
      </div>

      <blockquote className="mt-4 font-sans text-[17px] leading-[1.5] tracking-[-0.01em] text-ink">
        {quote.content}
      </blockquote>

      {quote.personal_note ? (
        <p className="mt-4 border-l-2 border-ink pl-3 font-sans text-[13px] leading-snug text-muted-foreground">
          {quote.personal_note}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-t border-line pt-3">
        <div className="min-w-0">
          <p className="label-sm text-ink">{quote.bookTitle}</p>
          <p className="label-sm mt-1 text-muted-foreground">{quote.bookAuthor}</p>
          {quote.tags.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {quote.tags.map((tag) => (
                <li
                  key={tag}
                  className="label-sm border border-line px-1.5 py-0.5 text-muted-foreground"
                >
                  #{tag}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <ExportQuoteCard quote={quote} />
          <EditQuoteDialog quote={quote} />
          <ConfirmAction
            triggerLabel="Hapus"
            title="Hapus kutipan ini?"
            description={`Kutipan dari ${quote.bookTitle} akan dihapus permanen, termasuk tag-nya.`}
            confirmLabel="Hapus kutipan"
            successMessage="Kutipan dihapus."
            action={deleteQuoteAction}
            hidden={{ quoteId: quote.id }}
          />
        </div>
      </div>
    </article>
  );
}

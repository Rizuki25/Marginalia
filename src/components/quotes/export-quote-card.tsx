"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cardFilename, downloadBlob, renderQuoteCard } from "@/lib/quotes/card";
import type { VaultQuote } from "@/lib/data/quotes";

/**
 * Download button for one quote. Rendering happens on click, so nothing is
 * drawn for cards the reader never exports.
 */
export function ExportQuoteCard({ quote }: { quote: VaultQuote }) {
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      const card = {
        content: quote.content,
        bookTitle: quote.bookTitle,
        bookAuthor: quote.bookAuthor,
        pageNumber: quote.page_number,
        chapter: quote.chapter,
        personalNote: quote.personal_note,
        tags: quote.tags,
      };
      const blob = await renderQuoteCard(card);
      downloadBlob(blob, cardFilename(card));
      toast.success("Kartu kutipan diunduh.");
    } catch {
      toast.error("Gagal membuat gambar. Coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void run()}
      disabled={busy}
      className="label-sm inline-flex min-h-11 items-center border border-line px-2.5 text-muted-foreground transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
    >
      {busy ? "Menyiapkan..." : "Kartu"}
    </button>
  );
}

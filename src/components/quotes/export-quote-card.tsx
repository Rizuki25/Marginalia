"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  cardFilename,
  downloadBlob,
  renderQuoteCard,
  type QuoteCardOrientation,
} from "@/lib/quotes/card";
import { notifyDownloaded, notifyError } from "@/lib/notify";
import { PendingSweep, PixelSpinner } from "@/components/wild/feedback-popup";
import type { VaultQuote } from "@/lib/data/quotes";

const ORIENTATION_OPTIONS: Array<{
  id: QuoteCardOrientation;
  title: string;
  spec: string;
  description: string;
  successMessage: string;
}> = [
  {
    id: "portrait",
    title: "Portrait Mobile",
    spec: "1080 × 1920 PX · 9:16",
    description: "Pas untuk layar HP, story, atau dibagikan vertikal.",
    successMessage: "Kartu kutipan portrait mobile diunduh.",
  },
  {
    id: "landscape",
    title: "Landscape",
    spec: "1920 × 1080 PX · 16:9",
    description: "Pas untuk layar lebar, desktop, atau presentasi.",
    successMessage: "Kartu kutipan landscape diunduh.",
  },
];

/**
 * Download button and orientation picker dialog for one quote card.
 * Rendering happens only when the reader picks a format.
 */
export function ExportQuoteCard({ quote }: { quote: VaultQuote }) {
  const [open, setOpen] = useState(false);
  const [busyOrientation, setBusyOrientation] =
    useState<QuoteCardOrientation | null>(null);

  const run = async (option: (typeof ORIENTATION_OPTIONS)[number]) => {
    setBusyOrientation(option.id);
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
      const blob = await renderQuoteCard(card, option.id);
      downloadBlob(blob, cardFilename(card, option.id));
      setOpen(false);
      notifyDownloaded(option.successMessage);
    } catch {
      notifyError("Gagal membuat gambar. Coba lagi.");
    } finally {
      setBusyOrientation(null);
    }
  };

  const isBusy = busyOrientation !== null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isBusy) setOpen(next);
      }}
    >
      <DialogTrigger
        type="button"
        className="label-sm inline-flex min-h-11 items-center gap-1.5 border border-line px-2.5 text-muted-foreground transition-colors hover:border-ink hover:text-ink"
      >
        Kartu
      </DialogTrigger>
      <DialogContent
        className="overflow-hidden border-line bg-paper sm:max-w-lg"
        showCloseButton={!isBusy}
      >
        <PendingSweep active={isBusy} />
        <DialogHeader>
          <DialogTitle>Unduh kartu kutipan</DialogTitle>
          <DialogDescription>
            Pilih ukuran gambar sesuai layar sebelum mengunduh file PNG.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
          {ORIENTATION_OPTIONS.map((option) => {
            const renderingThis = busyOrientation === option.id;
            const isPortrait = option.id === "portrait";

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => void run(option)}
                disabled={isBusy}
                className="group flex min-h-11 cursor-pointer flex-col items-start justify-between border border-line bg-paper p-4 text-left transition-colors hover:border-ink hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink disabled:cursor-wait disabled:opacity-60"
              >
                <div className="flex w-full items-center justify-between gap-3">
                  <div
                    aria-hidden="true"
                    className={`flex items-start justify-start border border-ink/40 bg-paper p-1.5 transition-colors group-hover:border-ink ${
                      isPortrait ? "h-11 w-7" : "h-7 w-11"
                    }`}
                  >
                    <span className="block h-1 w-2.5 bg-neon" />
                  </div>
                  {renderingThis ? (
                    <span className="label-sm inline-flex items-center gap-1.5 text-ink">
                      <PixelSpinner />
                      <span>Menyiapkan...</span>
                    </span>
                  ) : (
                    <span className="label-sm text-muted-foreground transition-colors group-hover:text-ink">
                      PNG 2x
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <p className="text-[15px] font-semibold text-ink">
                    {option.title}
                  </p>
                  <p className="label-sm mt-1 text-muted-foreground">
                    {option.spec}
                  </p>
                  <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useTransition } from "react";
import { toggleQuoteFavoriteAction } from "@/lib/actions";
import { notifyUpdated } from "@/lib/notify";
import { PixelSpinner } from "@/components/wild/feedback-popup";

export function QuoteFavoriteButton({
  quoteId,
  bookTitle,
  isFavorite,
}: {
  quoteId: string;
  bookTitle: string;
  isFavorite: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const next = !isFavorite;

  const submit = (formData: FormData) => {
    startTransition(async () => {
      await toggleQuoteFavoriteAction(formData);
      notifyUpdated(
        next
          ? "Kutipan ditandai favorit."
          : "Kutipan dihapus dari favorit.",
      );
    });
  };

  return (
    <form action={submit} aria-busy={pending}>
      <input type="hidden" name="quoteId" value={quoteId} />
      <input type="hidden" name="isFavorite" value={next ? "true" : "false"} />
      <button
        type="submit"
        disabled={pending}
        aria-pressed={isFavorite}
        aria-label={
          isFavorite
            ? `Hapus ${bookTitle} dari favorit`
            : `Tandai ${bookTitle} sebagai favorit`
        }
        className={
          isFavorite
            ? "label-sm inline-flex min-h-11 items-center gap-1.5 border border-ink bg-ink px-2.5 text-paper transition-opacity disabled:opacity-60"
            : "label-sm inline-flex min-h-11 items-center gap-1.5 border border-line px-2.5 text-muted-foreground transition-colors hover:border-ink hover:text-ink disabled:opacity-60"
        }
      >
        {pending ? (
          <PixelSpinner />
        ) : (
          <span
            aria-hidden="true"
            className={
              isFavorite ? "size-2 bg-neon" : "size-2 border border-current"
            }
          />
        )}
        <span>{pending ? "Menyimpan..." : "Favorit"}</span>
      </button>
    </form>
  );
}

import type { BookRow, BookStatus, ReadingLogRow } from "@/lib/types";

export interface ProgressPatch {
  current_page: number;
  status: BookStatus;
  finished_at: string | null;
}

/**
 * Derives a book's position from its remaining logs. Used after a log is edited
 * or deleted, because `current_page` is a cache of the highest `end_page` and
 * would otherwise point at a row that no longer exists.
 *
 * Status rule: a book that is no longer at its last page cannot stay "Selesai",
 * so it drops back to "Sedang dibaca". This also undoes the auto-finish that
 * happens when the final log is removed.
 */
export function recomputeProgress(
  book: Pick<BookRow, "total_pages" | "status" | "finished_at">,
  logs: ReadingLogRow[],
): ProgressPatch {
  const highest = logs.reduce((max, log) => Math.max(max, log.end_page), 0);
  const currentPage = Math.min(highest, book.total_pages);

  if (book.status === "FINISHED" && currentPage < book.total_pages) {
    return { current_page: currentPage, status: "READING", finished_at: null };
  }

  return {
    current_page: currentPage,
    status: book.status,
    finished_at: book.finished_at,
  };
}

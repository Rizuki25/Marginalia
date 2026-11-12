import type { BookStatus } from "@/lib/types";

export const STATUS_ORDER: BookStatus[] = [
  "READING",
  "WANT_TO_READ",
  "FINISHED",
  "DNF",
];

export const STATUS_LABEL: Record<BookStatus, string> = {
  READING: "Sedang dibaca",
  WANT_TO_READ: "Ingin dibaca",
  FINISHED: "Selesai",
  DNF: "Berhenti",
};

export const STATUS_SHORT: Record<BookStatus, string> = {
  READING: "Dibaca",
  WANT_TO_READ: "Antre",
  FINISHED: "Selesai",
  DNF: "Berhenti",
};

export function isBookStatus(value: string): value is BookStatus {
  return STATUS_ORDER.includes(value as BookStatus);
}

export function progressPercent(current: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((current / total) * 100));
}

/** Date helpers. All dates are plain `YYYY-MM-DD` strings. */

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const DEFAULT_TIME_ZONE =
  process.env.MARGINALIA_TIMEZONE ?? "Asia/Jakarta";

const serverDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: DEFAULT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const utcDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "UTC",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayISO(now = new Date()): string {
  if (typeof window !== "undefined") {
    return toISODate(now);
  }
  return serverDateFormatter.format(now);
}

/**
 * Resolves the maximum allowed reading log date (`YYYY-MM-DD`).
 * Never drops below the server's configured timezone (`Asia/Jakarta`), so
 * privacy-hardened browsers that spoof UTC (such as Firefox RFP) cannot
 * block today's WIB date.
 */
export function resolveMaxLogDate(
  clientToday?: string | null,
  now = new Date(),
): string {
  const fallback = todayISO(now);
  if (!clientToday || !ISO_DATE_RE.test(clientToday)) return fallback;

  const utcToday = utcDateFormatter.format(now);
  if (
    clientToday >= addDays(utcToday, -1) &&
    clientToday <= addDays(utcToday, 1) &&
    clientToday > fallback
  ) {
    return clientToday;
  }
  return fallback;
}

/**
 * Validates a `YYYY-MM-DD` reading log date against the reader's local today.
 * Returns an Indonesian error message if invalid, or `null` when valid.
 */
export function validateLogDate(
  logDate: string,
  clientToday?: string | null,
): string | null {
  if (!ISO_DATE_RE.test(logDate)) return "Tanggal baca tidak valid.";

  const maxDate = resolveMaxLogDate(clientToday);
  if (logDate > maxDate) {
    return `Tanggal baca (${formatLongDate(logDate)}) tidak boleh melewati hari ini (${formatLongDate(maxDate)}).`;
  }
  return null;
}

export function parseISODate(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

export function addDays(iso: string, days: number): string {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function lastNDates(days: number, today = todayISO()): string[] {
  return Array.from({ length: days }, (_, index) =>
    addDays(today, index - (days - 1)),
  );
}

/** `YYYY-MM` of the month that contains `iso`. */
export function monthOf(iso: string): string {
  return iso.slice(0, 7);
}

export function addMonths(month: string, delta: number): string {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(year, monthIndex - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Every date in the month, in order. */
export function monthDates(month: string): string[] {
  const [year, monthIndex] = month.split("-").map(Number);
  const count = new Date(year, monthIndex, 0).getDate();
  return Array.from(
    { length: count },
    (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`,
  );
}

/** Blank cells before the 1st, for a week that starts on Monday. */
export function firstWeekdayOffset(month: string): number {
  return (parseISODate(`${month}-01`).getDay() + 6) % 7;
}

const monthFormatter = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
});

export function formatMonth(month: string): string {
  return monthFormatter.format(parseISODate(`${month}-01`));
}

/** Monday of the ISO week that contains `iso`. */
export function startOfWeek(iso: string): string {
  const date = parseISODate(iso);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(iso, diff);
}

const longFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const shortFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
});

const weekdayFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "narrow",
});

export function formatLongDate(iso: string): string {
  return longFormatter.format(parseISODate(iso)).replace(/\./g, "");
}

export function formatShortDate(iso: string): string {
  return shortFormatter.format(parseISODate(iso)).replace(/\./g, "");
}

export function formatWeekday(iso: string): string {
  return weekdayFormatter.format(parseISODate(iso));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

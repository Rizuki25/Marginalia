/** Date helpers. All dates are plain `YYYY-MM-DD` strings in local time. */

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
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

import { addMonths, monthOf, todayISO } from "@/lib/date";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/supabase/session";
import { readDb } from "@/lib/demo/store";
import { DEMO_USER_ID } from "@/lib/demo/seed";
import type { BookRow, ReadingLogRow } from "@/lib/types";

export type DataMode = "supabase" | "demo";

export interface MonthLog extends ReadingLogRow {
  bookTitle: string;
  bookTotalPages: number;
}

export interface LogsData {
  mode: DataMode;
  /** Month the page shows, `YYYY-MM`. Already clamped to the range with data. */
  month: string;
  currentMonth: string;
  earliestMonth: string | null;
  /** Months that hold at least one log, newest first. */
  months: string[];
  /** Logs of `month` only, newest date first. */
  logs: MonthLog[];
  books: BookRow[];
}

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const LOG_LIMIT = 1000;

/**
 * Reads the month from the URL, then keeps it inside the range that can show
 * something: never past the current month, never before the first log. A
 * hand-typed value that fails either check falls back to the nearest edge
 * instead of rendering an empty calendar.
 */
function resolveMonth(
  raw: string | undefined,
  currentMonth: string,
  earliestMonth: string | null,
): string {
  if (!raw || !MONTH_RE.test(raw)) return currentMonth;
  if (raw > currentMonth) return currentMonth;
  if (!earliestMonth) return currentMonth;
  return raw < earliestMonth ? earliestMonth : raw;
}

function buildLogsData(
  mode: DataMode,
  books: BookRow[],
  rows: ReadingLogRow[],
  rawMonth: string | undefined,
): LogsData {
  const byId = new Map(books.map((book) => [book.id, book]));

  const logs: MonthLog[] = [];
  for (const row of rows) {
    const book = byId.get(row.book_id);
    if (!book) continue;
    logs.push({ ...row, bookTitle: book.title, bookTotalPages: book.total_pages });
  }

  logs.sort(
    (a, b) =>
      b.log_date.localeCompare(a.log_date) ||
      b.created_at.localeCompare(a.created_at),
  );

  const months = [...new Set(logs.map((log) => monthOf(log.log_date)))].sort(
    (a, b) => b.localeCompare(a),
  );
  const currentMonth = monthOf(todayISO());
  const earliestMonth = months.length > 0 ? months[months.length - 1] : null;
  const month = resolveMonth(rawMonth, currentMonth, earliestMonth);

  return {
    mode,
    month,
    currentMonth,
    earliestMonth,
    months,
    logs: logs.filter((log) => monthOf(log.log_date) === month),
    books,
  };
}

/** Adjacent months for the pager, `null` once the range is used up. */
export function monthNeighbours(data: Pick<LogsData, "month" | "currentMonth" | "earliestMonth">) {
  const previous = addMonths(data.month, -1);
  const next = addMonths(data.month, 1);

  return {
    previous: data.earliestMonth && previous >= data.earliestMonth ? previous : null,
    next: next <= data.currentMonth ? next : null,
  };
}

export async function getLogsData(rawMonth?: string): Promise<LogsData> {
  if (!isSupabaseConfigured) {
    const db = await readDb();
    const books = db.books.filter((book) => book.user_id === DEMO_USER_ID);
    const ids = new Set(books.map((book) => book.id));
    const logs = db.reading_logs.filter((log) => ids.has(log.book_id));

    return buildLogsData("demo", books, logs, rawMonth);
  }

  const user = await getSessionUser();
  if (!user) throw new Error("Sesi tidak ditemukan. Silakan masuk lagi.");

  const supabase = await createClient();

  const [booksRes, logsRes] = await Promise.all([
    supabase.from("books").select("*").order("title"),
    supabase
      .from("reading_logs")
      .select("*")
      .order("log_date", { ascending: false })
      .limit(LOG_LIMIT),
  ]);

  const firstError = booksRes.error ?? logsRes.error;
  if (firstError) throw new Error(firstError.message);

  return buildLogsData(
    "supabase",
    (booksRes.data ?? []) as BookRow[],
    (logsRes.data ?? []) as ReadingLogRow[],
    rawMonth,
  );
}

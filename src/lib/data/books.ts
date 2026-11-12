import { cache } from "react";
import { notFound } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/supabase/session";
import { readDb } from "@/lib/demo/store";
import { DEMO_USER_ID } from "@/lib/demo/seed";
import { progressPercent, STATUS_ORDER } from "@/lib/status";
import type {
  BookRow,
  BookStatus,
  QuoteRow,
  ReadingLogRow,
} from "@/lib/types";

export type DataMode = "supabase" | "demo";

export interface LibraryBook extends BookRow {
  percent: number;
  sessions: number;
  lastLogDate: string | null;
}

export interface LibraryData {
  mode: DataMode;
  books: LibraryBook[];
  counts: Record<BookStatus, number>;
}

export interface DetailQuote extends QuoteRow {
  tags: string[];
}

export interface BookDetailData {
  mode: DataMode;
  book: BookRow;
  percent: number;
  logs: ReadingLogRow[];
  quotes: DetailQuote[];
  totals: {
    pagesRead: number;
    sessions: number;
    minutes: number;
    firstDate: string | null;
    lastDate: string | null;
  };
}

function summarise(books: BookRow[], logs: ReadingLogRow[]): LibraryBook[] {
  const byBook = new Map<string, { sessions: number; last: string | null }>();
  for (const log of logs) {
    const entry = byBook.get(log.book_id) ?? { sessions: 0, last: null };
    entry.sessions += 1;
    if (!entry.last || log.log_date > entry.last) entry.last = log.log_date;
    byBook.set(log.book_id, entry);
  }

  return books.map((book) => {
    const stats = byBook.get(book.id);
    return {
      ...book,
      percent: progressPercent(book.current_page, book.total_pages),
      sessions: stats?.sessions ?? 0,
      lastLogDate: stats?.last ?? null,
    };
  });
}

function countByStatus(books: BookRow[]): Record<BookStatus, number> {
  const counts: Record<BookStatus, number> = {
    READING: 0,
    WANT_TO_READ: 0,
    FINISHED: 0,
    DNF: 0,
  };
  for (const book of books) counts[book.status] += 1;
  return counts;
}

export async function getLibraryData(): Promise<LibraryData> {
  if (!isSupabaseConfigured) {
    const db = await readDb();
    const books = db.books.filter((book) => book.user_id === DEMO_USER_ID);
    const ids = new Set(books.map((book) => book.id));
    const logs = db.reading_logs.filter((log) => ids.has(log.book_id));

    return {
      mode: "demo",
      books: summarise(books, logs).sort((a, b) =>
        b.created_at.localeCompare(a.created_at),
      ),
      counts: countByStatus(books),
    };
  }

  const user = await getSessionUser();
  if (!user) throw new Error("Sesi tidak ditemukan. Silakan masuk lagi.");

  const supabase = await createClient();

  const [booksRes, logsRes] = await Promise.all([
    supabase.from("books").select("*").order("created_at", { ascending: false }),
    supabase.from("reading_logs").select("*"),
  ]);

  const firstError = booksRes.error ?? logsRes.error;
  if (firstError) throw new Error(firstError.message);

  const books = (booksRes.data ?? []) as BookRow[];
  const logs = (logsRes.data ?? []) as ReadingLogRow[];

  return {
    mode: "supabase",
    books: summarise(books, logs),
    counts: countByStatus(books),
  };
}

async function loadBookDetailData(id: string): Promise<BookDetailData> {
  if (!isSupabaseConfigured) {
    const db = await readDb();
    const book = db.books.find(
      (row) => row.id === id && row.user_id === DEMO_USER_ID,
    );
    if (!book) notFound();

    const logs = db.reading_logs
      .filter((log) => log.book_id === book.id)
      .sort((a, b) => b.log_date.localeCompare(a.log_date));

    const tagsById = new Map(db.tags.map((tag) => [tag.id, tag.name]));
    const quotes = db.quotes
      .filter((quote) => quote.book_id === book.id)
      .map((quote) => ({
        ...quote,
        tags: db.quote_tags
          .filter((link) => link.quote_id === quote.id)
          .map((link) => tagsById.get(link.tag_id))
          .filter((name): name is string => Boolean(name)),
      }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    return {
      mode: "demo",
      book,
      percent: progressPercent(book.current_page, book.total_pages),
      logs,
      quotes,
      totals: totalsFor(logs),
    };
  }

  const user = await getSessionUser();
  if (!user) throw new Error("Sesi tidak ditemukan. Silakan masuk lagi.");

  const supabase = await createClient();

  const [bookRes, logsRes, quotesRes] = await Promise.all([
    supabase.from("books").select("*").eq("id", id).maybeSingle<BookRow>(),
    supabase
      .from("reading_logs")
      .select("*")
      .eq("book_id", id)
      .order("log_date", { ascending: false }),
    supabase
      .from("quotes")
      .select("*, quote_tags(tags(name))")
      .eq("book_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const firstError = bookRes.error ?? logsRes.error ?? quotesRes.error;
  if (firstError) throw new Error(firstError.message);

  const book = bookRes.data;
  if (!book) notFound();

  const logs = (logsRes.data ?? []) as ReadingLogRow[];

  type Joined = QuoteRow & {
    quote_tags: Array<{ tags: { name: string } | null }> | null;
  };

  const quotes: DetailQuote[] = ((quotesRes.data ?? []) as Joined[]).map(
    ({ quote_tags: links, ...quote }) => ({
      ...quote,
      tags: (links ?? [])
        .map((link) => link.tags?.name)
        .filter((name): name is string => Boolean(name)),
    }),
  );

  return {
    mode: "supabase",
    book,
    percent: progressPercent(book.current_page, book.total_pages),
    logs,
    quotes,
    totals: totalsFor(logs),
  };
}

function totalsFor(logs: ReadingLogRow[]) {
  const dates = logs.map((log) => log.log_date).sort();
  return {
    pagesRead: logs.reduce((sum, log) => sum + log.pages_read, 0),
    sessions: logs.length,
    minutes: logs.reduce((sum, log) => sum + (log.duration_minutes ?? 0), 0),
    firstDate: dates[0] ?? null,
    lastDate: dates[dates.length - 1] ?? null,
  };
}

/** Cached per request so metadata and the page share a single query. */
export const getBookDetailData = cache(loadBookDetailData);

export { STATUS_ORDER };

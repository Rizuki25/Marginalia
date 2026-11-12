import { addDays, lastNDates, startOfWeek, todayISO } from "@/lib/date";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/supabase/session";
import { readDb } from "@/lib/demo/store";
import { DEMO_USER_ID } from "@/lib/demo/seed";
import type {
  BookRow,
  QuoteRow,
  ReadingGoalRow,
  ReadingLogRow,
} from "@/lib/types";

export type DataMode = "supabase" | "demo";

export interface DashboardQuote extends QuoteRow {
  bookTitle: string;
  bookAuthor: string;
}

export interface ActivityDay {
  date: string;
  pages: number;
}

export interface DashboardStats {
  streak: number;
  pagesToday: number;
  pagesWeek: number;
  finishedThisYear: number;
  targetBooks: number;
  targetPagesPerDay: number;
  pagesInWindow: number;
}

export interface DashboardData {
  mode: DataMode;
  readerName: string;
  readerEmail: string;
  spotlight: BookRow | null;
  readingBooks: BookRow[];
  allBooks: BookRow[];
  stats: DashboardStats;
  activity: ActivityDay[];
  quotes: DashboardQuote[];
  goal: ReadingGoalRow | null;
}

const ACTIVITY_DAYS = 14;

function streakFrom(dates: Set<string>, today: string): number {
  let cursor = dates.has(today) ? today : addDays(today, -1);
  if (!dates.has(cursor)) return 0;

  let streak = 0;
  while (dates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function computeActivity(logs: ReadingLogRow[]): ActivityDay[] {
  const totals = new Map<string, number>();
  for (const log of logs) {
    totals.set(log.log_date, (totals.get(log.log_date) ?? 0) + log.pages_read);
  }
  return lastNDates(ACTIVITY_DAYS).map((date) => ({
    date,
    pages: totals.get(date) ?? 0,
  }));
}

function computeStats(
  books: BookRow[],
  logs: ReadingLogRow[],
  goal: ReadingGoalRow | null,
  today: string,
): DashboardStats {
  const dates = new Set(logs.map((log) => log.log_date));
  const weekStart = startOfWeek(today);
  const year = today.slice(0, 4);
  const window = new Set(lastNDates(ACTIVITY_DAYS, today));

  let pagesToday = 0;
  let pagesWeek = 0;
  let pagesInWindow = 0;
  for (const log of logs) {
    if (log.log_date === today) pagesToday += log.pages_read;
    if (log.log_date >= weekStart) pagesWeek += log.pages_read;
    if (window.has(log.log_date)) pagesInWindow += log.pages_read;
  }

  const finishedThisYear = books.filter(
    (book) => book.status === "FINISHED" && book.finished_at?.startsWith(year),
  ).length;

  return {
    streak: streakFrom(dates, today),
    pagesToday,
    pagesWeek,
    finishedThisYear,
    targetBooks: goal?.target_books ?? 0,
    targetPagesPerDay: goal?.target_pages_per_day ?? 0,
    pagesInWindow,
  };
}

function pickSpotlight(books: BookRow[], logs: ReadingLogRow[]): BookRow | null {
  const reading = books.filter((book) => book.status === "READING");
  if (reading.length === 0) return null;

  const latestByBook = new Map<string, string>();
  for (const log of logs) {
    const current = latestByBook.get(log.book_id);
    if (!current || log.log_date > current) latestByBook.set(log.book_id, log.log_date);
  }

  return [...reading].sort((a, b) => {
    const aDate = latestByBook.get(a.id) ?? a.started_at ?? "";
    const bDate = latestByBook.get(b.id) ?? b.started_at ?? "";
    return bDate.localeCompare(aDate);
  })[0];
}

export async function getDashboardData(): Promise<DashboardData> {
  const today = todayISO();

  if (!isSupabaseConfigured) {
    const db = await readDb();
    const user = db.users.find((row) => row.id === DEMO_USER_ID) ?? db.users[0];
    const goal =
      db.reading_goals.find((row) => row.year === Number(today.slice(0, 4))) ?? null;
    const quotes = db.quotes.map((quote) => {
      const book = db.books.find((row) => row.id === quote.book_id);
      return {
        ...quote,
        bookTitle: book?.title ?? "Tanpa judul",
        bookAuthor: book?.author ?? "",
      };
    });

    return {
      mode: "demo",
      readerName: user?.name ?? "Pembaca",
      readerEmail: user?.email ?? "pembaca@marginalia.app",
      spotlight: pickSpotlight(db.books, db.reading_logs),
      readingBooks: db.books.filter((book) => book.status === "READING"),
      allBooks: db.books,
      stats: computeStats(db.books, db.reading_logs, goal, today),
      activity: computeActivity(db.reading_logs),
      quotes,
      goal,
    };
  }

  const user = await getSessionUser();
  if (!user) throw new Error("Sesi tidak ditemukan. Silakan masuk lagi.");

  const supabase = await createClient();

  const [booksRes, logsRes, quotesRes, goalRes] = await Promise.all([
    supabase.from("books").select("*").order("created_at", { ascending: false }),
    supabase
      .from("reading_logs")
      .select("*")
      .order("log_date", { ascending: false })
      .limit(600),
    supabase
      .from("quotes")
      .select("*, books(title, author)")
      .order("created_at", { ascending: false }),
    supabase
      .from("reading_goals")
      .select("*")
      .eq("year", Number(today.slice(0, 4)))
      .maybeSingle(),
  ]);

  const firstError =
    booksRes.error ?? logsRes.error ?? quotesRes.error ?? goalRes.error;
  if (firstError) throw new Error(firstError.message);

  const books = (booksRes.data ?? []) as BookRow[];
  const logs = (logsRes.data ?? []) as ReadingLogRow[];
  const goal = (goalRes.data ?? null) as ReadingGoalRow | null;

  const quotes = ((quotesRes.data ?? []) as Array<
    QuoteRow & { books: { title: string; author: string } | null }
  >).map(({ books: book, ...quote }) => ({
    ...quote,
    bookTitle: book?.title ?? "Tanpa judul",
    bookAuthor: book?.author ?? "",
  }));

  return {
    mode: "supabase",
    readerName: user.name,
    readerEmail: user.email,
    spotlight: pickSpotlight(books, logs),
    readingBooks: books.filter((book) => book.status === "READING"),
    allBooks: books,
    stats: computeStats(books, logs, goal, today),
    activity: computeActivity(logs),
    quotes,
    goal,
  };
}

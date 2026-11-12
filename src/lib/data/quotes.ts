import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/supabase/session";
import { readDb } from "@/lib/demo/store";
import { DEMO_USER_ID } from "@/lib/demo/seed";
import type { BookRow, QuoteRow } from "@/lib/types";

export interface VaultQuote extends QuoteRow {
  bookTitle: string;
  bookAuthor: string;
  bookCover: string | null;
  tags: string[];
}

export interface VaultBook {
  id: string;
  title: string;
  author: string;
  current_page: number;
  total_pages: number;
}

export interface VaultTag {
  name: string;
  count: number;
}

export interface QuotesData {
  mode: "supabase" | "demo";
  quotes: VaultQuote[];
  books: VaultBook[];
  /** Only books that actually hold at least one quote, so no filter is dead. */
  filterBooks: VaultBook[];
  /** Only tags that actually label a quote, each with how many it holds. */
  filterTags: VaultTag[];
  favoriteCount: number;
}

function tagsWithCounts(quotes: VaultQuote[]): VaultTag[] {
  const counts = new Map<string, number>();
  for (const quote of quotes) {
    for (const tag of quote.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export async function getQuotesData(): Promise<QuotesData> {
  if (!isSupabaseConfigured) {
    const db = await readDb();
    const booksById = new Map(db.books.map((book) => [book.id, book]));
    const tagsById = new Map(db.tags.map((tag) => [tag.id, tag.name]));

    const quotes: VaultQuote[] = db.quotes
      .filter((quote) => {
        const book = booksById.get(quote.book_id);
        return book?.user_id === DEMO_USER_ID;
      })
      .map((quote) => {
        const book = booksById.get(quote.book_id);
        const tags = db.quote_tags
          .filter((link) => link.quote_id === quote.id)
          .map((link) => tagsById.get(link.tag_id))
          .filter((name): name is string => Boolean(name));

        return {
          ...quote,
          bookTitle: book?.title ?? "Tanpa judul",
          bookAuthor: book?.author ?? "",
          bookCover: book?.cover_url ?? null,
          tags,
        };
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    const books: VaultBook[] = db.books
      .filter((book) => book.user_id === DEMO_USER_ID)
      .map((book) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        current_page: book.current_page,
        total_pages: book.total_pages,
      }));

    const usedIds = new Set(quotes.map((quote) => quote.book_id));

    return {
      mode: "demo",
      quotes,
      books,
      filterBooks: books.filter((book) => usedIds.has(book.id)),
      filterTags: tagsWithCounts(quotes),
      favoriteCount: quotes.filter((quote) => quote.is_favorite).length,
    };
  }

  const user = await getSessionUser();
  if (!user) throw new Error("Sesi tidak ditemukan. Silakan masuk lagi.");

  const supabase = await createClient();

  const [quotesRes, booksRes] = await Promise.all([
    supabase
      .from("quotes")
      .select("*, books(title, author, cover_url), quote_tags(tags(name))")
      .order("created_at", { ascending: false }),
    supabase
      .from("books")
      .select("id, title, author, current_page, total_pages")
      .order("title"),
  ]);

  const firstError = quotesRes.error ?? booksRes.error;
  if (firstError) throw new Error(firstError.message);

  type Joined = QuoteRow & {
    books: { title: string; author: string; cover_url: string | null } | null;
    quote_tags: Array<{ tags: { name: string } | null }> | null;
  };

  const quotes: VaultQuote[] = ((quotesRes.data ?? []) as Joined[]).map(
    ({ books: book, quote_tags: links, ...quote }) => ({
      ...quote,
      bookTitle: book?.title ?? "Tanpa judul",
      bookAuthor: book?.author ?? "",
      bookCover: book?.cover_url ?? null,
      tags: (links ?? [])
        .map((link) => link.tags?.name)
        .filter((name): name is string => Boolean(name)),
    }),
  );

  const books = ((booksRes.data ?? []) as Array<
    Pick<BookRow, "id" | "title" | "author" | "current_page" | "total_pages">
  >).map((book) => ({
    id: book.id,
    title: book.title,
    author: book.author,
    current_page: book.current_page,
    total_pages: book.total_pages,
  }));

  const usedIds = new Set(quotes.map((quote) => quote.book_id));

  return {
    mode: "supabase",
    quotes,
    books,
    filterBooks: books.filter((book) => usedIds.has(book.id)),
    filterTags: tagsWithCounts(quotes),
    favoriteCount: quotes.filter((quote) => quote.is_favorite).length,
  };
}

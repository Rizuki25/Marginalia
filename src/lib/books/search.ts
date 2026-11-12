/**
 * Book metadata lookup for the "add book" dialog.
 *
 * Two free providers, no key required for either. Google Books is asked first
 * because it carries page counts more consistently; Open Library is the
 * fallback so the feature keeps working when the Google daily quota is spent,
 * which is what a key-less project gets on a shared IP.
 */

const GOOGLE_ENDPOINT = "https://www.googleapis.com/books/v1/volumes";
const OPENLIBRARY_ENDPOINT = "https://openlibrary.org/search.json";
const MAX_RESULTS = 8;
const TIMEOUT_MS = 8000;

export type BookSource = "google" | "openlibrary";
export type ProviderState = "ok" | "quota" | "error";

export interface BookCandidate {
  /** Provider-scoped id, stable enough for a React key. */
  key: string;
  title: string;
  authors: string[];
  pageCount: number | null;
  categories: string[];
  coverUrl: string | null;
  publishedYear: number | null;
  source: BookSource;
}

export interface BookSearchResult {
  items: BookCandidate[];
  /** Provider the items came from, `null` when nothing was asked. */
  source: BookSource | null;
  /** Human sentence about a degraded lookup. Empty when everything worked. */
  notice: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }
  return null;
}

function toYear(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === "string") {
    const match = value.trim().match(/^(\d{4})/);
    if (match) return Number(match[1]);
  }
  return null;
}

function strings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item !== "");
}

/** Google covers arrive over http with a curled edge; both are unwanted. */
function normaliseGoogleCover(value: unknown): string | null {
  if (typeof value !== "string" || value === "") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") url.protocol = "https:";
    url.searchParams.delete("edge");
    return url.toString();
  } catch {
    return null;
  }
}

export function parseGoogleVolumes(payload: unknown): BookCandidate[] {
  if (!isRecord(payload) || !Array.isArray(payload.items)) return [];

  const out: BookCandidate[] = [];
  for (const item of payload.items) {
    if (!isRecord(item) || !isRecord(item.volumeInfo)) continue;
    const info = item.volumeInfo;
    const title = typeof info.title === "string" ? info.title.trim() : "";
    if (title === "") continue;

    const links = isRecord(info.imageLinks) ? info.imageLinks : {};
    const key = typeof item.id === "string" ? item.id : `google-${out.length}`;

    out.push({
      key,
      title,
      authors: strings(info.authors),
      pageCount: toInt(info.pageCount),
      categories: strings(info.categories),
      coverUrl: normaliseGoogleCover(links.thumbnail ?? links.smallThumbnail),
      publishedYear: toYear(info.publishedDate),
      source: "google",
    });
  }
  return out.slice(0, MAX_RESULTS);
}

export function parseOpenLibraryDocs(payload: unknown): BookCandidate[] {
  if (!isRecord(payload) || !Array.isArray(payload.docs)) return [];

  const out: BookCandidate[] = [];
  for (const doc of payload.docs) {
    if (!isRecord(doc)) continue;
    const title = typeof doc.title === "string" ? doc.title.trim() : "";
    if (title === "") continue;

    const coverId = toInt(doc.cover_i);
    const key = typeof doc.key === "string" ? doc.key : `ol-${out.length}`;

    out.push({
      key,
      title,
      authors: strings(doc.author_name),
      // `number_of_pages_median` is the only page count the search API gives.
      pageCount: toInt(doc.number_of_pages_median),
      categories: strings(doc.subject).slice(0, 3),
      coverUrl: coverId
        ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
        : null,
      publishedYear: toYear(doc.first_publish_year),
      source: "openlibrary",
    });
  }
  return out.slice(0, MAX_RESULTS);
}

interface ProviderAnswer {
  items: BookCandidate[];
  state: ProviderState;
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { accept: "application/json" },
    // Metadata for one title never changes minute to minute, and both
    // providers are rate limited: reuse the answer for ten minutes.
    next: { revalidate: 600 },
  });

  if (response.status === 429) {
    throw Object.assign(new Error("quota"), { quota: true });
  }
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  return response.json();
}

async function searchGoogle(query: string): Promise<ProviderAnswer> {
  const params = new URLSearchParams({
    q: query,
    maxResults: String(MAX_RESULTS),
    printType: "books",
  });
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY?.trim();
  if (apiKey) params.set("key", apiKey);

  try {
    const payload = await fetchJson(`${GOOGLE_ENDPOINT}?${params.toString()}`);
    return { items: parseGoogleVolumes(payload), state: "ok" };
  } catch (error) {
    const quota = isRecord(error) && error.quota === true;
    return { items: [], state: quota ? "quota" : "error" };
  }
}

async function searchOpenLibrary(query: string): Promise<ProviderAnswer> {
  const params = new URLSearchParams({
    q: query,
    limit: String(MAX_RESULTS),
    fields:
      "key,title,author_name,first_publish_year,number_of_pages_median,cover_i,subject",
  });

  try {
    const payload = await fetchJson(`${OPENLIBRARY_ENDPOINT}?${params.toString()}`);
    return { items: parseOpenLibraryDocs(payload), state: "ok" };
  } catch {
    return { items: [], state: "error" };
  }
}

export const EMPTY_RESULT: BookSearchResult = {
  items: [],
  source: null,
  notice: null,
};

/**
 * Asks Google first. Falls through to Open Library when Google is rate limited,
 * unreachable, or returns nothing, so a query that Google cannot answer still
 * gets a usable result.
 */
export async function searchBooks(query: string): Promise<BookSearchResult> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return EMPTY_RESULT;

  const google = await searchGoogle(trimmed);
  if (google.items.length > 0) {
    return {
      items: google.items,
      source: "google",
      notice:
        google.state === "ok"
          ? null
          : "Google Books sedang dibatasi, hasil ini dari Open Library.",
    };
  }

  const openLibrary = await searchOpenLibrary(trimmed);

  if (openLibrary.items.length > 0) {
    return {
      items: openLibrary.items,
      source: "openlibrary",
      notice:
        google.state === "quota"
          ? "Kuota harian Google Books habis. Hasil dari Open Library, total halaman tidak selalu tersedia."
          : google.state === "error"
            ? "Google Books tidak menjawab. Hasil dari Open Library."
            : null,
    };
  }

  // An empty answer from a provider that answered is a real answer: the book is
  // simply not in the catalogue. Only claim an outage when both providers failed.
  if (openLibrary.state === "ok" || google.state === "ok") {
    return { items: [], source: null, notice: null };
  }

  return {
    items: [],
    source: null,
    notice:
      "Pencarian buku sedang tidak bisa menghubungi Google Books maupun Open Library. Isi datanya manual saja.",
  };
}

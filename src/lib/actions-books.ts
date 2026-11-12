"use server";

import { promises as fs } from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { todayISO, validateLogDate } from "@/lib/date";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/supabase/session";
import { coversDir, mutate } from "@/lib/demo/store";
import { DEMO_USER_ID } from "@/lib/demo/seed";
import { setFlashToast } from "@/lib/flash";
import { isBookStatus, STATUS_LABEL } from "@/lib/status";
import type { FormState } from "@/lib/form-state";
import { recomputeProgress } from "@/lib/books/progress";
import type { BookRow, BookStatus, ReadingLogRow } from "@/lib/types";

const COVER_BUCKET = "book-covers";
const MAX_COVER_BYTES = 3 * 1024 * 1024;
const ALLOWED_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

function fail(message: string): FormState {
  return { status: "error", message };
}

function done(message: string): FormState {
  return { status: "success", message };
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Dates that follow the status change, per PRD section 3.2. */
function datesForStatus(
  book: BookRow,
  status: BookStatus,
  today: string,
): Pick<BookRow, "started_at" | "finished_at" | "current_page"> {
  switch (status) {
    case "READING":
      return {
        started_at: book.started_at ?? today,
        finished_at: null,
        current_page: book.current_page,
      };
    case "FINISHED":
      return {
        started_at: book.started_at ?? today,
        finished_at: book.finished_at ?? today,
        current_page: book.total_pages,
      };
    case "WANT_TO_READ":
      return {
        started_at: null,
        finished_at: null,
        current_page: book.current_page,
      };
    case "DNF":
      return {
        started_at: book.started_at ?? today,
        finished_at: null,
        current_page: book.current_page,
      };
  }
}

export async function updateBookStatusAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const bookId = text(formData, "bookId");
  const status = text(formData, "status");
  const today = todayISO();

  if (!bookId) return fail("Buku tidak dikenal.");
  if (!isBookStatus(status)) return fail("Status buku tidak dikenal.");

  if (!isSupabaseConfigured) {
    return mutate((db) => {
      const book = db.books.find(
        (row) => row.id === bookId && row.user_id === DEMO_USER_ID,
      );
      if (!book) return fail("Buku tidak ditemukan.");

      Object.assign(book, datesForStatus(book, status, today));
      book.status = status;

      revalidatePath("/");
      revalidatePath("/logs");
      revalidatePath("/books");
      revalidatePath(`/books/${book.id}`);
      return done(`Status diubah ke ${STATUS_LABEL[status]}.`);
    });
  }

  const user = await getSessionUser();
  if (!user) return fail("Sesi berakhir. Masuk lagi untuk melanjutkan.");

  const supabase = await createClient();

  const { data: book } = await supabase
    .from("books")
    .select("*")
    .eq("id", bookId)
    .maybeSingle<BookRow>();

  if (!book) return fail("Buku tidak ditemukan.");

  const { error } = await supabase
    .from("books")
    .update({ status, ...datesForStatus(book, status, today) })
    .eq("id", bookId);

  if (error) return fail(error.message);

  revalidatePath("/");
  revalidatePath("/logs");
  revalidatePath("/books");
  revalidatePath(`/books/${bookId}`);
  return done(`Status diubah ke ${STATUS_LABEL[status]}.`);
}

export async function saveBookReviewAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const bookId = text(formData, "bookId");
  const ratingRaw = text(formData, "rating");
  const review = text(formData, "review");

  if (!bookId) return fail("Buku tidak dikenal.");
  if (review.length > 2000) return fail("Ulasan maksimal 2000 karakter.");

  const rating = ratingRaw === "" ? null : Number(ratingRaw);
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5))
    return fail("Rating harus 1 sampai 5 bintang.");

  if (!isSupabaseConfigured) {
    return mutate((db) => {
      const book = db.books.find(
        (row) => row.id === bookId && row.user_id === DEMO_USER_ID,
      );
      if (!book) return fail("Buku tidak ditemukan.");

      book.rating = rating;
      book.review = review || null;

      revalidatePath("/books");
      revalidatePath(`/books/${book.id}`);
      return done("Rating dan ulasan tersimpan.");
    });
  }

  const user = await getSessionUser();
  if (!user) return fail("Sesi berakhir. Masuk lagi untuk melanjutkan.");

  const supabase = await createClient();

  const { error } = await supabase
    .from("books")
    .update({ rating, review: review || null })
    .eq("id", bookId);

  if (error) return fail(error.message);

  revalidatePath("/books");
  revalidatePath(`/books/${bookId}`);
  return done("Rating dan ulasan tersimpan.");
}

export async function updateCoverAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const bookId = text(formData, "bookId");
  const coverUrl = text(formData, "coverUrl");
  const file = formData.get("coverFile");

  if (!bookId) return fail("Buku tidak dikenal.");

  const hasFile = file instanceof File && file.size > 0;

  if (!hasFile && coverUrl === "") {
    return fail("Pilih file gambar atau isi URL sampul.");
  }

  if (hasFile) {
    const upload = file as File;
    if (upload.size > MAX_COVER_BYTES)
      return fail("Ukuran gambar maksimal 3 MB.");
    if (!ALLOWED_TYPES.has(upload.type))
      return fail("Format gambar harus JPG, PNG, atau WebP.");
  }

  if (coverUrl !== "" && !/^https?:\/\//i.test(coverUrl))
    return fail("URL sampul harus diawali http:// atau https://");

  if (!isSupabaseConfigured) {
    const saved = hasFile
      ? await saveDemoCover(bookId, file as File)
      : { url: coverUrl };
    if ("message" in saved) return saved;

    return mutate((db) => {
      const book = db.books.find(
        (row) => row.id === bookId && row.user_id === DEMO_USER_ID,
      );
      if (!book) return fail("Buku tidak ditemukan.");

      book.cover_url = saved.url;
      revalidatePath("/");
      revalidatePath("/logs");
      revalidatePath("/books");
      revalidatePath(`/books/${book.id}`);
      return done("Sampul diperbarui.");
    });
  }

  const user = await getSessionUser();
  if (!user) return fail("Sesi berakhir. Masuk lagi untuk melanjutkan.");

  const supabase = await createClient();

  let nextUrl = coverUrl;

  if (hasFile) {
    const upload = file as File;
    const ext = ALLOWED_TYPES.get(upload.type) ?? "jpg";
    const objectPath = `${user.id}/${bookId}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(COVER_BUCKET)
      .upload(objectPath, upload, {
        cacheControl: "3600",
        upsert: true,
        contentType: upload.type,
      });

    if (uploadError) return fail(uploadError.message);

    const { data: publicUrl } = supabase.storage
      .from(COVER_BUCKET)
      .getPublicUrl(objectPath);

    nextUrl = publicUrl.publicUrl;
  }

  const { error } = await supabase
    .from("books")
    .update({ cover_url: nextUrl })
    .eq("id", bookId);

  if (error) return fail(error.message);

  revalidatePath("/");
  revalidatePath("/logs");
  revalidatePath("/books");
  revalidatePath(`/books/${bookId}`);
  return done("Sampul diperbarui.");
}

async function saveDemoCover(
  bookId: string,
  file: File,
): Promise<{ url: string } | FormState> {
  const ext = ALLOWED_TYPES.get(file.type);
  if (!ext) return fail("Format gambar harus JPG, PNG, atau WebP.");

  const name = `${bookId}-${Date.now()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  await fs.mkdir(coversDir, { recursive: true });
  await fs.writeFile(path.join(coversDir, name), bytes);

  return { url: `/api/demo-covers/${name}` };
}

// ---------------------------------------------------------------------------
// Editing and deleting existing rows. These exist because a reading log is the
// source of truth for `current_page`: a typo used to be permanent, and the only
// recovery was to log an even higher page.
// ---------------------------------------------------------------------------

export async function updateBookAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const bookId = text(formData, "bookId");
  const title = text(formData, "title");
  const author = text(formData, "author");
  const category = text(formData, "category");
  const totalPages = Number(text(formData, "totalPages"));

  if (!bookId) return fail("Buku tidak dikenal.");
  if (title.length < 1) return fail("Judul buku wajib diisi.");
  if (author.length < 1) return fail("Nama penulis wajib diisi.");
  if (!Number.isInteger(totalPages) || totalPages < 1)
    return fail("Total halaman harus angka lebih dari 0.");

  if (!isSupabaseConfigured) {
    return mutate((db) => {
      const book = db.books.find(
        (row) => row.id === bookId && row.user_id === DEMO_USER_ID,
      );
      if (!book) return fail("Buku tidak ditemukan.");
      if (totalPages < book.current_page)
        return fail(
          `Total halaman tidak boleh di bawah posisi sekarang (${book.current_page}).`,
        );

      book.title = title;
      book.author = author;
      book.category = category || null;
      book.total_pages = totalPages;

      revalidatePath("/");
      revalidatePath("/logs");
      revalidatePath("/books");
      revalidatePath(`/books/${book.id}`);
      return done("Data buku diperbarui.");
    });
  }

  const user = await getSessionUser();
  if (!user) return fail("Sesi berakhir. Masuk lagi untuk melanjutkan.");

  const supabase = await createClient();
  const { data: book } = await supabase
    .from("books")
    .select("current_page")
    .eq("id", bookId)
    .maybeSingle<{ current_page: number }>();

  if (!book) return fail("Buku tidak ditemukan.");
  if (totalPages < book.current_page)
    return fail(
      `Total halaman tidak boleh di bawah posisi sekarang (${book.current_page}).`,
    );

  const { error } = await supabase
    .from("books")
    .update({
      title,
      author,
      category: category || null,
      total_pages: totalPages,
    })
    .eq("id", bookId);

  if (error) return fail(error.message);

  revalidatePath("/");
  revalidatePath("/logs");
  revalidatePath("/books");
  revalidatePath(`/books/${bookId}`);
  return done("Data buku diperbarui.");
}

export async function deleteBookAction(formData: FormData): Promise<void> {
  const bookId = text(formData, "bookId");
  if (!bookId) return;

  if (!isSupabaseConfigured) {
    await mutate((db) => {
      const book = db.books.find(
        (row) => row.id === bookId && row.user_id === DEMO_USER_ID,
      );
      if (!book) return;

      const quoteIds = new Set(
        db.quotes.filter((quote) => quote.book_id === book.id).map((q) => q.id),
      );

      db.books = db.books.filter((row) => row.id !== book.id);
      db.reading_logs = db.reading_logs.filter(
        (log) => log.book_id !== book.id,
      );
      db.quotes = db.quotes.filter((quote) => quote.book_id !== book.id);
      db.quote_tags = db.quote_tags.filter(
        (link) => !quoteIds.has(link.quote_id),
      );
    });
  } else {
    const user = await getSessionUser();
    if (!user) return;

    const supabase = await createClient();
    // reading_logs, quotes and quote_tags cascade from the book row.
    const { error } = await supabase.from("books").delete().eq("id", bookId);
    if (error) return;
  }

  revalidatePath("/");
  revalidatePath("/logs");
  revalidatePath("/books");
  await setFlashToast({
    kind: "deleted",
    title: "Berhasil dihapus",
    message: "Buku dan seluruh catatannya dihapus.",
  });
  redirect("/books");
}

export async function updateReadingLogAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const logId = text(formData, "logId");
  const logDate = text(formData, "logDate");
  const clientToday = text(formData, "clientToday");
  const endPage = Number(text(formData, "endPage"));
  const durationRaw = text(formData, "durationMinutes");
  const dailyNote = text(formData, "dailyNote");
  const duration = durationRaw === "" ? null : Number(durationRaw);

  if (!logId) return fail("Catatan tidak dikenal.");
  const dateError = validateLogDate(logDate, clientToday);
  if (dateError) return fail(dateError);
  if (!Number.isInteger(endPage) || endPage < 1)
    return fail("Halaman akhir harus angka lebih dari 0.");
  if (duration !== null && (!Number.isInteger(duration) || duration < 0 || duration > 1440))
    return fail("Durasi membaca harus antara 0 dan 1440 menit.");

  if (!isSupabaseConfigured) {
    return mutate((db) => {
      const log = db.reading_logs.find((row) => row.id === logId);
      if (!log) return fail("Catatan tidak ditemukan.");

      const book = db.books.find(
        (row) => row.id === log.book_id && row.user_id === DEMO_USER_ID,
      );
      if (!book) return fail("Buku tidak ditemukan.");
      if (endPage > book.total_pages)
        return fail(`Halaman melebihi total buku (${book.total_pages}).`);
      if (endPage < log.start_page)
        return fail(
          `Halaman akhir tidak boleh di bawah halaman awal (${log.start_page}).`,
        );

      log.log_date = logDate;
      log.end_page = endPage;
      log.pages_read = endPage - log.start_page;
      log.duration_minutes = duration;
      log.daily_note = dailyNote || null;

      const remaining = db.reading_logs.filter(
        (row) => row.book_id === book.id,
      );
      Object.assign(book, recomputeProgress(book, remaining));

      revalidatePath("/");
      revalidatePath("/logs");
      revalidatePath("/books");
      revalidatePath(`/books/${book.id}`);
      return done("Catatan diperbarui, posisi halaman dihitung ulang.");
    });
  }

  const user = await getSessionUser();
  if (!user) return fail("Sesi berakhir. Masuk lagi untuk melanjutkan.");

  const supabase = await createClient();
  const { data: log } = await supabase
    .from("reading_logs")
    .select("*")
    .eq("id", logId)
    .maybeSingle<ReadingLogRow>();

  if (!log) return fail("Catatan tidak ditemukan.");

  const { data: book } = await supabase
    .from("books")
    .select("*")
    .eq("id", log.book_id)
    .maybeSingle<BookRow>();

  if (!book) return fail("Buku tidak ditemukan.");
  if (endPage > book.total_pages)
    return fail(`Halaman melebihi total buku (${book.total_pages}).`);
  if (endPage < log.start_page)
    return fail(
      `Halaman akhir tidak boleh di bawah halaman awal (${log.start_page}).`,
    );

  const { error: updateError } = await supabase
    .from("reading_logs")
    .update({
      log_date: logDate,
      end_page: endPage,
      pages_read: endPage - log.start_page,
      duration_minutes: duration,
      daily_note: dailyNote || null,
    })
    .eq("id", logId);

  if (updateError) return fail(updateError.message);

  const { data: remaining, error: readError } = await supabase
    .from("reading_logs")
    .select("*")
    .eq("book_id", book.id);

  if (readError) return fail(readError.message);

  const { error: bookError } = await supabase
    .from("books")
    .update(recomputeProgress(book, (remaining ?? []) as ReadingLogRow[]))
    .eq("id", book.id);

  if (bookError) return fail(bookError.message);

  revalidatePath("/");
  revalidatePath("/logs");
  revalidatePath("/books");
  revalidatePath(`/books/${book.id}`);
  return done("Catatan diperbarui, posisi halaman dihitung ulang.");
}

export async function deleteReadingLogAction(formData: FormData): Promise<void> {
  const logId = text(formData, "logId");
  if (!logId) return;

  if (!isSupabaseConfigured) {
    await mutate((db) => {
      const log = db.reading_logs.find((row) => row.id === logId);
      if (!log) return;

      const book = db.books.find(
        (row) => row.id === log.book_id && row.user_id === DEMO_USER_ID,
      );
      if (!book) return;

      db.reading_logs = db.reading_logs.filter((row) => row.id !== logId);

      const remaining = db.reading_logs.filter(
        (row) => row.book_id === book.id,
      );
      Object.assign(book, recomputeProgress(book, remaining));

      revalidatePath("/");
      revalidatePath("/logs");
      revalidatePath("/books");
      revalidatePath(`/books/${book.id}`);
    });
    return;
  }

  const user = await getSessionUser();
  if (!user) return;

  const supabase = await createClient();
  const { data: log } = await supabase
    .from("reading_logs")
    .select("id, book_id")
    .eq("id", logId)
    .maybeSingle<{ id: string; book_id: string }>();

  if (!log) return;

  const { error: deleteError } = await supabase
    .from("reading_logs")
    .delete()
    .eq("id", logId);

  if (deleteError) return;

  const { data: book } = await supabase
    .from("books")
    .select("*")
    .eq("id", log.book_id)
    .maybeSingle<BookRow>();

  if (!book) return;

  const { data: remaining } = await supabase
    .from("reading_logs")
    .select("*")
    .eq("book_id", book.id);

  await supabase
    .from("books")
    .update(recomputeProgress(book, (remaining ?? []) as ReadingLogRow[]))
    .eq("id", book.id);

  revalidatePath("/");
  revalidatePath("/logs");
  revalidatePath("/books");
  revalidatePath(`/books/${book.id}`);
}

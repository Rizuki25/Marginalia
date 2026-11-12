"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { todayISO } from "@/lib/date";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/supabase/session";
import { mutate } from "@/lib/demo/store";
import { DEMO_USER_ID } from "@/lib/demo/seed";
import type { FormState } from "@/lib/form-state";
import type { BookRow, BookStatus } from "@/lib/types";

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

function int(formData: FormData, key: string): number | null {
  const raw = text(formData, key);
  if (raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.trunc(value) : null;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function saveReadingLogAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const bookId = text(formData, "bookId");
  const logDate = text(formData, "logDate");
  const endPage = int(formData, "endPage");
  const duration = int(formData, "durationMinutes");
  const dailyNote = text(formData, "dailyNote");
  const markFinished = formData.get("markFinished") === "on";

  if (!bookId) return fail("Pilih buku yang sedang kamu baca.");
  if (!ISO_DATE.test(logDate)) return fail("Tanggal baca tidak valid.");
  if (logDate > todayISO()) return fail("Tanggal baca tidak boleh di masa depan.");
  if (endPage === null || endPage < 1) return fail("Isi halaman terakhir yang kamu capai.");
  if (duration !== null && (duration < 0 || duration > 1440))
    return fail("Durasi membaca harus antara 0 dan 1440 menit.");

  if (!isSupabaseConfigured) {
    return mutate((db) => {
      const book = db.books.find(
        (row) => row.id === bookId && row.user_id === DEMO_USER_ID,
      );
      if (!book) return fail("Buku tidak ditemukan.");

      const check = validatePage(book, endPage, markFinished);
      if ("message" in check) return check;

      db.reading_logs.push({
        id: crypto.randomUUID(),
        book_id: book.id,
        log_date: logDate,
        start_page: check.startPage,
        end_page: endPage,
        pages_read: endPage - check.startPage,
        duration_minutes: duration,
        daily_note: dailyNote || null,
        created_at: new Date().toISOString(),
      });

      applyProgress(book, endPage, logDate, check.finish);
      revalidatePath("/");
      revalidatePath("/logs");
      return done(
        `Tersimpan: +${endPage - check.startPage} halaman untuk ${book.title}.`,
      );
    });
  }

  const user = await getSessionUser();
  if (!user) return fail("Sesi berakhir. Masuk lagi untuk melanjutkan.");

  const supabase = await createClient();

  const { data: book, error: bookError } = await supabase
    .from("books")
    .select("*")
    .eq("id", bookId)
    .single<BookRow>();

  if (bookError || !book) return fail("Buku tidak ditemukan.");

  const check = validatePage(book, endPage, markFinished);
  if ("message" in check) return check;

  const { error: logError } = await supabase.from("reading_logs").insert({
    book_id: book.id,
    log_date: logDate,
    start_page: check.startPage,
    end_page: endPage,
    pages_read: endPage - check.startPage,
    duration_minutes: duration,
    daily_note: dailyNote || null,
  });

  if (logError) return fail(logError.message);

  const patch: Record<string, unknown> = { current_page: endPage };
  if (check.finish) {
    patch.status = "FINISHED" satisfies BookStatus;
    patch.finished_at = logDate;
  }

  const { error: updateError } = await supabase
    .from("books")
    .update(patch)
    .eq("id", book.id);

  if (updateError) return fail(updateError.message);

  revalidatePath("/");
  revalidatePath("/logs");
  return done(
    check.finish
      ? `Selesai: ${book.title} tamat di halaman ${endPage}.`
      : `Tersimpan: +${endPage - check.startPage} halaman untuk ${book.title}.`,
  );
}

function validatePage(
  book: BookRow,
  endPage: number,
  markFinished: boolean,
): { startPage: number; finish: boolean } | FormState {
  if (endPage > book.total_pages)
    return fail(`Halaman melebihi total buku (${book.total_pages} halaman).`);
  if (endPage < book.current_page)
    return fail(
      `Halaman terakhir buku ini sudah ${book.current_page}. Isi ${book.current_page} atau lebih.`,
    );
  return {
    startPage: book.current_page,
    finish: markFinished || endPage === book.total_pages,
  };
}

function applyProgress(
  book: BookRow,
  endPage: number,
  logDate: string,
  finish: boolean,
): void {
  book.current_page = endPage;
  if (finish) {
    book.status = "FINISHED";
    book.finished_at = logDate;
  }
}

export async function saveQuoteAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const bookId = text(formData, "bookId");
  const content = text(formData, "content");
  const pageNumber = int(formData, "pageNumber");
  const chapter = text(formData, "chapter");
  const personalNote = text(formData, "personalNote");
  const tag = text(formData, "tag").replace(/^#/, "").toLowerCase();
  const isFavorite = formData.get("isFavorite") === "on";

  if (!bookId) return fail("Pilih buku asal kutipan.");
  if (content.length < 8) return fail("Kutipan minimal 8 karakter.");
  if (content.length > 2000) return fail("Kutipan terlalu panjang, maksimal 2000 karakter.");

  if (!isSupabaseConfigured) {
    return mutate((db) => {
      const book = db.books.find(
        (row) => row.id === bookId && row.user_id === DEMO_USER_ID,
      );
      if (!book) return fail("Buku tidak ditemukan.");

      const quoteId = crypto.randomUUID();
      db.quotes.push({
        id: quoteId,
        book_id: book.id,
        content,
        page_number: pageNumber,
        chapter: chapter || null,
        personal_note: personalNote || null,
        is_favorite: isFavorite,
        created_at: new Date().toISOString(),
      });

      if (tag) {
        let tagRow = db.tags.find((row) => row.name === tag);
        if (!tagRow) {
          tagRow = { id: crypto.randomUUID(), name: tag, color_hex: null };
          db.tags.push(tagRow);
        }
        db.quote_tags.push({ quote_id: quoteId, tag_id: tagRow.id });
      }

      revalidatePath("/");
      revalidatePath("/logs");
      return done("Kutipan tersimpan.");
    });
  }

  const user = await getSessionUser();
  if (!user) return fail("Sesi berakhir. Masuk lagi untuk melanjutkan.");

  const supabase = await createClient();

  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      book_id: bookId,
      content,
      page_number: pageNumber,
      chapter: chapter || null,
      personal_note: personalNote || null,
      is_favorite: isFavorite,
    })
    .select("id")
    .single<{ id: string }>();

  if (error || !quote) return fail(error?.message ?? "Gagal menyimpan kutipan.");

  if (tag) {
    const { data: existing } = await supabase
      .from("tags")
      .select("id")
      .ilike("name", tag)
      .maybeSingle<{ id: string }>();

    let tagId = existing?.id;
    if (!tagId) {
      const { data: created, error: tagError } = await supabase
        .from("tags")
        .insert({ name: tag, color_hex: null })
        .select("id")
        .single<{ id: string }>();
      if (tagError) return fail(tagError.message);
      tagId = created?.id;
    }

    if (tagId) {
      const { error: linkError } = await supabase
        .from("quote_tags")
        .insert({ quote_id: quote.id, tag_id: tagId });
      if (linkError) return fail(linkError.message);
    }
  }

  revalidatePath("/");
  revalidatePath("/logs");
  return done("Kutipan tersimpan.");
}

export async function createBookAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const title = text(formData, "title");
  const author = text(formData, "author");
  const category = text(formData, "category");
  const coverUrl = text(formData, "coverUrl");
  const totalPages = int(formData, "totalPages");
  const status = text(formData, "status") || "READING";

  if (title.length < 1) return fail("Judul buku wajib diisi.");
  if (author.length < 1) return fail("Nama penulis wajib diisi.");
  if (totalPages === null || totalPages < 1)
    return fail("Total halaman harus angka lebih dari 0.");
  if (!["WANT_TO_READ", "READING", "FINISHED", "DNF"].includes(status))
    return fail("Status buku tidak dikenal.");

  const today = todayISO();

  if (!isSupabaseConfigured) {
    return mutate((db) => {
      db.books.push({
        id: crypto.randomUUID(),
        user_id: DEMO_USER_ID,
        title,
        author,
        cover_url: coverUrl || null,
        category: category || null,
        total_pages: totalPages,
        current_page: status === "FINISHED" ? totalPages : 0,
        status: status as BookStatus,
        rating: null,
        review: null,
        started_at: status === "READING" ? today : null,
        finished_at: status === "FINISHED" ? today : null,
        created_at: new Date().toISOString(),
      });
      revalidatePath("/");
      revalidatePath("/logs");
      return done(`"${title}" masuk ke rak.`);
    });
  }

  const user = await getSessionUser();
  if (!user) return fail("Sesi berakhir. Masuk lagi untuk melanjutkan.");

  const supabase = await createClient();

  const { error } = await supabase.from("books").insert({
    user_id: user.id,
    title,
    author,
    cover_url: coverUrl || null,
    category: category || null,
    total_pages: totalPages,
    current_page: status === "FINISHED" ? totalPages : 0,
    status,
    started_at: status === "READING" ? today : null,
    finished_at: status === "FINISHED" ? today : null,
  });

  if (error) return fail(error.message);

  revalidatePath("/");
  revalidatePath("/logs");
  return done(`"${title}" masuk ke rak.`);
}

export async function toggleQuoteFavoriteAction(
  formData: FormData,
): Promise<void> {
  const quoteId = text(formData, "quoteId");
  const next = formData.get("isFavorite") === "true";
  if (!quoteId) return;

  if (!isSupabaseConfigured) {
    await mutate((db) => {
      const quote = db.quotes.find((row) => row.id === quoteId);
      if (!quote) return;
      const book = db.books.find(
        (row) => row.id === quote.book_id && row.user_id === DEMO_USER_ID,
      );
      if (!book) return;
      quote.is_favorite = next;
    });
    revalidatePath("/quotes");
    revalidatePath("/");
    return;
  }

  const user = await getSessionUser();
  if (!user) return;

  const supabase = await createClient();

  await supabase
    .from("quotes")
    .update({ is_favorite: next })
    .eq("id", quoteId);

  revalidatePath("/quotes");
  revalidatePath("/");
}

export async function updateQuoteAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const quoteId = text(formData, "quoteId");
  const content = text(formData, "content");
  const pageNumber = int(formData, "pageNumber");
  const chapter = text(formData, "chapter");
  const personalNote = text(formData, "personalNote");

  if (!quoteId) return fail("Kutipan tidak dikenal.");
  if (content.length < 8) return fail("Kutipan minimal 8 karakter.");
  if (content.length > 2000)
    return fail("Kutipan terlalu panjang, maksimal 2000 karakter.");

  if (!isSupabaseConfigured) {
    return mutate((db) => {
      const quote = db.quotes.find((row) => row.id === quoteId);
      if (!quote) return fail("Kutipan tidak ditemukan.");

      const book = db.books.find(
        (row) => row.id === quote.book_id && row.user_id === DEMO_USER_ID,
      );
      if (!book) return fail("Buku tidak ditemukan.");

      quote.content = content;
      quote.page_number = pageNumber;
      quote.chapter = chapter || null;
      quote.personal_note = personalNote || null;

      revalidatePath("/quotes");
      revalidatePath("/");
      return done("Kutipan diperbarui.");
    });
  }

  const user = await getSessionUser();
  if (!user) return fail("Sesi berakhir. Masuk lagi untuk melanjutkan.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("quotes")
    .update({
      content,
      page_number: pageNumber,
      chapter: chapter || null,
      personal_note: personalNote || null,
    })
    .eq("id", quoteId);

  if (error) return fail(error.message);

  revalidatePath("/quotes");
  revalidatePath("/");
  revalidatePath("/logs");
  return done("Kutipan diperbarui.");
}

export async function deleteQuoteAction(formData: FormData): Promise<void> {
  const quoteId = text(formData, "quoteId");
  if (!quoteId) return;

  if (!isSupabaseConfigured) {
    await mutate((db) => {
      const quote = db.quotes.find((row) => row.id === quoteId);
      if (!quote) return;

      const book = db.books.find(
        (row) => row.id === quote.book_id && row.user_id === DEMO_USER_ID,
      );
      if (!book) return;

      db.quotes = db.quotes.filter((row) => row.id !== quoteId);
      db.quote_tags = db.quote_tags.filter((link) => link.quote_id !== quoteId);
    });
  } else {
    const user = await getSessionUser();
    if (!user) return;

    const supabase = await createClient();
    // quote_tags cascades from the quote row.
    await supabase.from("quotes").delete().eq("id", quoteId);
  }

  revalidatePath("/quotes");
  revalidatePath("/");
}

export async function signInAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = text(formData, "email");
  const password = text(formData, "password");

  if (!email.includes("@")) return fail("Alamat email tidak valid.");
  if (password.length < 6) return fail("Kata sandi minimal 6 karakter.");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return fail(error.message);

  redirect("/");
}

export async function signUpAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const name = text(formData, "name");
  const email = text(formData, "email");
  const password = text(formData, "password");

  if (name.length < 2) return fail("Nama minimal 2 karakter.");
  if (!email.includes("@")) return fail("Alamat email tidak valid.");
  if (password.length < 6) return fail("Kata sandi minimal 6 karakter.");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) return fail(error.message);
  if (!data.session)
    return done("Akun dibuat. Cek email untuk konfirmasi, lalu masuk.");

  redirect("/");
}

export async function signOutAction(): Promise<void> {
  if (!isSupabaseConfigured) {
    redirect("/");
  }
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

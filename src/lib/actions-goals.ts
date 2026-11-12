"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/supabase/session";
import { mutate } from "@/lib/demo/store";
import { DEMO_USER_ID } from "@/lib/demo/seed";
import type { FormState } from "@/lib/form-state";

const MAX_TARGET_BOOKS = 999;
const MAX_TARGET_PAGES = 5000;

function fail(message: string): FormState {
  return { status: "error", message };
}

function done(message: string): FormState {
  return { status: "success", message };
}

function int(formData: FormData, key: string): number | null {
  const raw = formData.get(key);
  if (typeof raw !== "string" || raw.trim() === "") return 0;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.trunc(value) : null;
}

/**
 * One goal row per user per year, as the schema enforces. Saving zero for both
 * numbers deletes the row instead of storing a goal of nothing, so the
 * dashboard goes back to "belum diatur" rather than claiming a target of 0.
 */
export async function saveReadingGoalAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const yearRaw = int(formData, "year");
  const targetBooks = int(formData, "targetBooks");
  const targetPages = int(formData, "targetPagesPerDay");

  if (yearRaw === null || yearRaw < 1900 || yearRaw > 3000)
    return fail("Tahun target tidak dikenal.");
  if (targetBooks === null || targetBooks < 0 || targetBooks > MAX_TARGET_BOOKS)
    return fail(`Target buku harus antara 0 dan ${MAX_TARGET_BOOKS}.`);
  if (targetPages === null || targetPages < 0 || targetPages > MAX_TARGET_PAGES)
    return fail(`Target halaman per hari harus antara 0 dan ${MAX_TARGET_PAGES}.`);

  const year = yearRaw;
  const cleared = targetBooks === 0 && targetPages === 0;
  const message = cleared
    ? "Target dihapus."
    : `Target ${year}: ${targetBooks} buku, ${targetPages} halaman per hari.`;

  if (!isSupabaseConfigured) {
    return mutate((db) => {
      const index = db.reading_goals.findIndex(
        (row) => row.user_id === DEMO_USER_ID && row.year === year,
      );

      if (cleared) {
        if (index >= 0) db.reading_goals.splice(index, 1);
      } else if (index >= 0) {
        db.reading_goals[index].target_books = targetBooks;
        db.reading_goals[index].target_pages_per_day = targetPages;
      } else {
        db.reading_goals.push({
          id: crypto.randomUUID(),
          user_id: DEMO_USER_ID,
          year,
          target_books: targetBooks,
          target_pages_per_day: targetPages,
        });
      }

      revalidatePath("/");
      return done(message);
    });
  }

  const user = await getSessionUser();
  if (!user) return fail("Sesi berakhir. Masuk lagi untuk melanjutkan.");

  const supabase = await createClient();

  const { error } = cleared
    ? await supabase
        .from("reading_goals")
        .delete()
        .eq("user_id", user.id)
        .eq("year", year)
    : await supabase.from("reading_goals").upsert(
        {
          user_id: user.id,
          year,
          target_books: targetBooks,
          target_pages_per_day: targetPages,
        },
        { onConflict: "user_id,year" },
      );

  if (error) return fail(error.message);

  revalidatePath("/");
  return done(message);
}

import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSessionUser } from "@/lib/supabase/session";
import { searchBooks } from "@/lib/books/search";

/** Only one lookup per submit; the 10-minute fetch cache keeps it cheap. */
export async function GET(request: Request) {
  if (isSupabaseConfigured && !(await getSessionUser())) {
    return NextResponse.json({ error: "Sesi berakhir." }, { status: 401 });
  }

  const query = new URL(request.url).searchParams.get("q") ?? "";
  if (query.trim().length < 2) {
    return NextResponse.json(
      { items: [], source: null, notice: null },
      { headers: { "cache-control": "no-store" } },
    );
  }

  const result = await searchBooks(query);
  return NextResponse.json(result, {
    headers: { "cache-control": "no-store" },
  });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * OAuth callback.
 *
 * Supabase redirects here with a one-time `code` after the provider agrees. The
 * code is exchanged for a session, which the server client writes into cookies;
 * from then on the middleware refreshes it like any other session.
 *
 * `next` comes from our own login page, but it is still validated: a callback
 * that trusted it blindly would be an open redirect (someone could craft a link
 * that bounces a freshly signed-in user to another site).
 */
function safeNext(value: string | null): string {
  if (!value) return "/";
  // A leading "/" alone is not enough: "//host" is protocol-relative, and
  // "/\\host" normalises to "//host" inside `new URL`. Both leave the site.
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/";
  }
  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));

  if (!isSupabaseConfigured) {
    return NextResponse.redirect(new URL("/", url.origin));
  }

  // The provider can refuse before a code exists (user cancelled, blocked app).
  const providerError = url.searchParams.get("error");
  if (providerError) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(providerError)}`, url.origin),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_code", url.origin),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(error.message)}`,
        url.origin,
      ),
    );
  }

  return NextResponse.redirect(new URL(next, url.origin));
}

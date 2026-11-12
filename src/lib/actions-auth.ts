"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, supabaseUrl } from "@/lib/supabase/config";

/**
 * The origin Supabase should bounce back to.
 *
 * Vercel sets `x-forwarded-host` and `x-forwarded-proto`, so the same code works
 * on the deployed domain and on localhost without configuration. An explicit
 * `NEXT_PUBLIC_SITE_URL` wins when the deployment sits behind a custom proxy.
 */
async function siteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  const store = await headers();
  const host = store.get("x-forwarded-host") ?? store.get("host");
  if (!host) return "http://localhost:3000";

  const proto = store.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

/**
 * Supabase answers the public authorize endpoint with 400 "provider is not
 * enabled" when it is off, and with a redirect when it is on. One probe tells
 * the login button whether it can work, without any admin key.
 */
async function isGoogleEnabled(): Promise<boolean> {
  const url = `${supabaseUrl}/auth/v1/authorize?provider=google`;
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    // Enabled -> 302 to accounts.google.com. Disabled -> 400 JSON.
    return response.status !== 400;
  } catch {
    return true; // Network hiccup: let Supabase decide rather than block.
  }
}

/**
 * Starts the Google sign-in flow.
 *
 * The browser goes to Supabase, Supabase goes to Google, and Google sends the
 * browser back to Supabase, which returns to `/auth/callback` with a one-time
 * code. Google therefore only ever sees the Supabase callback URL, so the flow
 * needs no per-domain registration on Google's side.
 *
 * `skipBrowserRedirect` hands the URL back instead of redirecting the server
 * action's own response, which is what lets the redirect target be ours.
 */
export async function signInWithGoogleAction(): Promise<void> {
  if (!isSupabaseConfigured) {
    redirect("/login?error=google_unavailable");
  }

  const supabase = await createClient();
  const origin = await siteOrigin();

  // Supabase answers the authorize endpoint with a JSON page (not a redirect)
  // when the provider is disabled. Check first, so a misconfigured project
  // never shows that raw JSON to a reader.
  if (!(await isGoogleEnabled())) {
    redirect("/login?error=google_unavailable");
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: { access_type: "offline", prompt: "consent" },
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    redirect(
      `/login?error=${encodeURIComponent(error?.message ?? "google_unavailable")}`,
    );
  }

  redirect(data.url);
}

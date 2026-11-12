import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./config";

/**
 * Refreshes the Supabase auth cookies on every request so server components
 * always read a valid session.
 *
 * The identity check is deliberately left to the pages (`getSessionUser()`),
 * which runs once per request. Calling `getUser()` here as well would add a
 * second auth round trip to every navigation.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Reads the session from cookies and refreshes it when it is about to
  // expire. Local by default, so it costs nothing on the common path.
  await supabase.auth.getSession();

  return response;
}

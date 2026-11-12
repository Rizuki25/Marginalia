import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./server";
import { isSupabaseConfigured } from "./config";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

function nameFrom(user: Pick<User, "email" | "user_metadata">): string {
  const metaName = user.user_metadata?.name;
  if (typeof metaName === "string" && metaName.trim() !== "") return metaName;
  return user.email?.split("@")[0] ?? "Pembaca";
}

/**
 * Verifies the session once per request and shares the result with the layout
 * and the page. `cache()` is what keeps the auth server round trip from being
 * paid three times per navigation.
 *
 * `getClaims()` verifies the JWT locally when the project signs tokens with an
 * asymmetric key, and falls back to a network check otherwise. Either way it
 * is never less strict than `getUser()`, because the signature is verified.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) return null;

  const claims = data.claims as {
    sub?: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  };

  if (!claims.sub) return null;

  return {
    id: claims.sub,
    email: claims.email ?? "",
    name: nameFrom({
      email: claims.email,
      user_metadata: claims.user_metadata ?? {},
    } as Pick<User, "email" | "user_metadata">),
  };
});

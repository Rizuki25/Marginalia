export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * When the two public Supabase env vars are missing the app runs in demo
 * mode: a single local reader backed by a JSON file under `.data/`.
 * That keeps the dashboard runnable before a Supabase project exists.
 */
export const isSupabaseConfigured =
  supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

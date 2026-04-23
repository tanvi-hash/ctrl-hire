import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client. Uses the anon key — safe to expose.
 * Use inside Client Components and browser-only code.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

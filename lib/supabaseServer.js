import { createClient } from "@supabase/supabase-js";

// This client uses the service role key, which bypasses row-level security.
// Only ever import this inside server-side code (API routes, server
// components) — never send this key to the browser.
export function getSupabaseServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

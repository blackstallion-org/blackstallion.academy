import { createClient } from "@supabase/supabase-js";
import { supabaseConfig } from "@/lib/supabase/rest";

/**
 * Privileged Supabase client (secret key). SERVER ONLY, and only for work the server has already validated and
 * authorised: storing generated documents, minting signed URLs. Never import this from a client component; the
 * secret key has no NEXT_PUBLIC_ prefix, so it can never be bundled for the browser.
 */
export function createSupabaseAdminClient() {
  const config = supabaseConfig();
  if (!config?.secret) return null;
  return createClient(config.url, config.secret, { auth: { persistSession: false, autoRefreshToken: false } });
}

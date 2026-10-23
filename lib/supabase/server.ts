import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseConfig } from "@/lib/supabase/rest";

/**
 * Supabase client bound to the visitor's auth cookies (server components, server actions, route handlers).
 * Uses only the publishable key: every query runs as the signed-in user, so Row Level Security decides access.
 * Returns null when Supabase is not configured.
 */
export async function createSupabaseServerClient() {
  const config = supabaseConfig();
  if (!config) return null;
  const store = await cookies();
  return createServerClient(config.url, config.publishable, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a Server Component render, where cookies are read-only; the proxy refreshes sessions instead.
        }
      },
    },
  });
}

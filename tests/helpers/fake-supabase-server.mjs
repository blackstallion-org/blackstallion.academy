// Test stand-in for lib/supabase/server.ts: hands back whatever client the test installed on globalThis.__bsahTest.supabase.
export async function createSupabaseServerClient() {
  return globalThis.__bsahTest?.supabase ?? null;
}

// Test stand-in for lib/supabase/admin.ts: hands back globalThis.__bsahTest.admin (null when the test installed none).
export function createSupabaseAdminClient() {
  return globalThis.__bsahTest?.admin ?? null;
}

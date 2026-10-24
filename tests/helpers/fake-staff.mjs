// Test stand-in for lib/auth/admin.ts, swapped in through a jiti alias (tests/helpers/load-ts.mjs → loadTsWith).
// requireStaff() delegates to whatever the current test installed on globalThis.__bsahTest, so a test can return a fake
// Supabase client and record that (and when) the staff check ran. Never imported by the application.
export const STAFF_ROLES = ["SUPER_ADMIN", "operations", "executive_admin"];
export const isStaffRole = (role) => typeof role === "string" && STAFF_ROLES.includes(role);
export const fetchStaffProfile = async () => null;

export async function requireStaff() {
  const hook = globalThis.__bsahTest?.requireStaff;
  if (!hook) throw new Error("fake-staff: the test did not install requireStaff");
  return hook();
}

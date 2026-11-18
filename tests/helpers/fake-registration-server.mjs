// Test stand-in for lib/registration/server.ts: requireAccount() returns what the test installed on globalThis.__bsahTest.
export const ADMISSIONS_ROLES = ["SUPER_ADMIN", "ADMISSIONS"];
export const isAdmissionsRole = (role) => typeof role === "string" && ADMISSIONS_ROLES.includes(role);
export async function requireAccount() {
  const hook = globalThis.__bsahTest?.requireAccount;
  if (!hook) throw new Error("fake-registration-server: the test did not install requireAccount");
  return hook();
}
export async function requireAdmissions() {
  const hook = globalThis.__bsahTest?.requireAdmissions;
  if (!hook) throw new Error("fake-registration-server: requireAdmissions is not faked");
  return hook();
}
export const friendlyDbError = () => "database error";

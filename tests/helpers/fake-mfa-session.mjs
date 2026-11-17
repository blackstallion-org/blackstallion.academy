// Test stand-in for lib/auth/mfa-session.ts: requirePrivilegedSession() returns whatever the test installed on globalThis.__bsahTest.
export async function requirePrivilegedSession() {
  const hook = globalThis.__bsahTest?.requirePrivilegedSession;
  if (!hook) throw new Error("fake-mfa-session: the test did not install requirePrivilegedSession");
  return hook();
}

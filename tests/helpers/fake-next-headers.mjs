// Test stand-in for next/headers (swapped in through loadTsWith). Reads the headers a test installed on globalThis.__bsahTest.
export async function headers() {
  return new Headers(globalThis.__bsahTest?.headers ?? { "x-forwarded-for": "203.0.113.7", host: "example.test" });
}
export async function cookies() {
  return { getAll: () => [], set: () => {} };
}

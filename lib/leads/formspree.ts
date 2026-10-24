/**
 * Formspree forwarding (server side). The site's forms are React server actions with server validation, consent,
 * de-duplication and Supabase storage, so the Formspree React hook (`@formspree/react`, client-side) would bypass all
 * of that. Instead the validated enquiry is forwarded from the server to the Formspree endpoint as JSON
 * (FORMSPREE_ENDPOINT, e.g. https://formspree.io/f/xxxxxxx): Formspree becomes an inbox and a backup channel.
 */
export async function forwardToFormspree(
  payload: Record<string, string | undefined>,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: boolean; status?: number; skipped?: boolean }> {
  const endpoint = process.env.FORMSPREE_ENDPOINT;
  // Only the real Formspree host (or a loopback receiver used by the test suite) is accepted.
  if (!endpoint || !/^(https:\/\/formspree\.io\/f\/[A-Za-z0-9]+|http:\/\/127\.0\.0\.1:\d+\/[\w/-]*)$/.test(endpoint)) return { ok: false, skipped: true };
  const body = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined && v !== ""));
  try {
    const res = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error(JSON.stringify({ event: "formspree.rejected", status: res.status }));
    return { ok: res.ok, status: res.status };
  } catch {
    console.error(JSON.stringify({ event: "formspree.network_error" }));
    return { ok: false };
  }
}

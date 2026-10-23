/**
 * Server error reporting (instrumentation.ts → onRequestError). No third-party service is needed:
 *
 * 1. Every server error is written as one structured JSON line (visible in Vercel → Logs, searchable by
 *    `server.error`). Messages are redacted: e-mail addresses, long digit runs (phone numbers, ids) and anything that
 *    looks like a key are removed, so logs never carry personal data or secrets.
 * 2. Optional alert e-mail through Resend when ERROR_ALERT_EMAIL is set (comma separated). At most one alert per
 *    route + error digest every 15 minutes per server instance; the Resend idempotency key carries the same
 *    15-minute window, so parallel instances do not send duplicates either.
 *
 * An external error tracker (e.g. Sentry) can replace this later without touching the rest of the app.
 */
import { sendEmail } from "@/lib/email/resend";

export type RequestInfo = { path: string; method: string };
export type ErrorContext = { routerKind?: string; routePath?: string; routeType?: string; renderSource?: string };

const WINDOW_MS = 15 * 60 * 1000;
const lastAlert = new Map<string, number>();

/** Removes e-mail addresses, long digit runs and key-like tokens; caps the length. */
export function redact(text: string, max = 300): string {
  return text
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, "[email]")
    .replace(/\b(sk|pk|re|rk|sb_secret|sb_publishable|eyJ)[A-Za-z0-9_.-]{12,}/g, "[key]")
    .replace(/\+?\d[\d\s-]{6,}\d/g, "[number]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** The path without its query string (queries can carry codes or names). */
export function safePath(path: string): string {
  return (path || "").split("?")[0].slice(0, 200);
}

function describe(error: unknown) {
  if (error instanceof Error) {
    const digest = "digest" in error ? String((error as { digest?: unknown }).digest ?? "") : "";
    return { name: error.name || "Error", message: redact(error.message || ""), digest };
  }
  if (typeof error === "object" && error !== null && "digest" in error) {
    return { name: "Error", message: "", digest: String((error as { digest?: unknown }).digest ?? "") };
  }
  return { name: typeof error, message: redact(String(error)), digest: "" };
}

export async function reportServerError(
  error: unknown,
  request: RequestInfo,
  context: ErrorContext,
  now: number = Date.now(),
  fetchImpl: typeof fetch = fetch,
): Promise<{ logged: true; alerted: boolean }> {
  const info = describe(error);
  const route = context.routePath || safePath(request.path);
  console.error(JSON.stringify({
    event: "server.error",
    route,
    path: safePath(request.path),
    method: request.method,
    routeType: context.routeType,
    renderSource: context.renderSource,
    name: info.name,
    digest: info.digest || undefined,
    message: info.message || undefined,
  }));

  const recipients = (process.env.ERROR_ALERT_EMAIL || "").split(",").map((a) => a.trim()).filter(Boolean);
  if (!recipients.length || !process.env.RESEND_API_KEY) return { logged: true, alerted: false };

  const key = `${route}|${info.digest || info.name}`;
  const previous = lastAlert.get(key);
  if (previous !== undefined && now - previous < WINDOW_MS) return { logged: true, alerted: false };
  lastAlert.set(key, now);

  const bucket = Math.floor(now / WINDOW_MS);
  const env = process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown";
  const lines = [
    `Environment: ${env}`,
    `Route: ${route}`,
    `Request: ${request.method} ${safePath(request.path)}`,
    `Error: ${info.name}${info.digest ? ` (digest ${info.digest})` : ""}`,
    info.message ? `Message (redacted): ${info.message}` : "",
    "Details: Vercel → Project → Logs, search for server.error.",
  ].filter(Boolean);
  const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
  const result = await sendEmail({
    to: recipients,
    subject: `BSAH website error (${env}): ${route}`.slice(0, 180),
    text: lines.join("\n"),
    html: `<pre style="font-family:monospace;white-space:pre-wrap">${escape(lines.join("\n"))}</pre>`,
    idempotencyKey: `error-alert/${key}/${bucket}`.slice(0, 256),
    tag: "error_alert",
  }, fetchImpl);
  return { logged: true, alerted: result.ok };
}

/** Test helper: forget the per-instance throttle. */
export function resetErrorAlertThrottle() {
  lastAlert.clear();
}

import type { Instrumentation } from "next";

/**
 * Server error reporting: one redacted JSON log line per error (Vercel → Logs, search "server.error") and an optional
 * throttled alert e-mail (ERROR_ALERT_EMAIL). See lib/monitoring/report.ts.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  try {
    const { reportServerError } = await import("@/lib/monitoring/report");
    await reportServerError(error, { path: request.path, method: request.method }, context);
  } catch {
    // Reporting must never turn one error into two.
  }
};

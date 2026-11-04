/**
 * Plain-language answers for Supabase Auth failures. The raw message is never shown to the visitor (it can contain an
 * address or number), and nothing here says whether an account exists.
 */
type AuthErrorLike = { code?: string; status?: number; message?: string } | null | undefined;

export type AuthFailure = "invalid_code" | "rate_limited" | "sms_unavailable" | "signups_closed" | "unconfirmed" | "invalid_credentials" | "unknown";

export function classifyAuthError(error: AuthErrorLike): AuthFailure {
  const code = error?.code ?? "";
  const message = (error?.message ?? "").toLowerCase();
  if (code === "email_not_confirmed") return "unconfirmed";
  if (code === "invalid_credentials") return "invalid_credentials";
  if (code === "otp_expired" || code === "otp_disabled" || /token has expired or is invalid|invalid.*(token|otp|code)/.test(message)) return "invalid_code";
  if (code === "over_sms_send_rate_limit" || code === "over_request_rate_limit" || code === "over_email_send_rate_limit" || error?.status === 429) return "rate_limited";
  if (code === "sms_send_failed" || code === "phone_provider_disabled" || code === "provider_disabled" || /sms|twilio|messagebird|vonage/.test(message)) return "sms_unavailable";
  if (code === "signup_disabled" || code === "otp_signup_disabled" || /signups? not allowed/.test(message)) return "signups_closed";
  return "unknown";
}

const TEXT: Record<AuthFailure, string> = {
  invalid_code: "That code is wrong or has expired. Check the latest text message, or ask for a new code.",
  rate_limited: "Too many attempts just now. Please wait a few minutes and try again.",
  sms_unavailable: "We could not send a text message right now. Please try again later, or sign in with your e-mail or Google instead.",
  signups_closed: "New accounts cannot be created this way at the moment. Please contact the academy.",
  unconfirmed: "Please confirm your e-mail address first: open the link we sent you, then sign in.",
  invalid_credentials: "Those details did not match an account.",
  unknown: "We could not complete that. Please try again in a moment.",
};

export function authErrorMessage(error: AuthErrorLike): string {
  return TEXT[classifyAuthError(error)];
}

"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { logAdminError } from "@/lib/admin/server";
import { authErrorMessage } from "@/lib/auth/errors";
import { destinationAfterSignIn } from "@/lib/auth/destination";
import { maskPhone, normalizeOtp, normalizePhone } from "@/lib/auth/phone";
import { safeNext } from "@/lib/registration/model";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthFormState = { error?: string; notice?: string; step?: "code"; phone?: string } | null;

async function client() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "";
  const proto = h.get("x-forwarded-proto") || "https";
  return {
    ip: (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "unknown").trim().slice(0, 64),
    origin: process.env.NEXT_PUBLIC_SITE_URL || (host ? `${proto}://${host}` : ""),
  };
}

/**
 * "Continue with Google". Starts the OAuth (PKCE) flow on the server: the code verifier is kept in the HttpOnly session
 * cookies, the visitor is sent to Google, and Google returns through Supabase to /auth/confirm?via=google, which
 * exchanges the code for a session. Signing in and signing up are the same step; the database trigger creates the
 * profile the first time and Supabase links a second sign-in with the same verified e-mail to the same account.
 */
export async function signInWithGoogle(data: FormData) {
  const { ip, origin } = await client();
  if (!(await consumeRateLimit("login", ip)).allowed) redirect("/admin/login?e=rate");
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/admin/login?e=unconfigured");
  const next = safeNext(data.get("next"), "");
  const redirectTo = `${origin}/auth/confirm?via=google${next ? `&next=${encodeURIComponent(next)}` : ""}`;
  const { data: result, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: "select_account" } },
  });
  if (error || !result?.url) {
    logAdminError("auth.google_start_failed", error);
    redirect("/admin/login?e=oauth");
  }
  redirect(result.url);
}

const STEP_ONE_COPY = "We sent a 6-digit code by text message. Enter it soon: it stops working after a short while.";

/**
 * Phone sign-in, step one: send the 6-digit code. Same answer whether or not the number already has an account (the first
 * successful code creates it). Rate limited per visitor and per number: a text costs money and must not be usable to spam a
 * stranger.
 */
export async function sendPhoneCode(_prev: AuthFormState, data: FormData): Promise<AuthFormState> {
  const { ip } = await client();
  // A hidden field real visitors never fill: a bot that does gets the friendly answer and no text is sent.
  if (String(data.get("website") ?? "").trim() !== "") return { step: "code", phone: "+910000000000", notice: STEP_ONE_COPY };
  if (!(await consumeRateLimit("smssend", ip)).allowed) return { error: "Too many codes were requested from this connection. Please wait fifteen minutes." };
  const phone = normalizePhone(data.get("phone"));
  if (!phone) return { error: "Enter a mobile number, for example 98765 43210. Numbers from other countries start with + and the country code." };
  if (!(await consumeRateLimit("smsphone", phone)).allowed) return { error: "A code was already sent to that number. Please wait a few minutes before asking for another." };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Sign-in is not configured yet." };
  const { error } = await supabase.auth.signInWithOtp({ phone, options: { channel: "sms", shouldCreateUser: true } });
  if (error) {
    logAdminError("auth.phone_send_failed", error);
    return { error: authErrorMessage(error) };
  }
  return { step: "code", phone, notice: `${STEP_ONE_COPY} Sent to ${maskPhone(phone)}.` };
}

const codeForm = z.object({ phone: z.string(), token: z.string() });

/**
 * Phone sign-in, step two: check the code and open the session. A wrong or expired code gets one friendly answer; the
 * number of tries is limited per visitor and per number so a six-digit code cannot be guessed.
 */
export async function verifyPhoneCode(_prev: AuthFormState, data: FormData): Promise<AuthFormState> {
  const { ip } = await client();
  const form = codeForm.safeParse({ phone: data.get("phone"), token: data.get("token") });
  const phone = form.success ? normalizePhone(form.data.phone) : null;
  if (!phone) return { error: "Start again and enter your mobile number." };
  const token = normalizeOtp(form.success ? form.data.token : null);
  if (!token) return { step: "code", phone, error: "Enter the 6-digit code from the text message." };
  if (!(await consumeRateLimit("smscheck", ip)).allowed || !(await consumeRateLimit("smscheck", phone)).allowed) {
    return { step: "code", phone, error: "Too many wrong codes. Please wait fifteen minutes, then ask for a new code." };
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Sign-in is not configured yet." };
  const { data: result, error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
  if (error || !result.user) {
    logAdminError("auth.phone_verify_failed", error);
    return { step: "code", phone, error: authErrorMessage(error) };
  }
  const destination = await destinationAfterSignIn(supabase, result.user.id, data.get("next"));
  if (!destination) {
    await supabase.auth.signOut();
    return { error: "This account is not set up yet. Please contact the academy." };
  }
  redirect(destination);
}

/**
 * Sends the confirmation e-mail again (the first link expires after an hour or lands in spam). Always answers the same way,
 * so it cannot be used to find out which addresses have accounts.
 */
export async function resendConfirmation(_prev: AuthFormState, data: FormData): Promise<AuthFormState> {
  const { ip, origin } = await client();
  if (!(await consumeRateLimit("signup", ip)).allowed) return { error: "Too many e-mails were requested. Please try again in an hour." };
  const email = z.string().trim().email().max(160).safeParse(data.get("email"));
  if (!email.success) return { error: "Enter your e-mail address first." };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Sign-in is not configured yet." };
  const { error } = await supabase.auth.resend({ type: "signup", email: email.data.toLowerCase(), options: { emailRedirectTo: `${origin}/auth/confirm?via=signup` } });
  if (error) logAdminError("auth.resend_failed", error);
  return { notice: "If that address has an account waiting for confirmation, a new link is on its way." };
}

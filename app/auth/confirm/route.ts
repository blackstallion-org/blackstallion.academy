import { type NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { destinationAfterSignIn } from "@/lib/auth/destination";
import { safeNext } from "@/lib/registration/model";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Landing point for Supabase links and for the Google sign-in return. Accepts either a PKCE `code` (e-mail links and
 * Google) or a `token_hash` + `type`, establishes the session in cookies, then continues to a RELATIVE path only (no open redirect).
 * `safeNext` also refuses backslashes: "/\\evil.com" passed the earlier "starts with / but not //" test and URL parsing
 * turns it into https://evil.com (security audit F-06, 4 Nov 2026).
 *
 * `?via=google` marks the Google return and `?via=signup` the link in the sign-up confirmation e-mail: the person lands
 * where their account says (staff console, member account, registration portal), exactly as after a password sign-in. The
 * live project has no member table, so a fixed "/account" would be a dead end there. A failure or a cancelled consent
 * screen shows the Google message for Google and the expired-link message otherwise.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = safeNext(searchParams.get("next"), "/admin");
  const via = searchParams.get("via");
  const google = via === "google";
  const routed = google || via === "signup";
  const fail = (reason: string) => NextResponse.redirect(new URL(`/admin/login?e=${google ? "oauth" : reason}`, request.url));
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.redirect(new URL("/admin/login?e=unconfigured", request.url));

  // The provider can send the visitor back with an error instead of a code (consent refused, sign-ups closed, ...).
  if (searchParams.get("error") || searchParams.get("error_code")) return fail("link");

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  let ok = false;
  if (code) ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  else if (tokenHash && type) ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;
  if (!ok) return fail("link");
  if (!routed) return NextResponse.redirect(new URL(next, request.url));

  const { data } = await supabase.auth.getUser();
  const destination = data.user ? await destinationAfterSignIn(supabase, data.user.id, searchParams.get("next")) : null;
  if (!destination) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/admin/login?e=profile", request.url));
  }
  return NextResponse.redirect(new URL(destination, request.url));
}

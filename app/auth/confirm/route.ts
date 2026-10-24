import { type NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Landing point for Supabase e-mail links (password recovery, invites). Accepts either a PKCE `code` or a
 * `token_hash` + `type`, establishes the session in cookies, then continues to a RELATIVE path only (no open redirect).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const nextParam = searchParams.get("next") ?? "/admin";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/admin";
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.redirect(new URL("/admin/login?e=unconfigured", request.url));

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  let ok = false;
  if (code) ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  else if (tokenHash && type) ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;
  return NextResponse.redirect(new URL(ok ? next : "/admin/login?e=link", request.url));
}

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE_OPTIONS } from "@/lib/supabase/rest";

/**
 * Account proxy: refreshes the Supabase session cookie and sends signed-out visitors to the login page.
 * It runs only on /admin, /account and the registration routes (/enroll, the three application forms, /sovereign); public pages
 * never require a login. Signed-out visitors to a registration route come back to it after signing in (?next=). Authorisation (staff role) is still checked on
 * the server for every admin page and action; a missing redirect here can never expose data.
 */
const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/reset"];

export async function proxy(request: NextRequest) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_ADMIN_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
  let response = NextResponse.next({ request });
  response.headers.set("x-robots-tag", "noindex, nofollow");
  response.headers.set("cache-control", "private, no-store");
  if (!url || !key) {
    if (isPublic) return response;
    return NextResponse.redirect(new URL("/admin/login?e=unconfigured", request.url));
  }

  const supabase = createServerClient(url, key, {
    cookieOptions: AUTH_COOKIE_OPTIONS,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        response.headers.set("x-robots-tag", "noindex, nofollow");
        response.headers.set("cache-control", "private, no-store");
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });
  const { data } = await supabase.auth.getUser();
  if (!data.user && !isPublic) {
    const login = new URL("/admin/login", request.url);
    if (!path.startsWith("/admin") && !path.startsWith("/account")) login.searchParams.set("next", path);
    const redirect = NextResponse.redirect(login);
    // keep the cookies the session refresh just set or cleared (an expired session is removed here, not left in the browser)
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    redirect.headers.set("cache-control", "private, no-store");
    return redirect;
  }
  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/account", "/account/:path*", "/enroll", "/enroll/:path*", "/schools/apply", "/careers/apply", "/partners/apply", "/sovereign", "/sovereign/:path*"],
};

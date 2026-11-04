import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Account proxy: refreshes the Supabase session cookie and sends signed-out visitors to the login page.
 * It runs only on /admin and /account (members) routes; public pages never require a login. Authorisation (staff role) is still checked on
 * the server for every admin page and action; a missing redirect here can never expose data.
 */
const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/reset"];

export async function proxy(request: NextRequest) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const isPublic = PUBLIC_ADMIN_PATHS.some((p) => request.nextUrl.pathname.startsWith(p));
  let response = NextResponse.next({ request });
  response.headers.set("x-robots-tag", "noindex, nofollow");
  response.headers.set("cache-control", "private, no-store");
  if (!url || !key) {
    if (isPublic) return response;
    return NextResponse.redirect(new URL("/admin/login?e=unconfigured", request.url));
  }

  const supabase = createServerClient(url, key, {
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
    return NextResponse.redirect(login);
  }
  return response;
}

export const config = { matcher: ["/admin", "/admin/:path*", "/account", "/account/:path*"] };

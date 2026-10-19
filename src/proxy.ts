import { NextResponse, type NextRequest } from "next/server";
import { isChildPath, isPregnancyPath } from "@/lib/app-mode";
import { readCookieSession } from "@/lib/supabase/cookie-session";
import { isSupabaseEnabled } from "@/lib/supabase/env";

function isFeaturePath(pathname: string) {
  return isPregnancyPath(pathname) || isChildPath(pathname);
}

/**
 * Gate feature routes with the cookie session only.
 * Do not call supabase.auth.getUser()/getSession() here: every RSC/prefetch
 * would hit /auth/v1/user and can race refresh_token on mobile.
 */
export async function proxy(request: NextRequest) {
  if (!isSupabaseEnabled()) return NextResponse.next();
  if (!isFeaturePath(request.nextUrl.pathname)) return NextResponse.next();

  const session = await readCookieSession({
    getAll: () => request.cookies.getAll(),
  });

  if (!session) {
    const home = request.nextUrl.clone();
    home.pathname = "/";
    home.search = "";
    home.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(home);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

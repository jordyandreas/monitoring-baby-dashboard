import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isChildPath, isPregnancyPath } from "@/lib/app-mode";
import { isSupabaseEnabled } from "@/lib/supabase/env";

function isFeaturePath(pathname: string) {
  return isPregnancyPath(pathname) || isChildPath(pathname);
}

export async function proxy(request: NextRequest) {
  if (!isSupabaseEnabled()) return NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  if (!data.user && isFeaturePath(request.nextUrl.pathname)) {
    const home = request.nextUrl.clone();
    home.pathname = "/";
    home.search = "";
    home.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(home);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

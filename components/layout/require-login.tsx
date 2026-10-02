"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";
import { isChildPath, isPregnancyPath } from "@/lib/app-mode";

function isFeaturePath(pathname: string) {
  return isPregnancyPath(pathname) || isChildPath(pathname);
}

/** Opening a feature URL while logged out returns home and asks for login. */
export function RequireLogin() {
  const pathname = usePathname();
  const router = useRouter();
  const { enabled, signedIn, authStatus, requestLogin } = useSupabase();

  useEffect(() => {
    if (!enabled || authStatus === "loading" || signedIn) return;
    if (!isFeaturePath(pathname)) return;
    requestLogin(pathname);
    router.replace("/");
  }, [authStatus, enabled, pathname, requestLogin, router, signedIn]);

  return null;
}

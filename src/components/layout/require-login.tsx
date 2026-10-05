"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";

function RequireLoginFromQuery() {
  const params = useSearchParams();
  const { signedIn, authStatus, requestLogin } = useSupabase();
  const next = params.get("next");

  useEffect(() => {
    if (!next || signedIn || authStatus === "loading") return;
    requestLogin(next);
  }, [authStatus, next, requestLogin, signedIn]);

  return null;
}

/** Feature routes are sent home by proxy. This only opens the login dialog. */
export function RequireLogin() {
  return (
    <Suspense fallback={null}>
      <RequireLoginFromQuery />
    </Suspense>
  );
}

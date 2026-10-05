"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";

/** Feature routes stay closed until the user has an email account. */
export function FeatureLink({ href, onClick, ...props }: ComponentProps<typeof Link>) {
  const { enabled, signedIn, authStatus, requestLogin } = useSupabase();
  const path = typeof href === "string" ? href : "";
  const locked = enabled && authStatus !== "loading" && !signedIn && path !== "/" && path !== "";

  return (
    <Link
      href={locked ? "/" : href}
      {...props}
      onClick={(event) => {
        if (!locked) {
          onClick?.(event);
          return;
        }
        event.preventDefault();
        requestLogin(path);
      }}
    />
  );
}

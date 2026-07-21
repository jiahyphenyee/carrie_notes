"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Consumes an implicit-flow session (access_token/refresh_token in the URL
 * fragment) directly, for links generated via the Supabase admin API rather
 * than a real emailed magic link. Fragments never reach the server, so this
 * has to run client-side -- /auth/callback only handles the PKCE ?code=
 * form a normal signInWithOtp() request produces.
 */
export default function TokenLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
    const params = new URLSearchParams(hash);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (!access_token || !refresh_token) {
      setError("This sign-in link is missing or invalid.");
      return;
    }

    createClient()
      .auth.setSession({ access_token, refresh_token })
      .then(({ error: sessionError }) => {
        if (sessionError) setError(sessionError.message);
        else router.replace("/dashboard");
      });
  }, [router]);

  if (error) {
    return (
      <main className="mx-auto max-w-md px-5 py-10 text-center">
        <p className="rounded-xl bg-rose-50 p-4 text-rose-800">{error}</p>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center text-stone-600">
      Signing you in…
    </main>
  );
}

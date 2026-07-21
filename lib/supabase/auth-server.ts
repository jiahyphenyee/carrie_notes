import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** A cookie-backed client for authenticated server components and route handlers. */
export async function createAuthServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server components cannot set cookies. Middleware refreshes sessions.
          }
        },
      },
    },
  );
}

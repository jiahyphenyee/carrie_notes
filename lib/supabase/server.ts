import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for API routes only. Never import this module into a
 * client component or expose its key to the browser.
 */
export function createServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

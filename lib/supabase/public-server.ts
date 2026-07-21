import { createClient } from "@supabase/supabase-js";

/**
 * Anonymous client for public caregiver reads. Only used to call
 * SECURITY DEFINER RPCs scoped by share_token (see get_shared_pet).
 */
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

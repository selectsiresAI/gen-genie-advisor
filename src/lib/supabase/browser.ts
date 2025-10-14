import { supabase } from "@/integrations/supabase/client";

/**
 * Returns the shared Supabase browser client.
 *
 * This wrapper mirrors the Next.js example API used across the app so the
 * same hook implementations can run in different environments.
 */
export function createClient() {
  return supabase;
}

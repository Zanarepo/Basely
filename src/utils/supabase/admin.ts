import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase Admin client that bypasses RLS.
 * Use ONLY in server actions where the action needs to read/write across
 * multiple rows that a single user's RLS policies may not cover
 * (e.g., CPM recalculation touching all project activities).
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  )
}

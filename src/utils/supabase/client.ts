import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  let customToken: string | undefined = undefined

  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(^|;)\s*zn_impersonation_jwt\s*=\s*([^;]+)/)
    if (match) {
      customToken = match[2]
    }
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    customToken ? {
      global: {
        headers: {
          Authorization: `Bearer ${customToken}`
        }
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    } : {}
  )
}

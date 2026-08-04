import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import * as jose from 'jose'

export async function createClient() {
  const cookieStore = await cookies()

  // Intercept Impersonation
  const impersonationCookie = cookieStore.get('zn_impersonation')
  let globalHeaders: HeadersInit | undefined = undefined

  if (impersonationCookie) {
    try {
      const data = JSON.parse(Buffer.from(impersonationCookie.value, 'base64').toString('utf-8'))
      const targetUserId = data.targetUserId

      // Sign a JWT spoofing the target user
      const secret = new TextEncoder().encode(process.env.NEXT_PUBLIC_SUPABASE_JWT_SECRET || process.env.SUPABASE_JWT_SECRET)
      
      const alg = 'HS256'
      const jwt = await new jose.SignJWT({
        role: 'authenticated',
        aud: 'authenticated',
        sub: targetUserId,
      })
        .setProtectedHeader({ alg, typ: 'JWT' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(secret)

      globalHeaders = {
        Authorization: `Bearer ${jwt}`
      }
    } catch (e) {
      console.error('Impersonation token error:', e)
    }
  }

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: globalHeaders ? { headers: globalHeaders } : undefined,
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method can be called from a Server Component
            // to refresh sessions, but it's safe to ignore errors here
            // if we are in a read-only request.
          }
        },
      },
    }
  )

  // STRUCTURAL BLOCK: Prevent destructive actions during impersonation
  if (impersonationCookie) {
    const originalFrom = client.from.bind(client)
    client.from = (table: string) => {
      const queryBuilder = originalFrom(table)
      queryBuilder.delete = () => {
        throw new Error('Destructive actions (DELETE) are structurally blocked during active impersonation sessions.')
      }
      return queryBuilder
    }
  }

  return client
}

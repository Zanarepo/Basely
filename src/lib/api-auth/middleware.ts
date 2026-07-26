import { createAdminClient } from '@/utils/supabase/admin'
import { headers } from 'next/headers'

// In a real environment, you'd use the Web Crypto API or Node's crypto
// to hash the received token and match it against the stored hash.
// For Next.js Edge Runtime compatibility, we use Web Crypto.
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(key)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

export interface ApiAuthContext {
  organizationId: string
  scope: 'read_only' | 'read_write'
  entityScope: string[]
  keyId: string
}

export async function authenticateApiRequest(): Promise<ApiAuthContext | Response> {
  const headersList = await headers()
  const authHeader = headersList.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) {
    return new Response(JSON.stringify({ error: 'Token missing' }), { status: 401 })
  }

  const tokenHash = await hashApiKey(token)
  
  // We use the admin client because public users shouldn't be able to query the api_keys table via RLS
  // (RLS only allows org admins to view them). API routes need to authenticate the key blindly.
  const supabase = createAdminClient()
  
  const { data: apiKey, error } = await supabase
    .from('api_keys')
    .select('id, organization_id, scope, entity_scope, revoked_at')
    .eq('key_hash', tokenHash)
    .single()

  if (error || !apiKey) {
    return new Response(JSON.stringify({ error: 'Invalid API Key' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  if (apiKey.revoked_at) {
    return new Response(JSON.stringify({ error: 'API Key has been revoked' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
  }

  // Optionally update last_used_at in the background (fire and forget)
  supabase.rpc('touch_api_key', { key_id: apiKey.id }).then(() => {})
  
  return {
    organizationId: apiKey.organization_id,
    scope: apiKey.scope,
    entityScope: apiKey.entity_scope,
    keyId: apiKey.id
  }
}

// Helper to check if a specific entity is allowed for this key
export function requireEntityScope(authContext: ApiAuthContext, entity: string): Response | null {
  // If entityScope is empty array, it might mean "all", but let's be explicit.
  // Actually, let's treat '*' or the specific entity as allowed.
  if (!authContext.entityScope.includes('*') && !authContext.entityScope.includes(entity)) {
    return new Response(JSON.stringify({ error: `Insufficient scope. Missing access to entity: ${entity}` }), { status: 403, headers: { 'Content-Type': 'application/json' } })
  }
  return null
}

export function requireWriteScope(authContext: ApiAuthContext): Response | null {
  if (authContext.scope !== 'read_write') {
    return new Response(JSON.stringify({ error: 'Insufficient scope. This endpoint requires read_write access.' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
  }
  return null
}

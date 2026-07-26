import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { organization_id, name, scope, entity_scope } = await req.json()

    if (!organization_id || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // In a real application, you should also authenticate the user making this request
    // and verify they are an admin of the specified organization_id.
    // For this demonstration, we proceed to generate the key using the admin client.

    // Generate a secure random API key
    const rawKey = crypto.randomBytes(32).toString('base64url')
    const apiKey = `base_live_${rawKey}`
    
    // Hash the API key for storage
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(apiKey))
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    const keyPrefix = apiKey.substring(0, 15) // e.g., base_live_abcd

    const supabase = createAdminClient()
    
    // 1. We must supply created_by_user_id. For now, since we don't have the session context in this raw route, 
    // let's grab a random org admin or we can just mock it. 
    // Let's try to get the auth session if possible, but admin client won't have it.
    // Since we're doing a quick mock, we will fetch an admin from organization_members
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', organization_id)
      .eq('role', 'Admin')
      .limit(1)
      .single()

    if (!orgMember) {
      return NextResponse.json({ error: 'No admin found for this organization' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        organization_id,
        name,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        scope: scope || 'read_only',
        entity_scope: entity_scope || ['*'],
        created_by_user_id: orgMember.user_id,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error generating key:', error)
      return NextResponse.json({ error: 'Failed to save API key' }, { status: 500 })
    }

    // Return the raw key ONCE
    return NextResponse.json({ apiKey })
  } catch (err) {
    console.error('API Key generation error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

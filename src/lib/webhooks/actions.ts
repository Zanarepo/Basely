'use server'

import { createClient } from '@/utils/supabase/server'

export async function sendTestWebhook(webhookId: string) {
  try {
    const supabase = await createClient()
    
    const { data: wh, error } = await supabase
      .from('webhook_subscriptions')
      .select('*')
      .eq('id', webhookId)
      .single()

    if (error || !wh) {
      return { ok: false, error: 'Webhook endpoint not found' }
    }

    const testPayload = JSON.stringify({
      event: wh.event_type,
      timestamp: new Date().toISOString(),
      data: {
        reference_entity_type: 'test_item',
        reference_entity_id: 'test-123-abc',
        title: `Sample Test Item for ${wh.event_type}`,
        description: 'This is a live real-time test event triggered directly from your Basely Developers setting!',
        status: 'Triggered',
        project_id: null,
        content_summary: `Test event dispatched for ${wh.event_type}`
      }
    })

    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(wh.signing_secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(testPayload))
    const signatureArray = Array.from(new Uint8Array(signatureBuffer))
    const signature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('')

    const res = await fetch(wh.target_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': `sha256=${signature}`
      },
      body: testPayload
    })

    if (!res.ok) {
      return { ok: false, status: res.status, error: `Endpoint returned HTTP status ${res.status}: ${res.statusText}` }
    }

    return { ok: true, status: res.status }
  } catch (err: any) {
    console.error('Test webhook error:', err)
    return { ok: false, error: err.message || 'Failed to reach external URL' }
  }
}

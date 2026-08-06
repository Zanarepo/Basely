import { NextResponse } from 'next/server'
import { syncMilestonesToGoogleCalendar } from '@/lib/integrations/calendar-logic'
import { createClient } from '@/utils/supabase/server'

import { createClient as createAdminClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  const cronSecret = process.env.CRON_SECRET

  if (
    !cronSecret ||
    (authHeader !== `Bearer ${cronSecret}` && token !== cronSecret)
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use Service Role Key to bypass RLS since cron jobs have no user session
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Find all active calendar connections
  const { data: connections, error } = await supabaseAdmin
    .from('calendar_connections')
    .select('*')

  if (error || !connections) {
    console.error('Failed to fetch connections', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  const results = []

  for (const conn of connections) {
    if (!conn.synced_project_ids || conn.synced_project_ids.length === 0) {
      continue
    }

    if (conn.provider === 'google') {
      for (const projectId of conn.synced_project_ids) {
        const result = await syncMilestonesToGoogleCalendar(conn.id, projectId, supabaseAdmin)
        results.push({ connectionId: conn.id, projectId, result })
      }
    }
  }

  return NextResponse.json({ ok: true, sync_count: results.length, results })
}

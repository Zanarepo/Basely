import { NextResponse } from 'next/server'
import { syncMilestonesToGoogleCalendar } from '@/lib/integrations/calendar-logic'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // In production, you would want to secure this endpoint using a secret 
  // passed via Authorization header (e.g., from Vercel Cron).
  // For now, we leave it open for local testing.

  const supabase = await createClient()

  // Find all active calendar connections
  const { data: connections, error } = await supabase
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
        const result = await syncMilestonesToGoogleCalendar(conn.id, projectId)
        results.push({ connectionId: conn.id, projectId, result })
      }
    }
  }

  return NextResponse.json({ ok: true, sync_count: results.length, results })
}

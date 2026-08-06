import { NextResponse } from 'next/server'
import { syncMilestonesToGoogleCalendar } from '@/lib/integrations/calendar-logic'
import { createClient } from '@/utils/supabase/server'

import { createClient as createAdminClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  let isAdminCron = false
  const supabase = await createClient()
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && (authHeader === `Bearer ${cronSecret}` || token === cronSecret)) {
    isAdminCron = true
  }

  // If not a cron job, verify they have a valid user session
  if (!isAdminCron) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // Use Service Role Key to bypass RLS if it's the automated cron job
  // Otherwise use the regular user client (which safely enforces RLS)
  const activeClient = isAdminCron 
    ? createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!)
    : supabase

  // Find active calendar connections (Cron sees all, User only sees their own)
  const { data: connections, error } = await activeClient
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
        const result = await syncMilestonesToGoogleCalendar(conn.id, projectId, activeClient)
        results.push({ connectionId: conn.id, projectId, result })
      }
    }
  }

  return NextResponse.json({ ok: true, sync_count: results.length, results })
}

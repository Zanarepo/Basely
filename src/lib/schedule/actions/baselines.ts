'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import type { ActionResponse } from './types'

/**
 * Freezes the current schedule dates as a named baseline.
 */
export async function saveBaseline(projectId: string, name: string): Promise<ActionResponse> {
  const supabase = createAdminClient()

  // 1. Create baseline record
  const { data: bLine, error: baseErr } = await supabase
    .from('baselines')
    .insert({ project_id: projectId, name })
    .select('id')
    .single()

  if (baseErr || !bLine) {
    return { ok: false, error: baseErr?.message ?? 'Could not create baseline record' }
  }

  // 2. Fetch current activities
  const { data: acts } = await supabase
    .from('activities')
    .select('id, es, ef, duration')
    .eq('project_id', projectId)

  if (!acts || acts.length === 0) {
    return { ok: true }
  }

  // 3. Save snapshots
  const snapshots = acts.map(a => ({
    baseline_id: bLine.id,
    activity_id: a.id,
    baseline_start: a.es,
    baseline_finish: a.ef,
    baseline_duration: Number(a.duration)
  }))

  const { error: snapErr } = await supabase
    .from('baseline_activity_snapshots')
    .insert(snapshots)

  if (snapErr) {
    return { ok: false, error: snapErr.message }
  }

  return { ok: true }
}

/**
 * Fetches the variance between the current schedule and a baseline.
 */
export async function getScheduleVariance(projectId: string, baselineId: string): Promise<ActionResponse> {
  const supabase = createAdminClient()

  const { data: snaps, error: snapErr } = await supabase
    .from('baseline_activity_snapshots')
    .select('*')
    .eq('baseline_id', baselineId)

  if (snapErr) {
    return { ok: false, error: snapErr.message }
  }

  return { ok: true, data: snaps }
}

'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { recalculateSchedule } from './recalculate'
import type { ActionResponse } from './types'
import { logProjectActivity } from '@/lib/projects/activity-actions'

/**
 * Creates an activity dependency record.
 * Automatically cycle checks and rolls back if a loop is detected.
 */
export async function createDependency(
  projectId: string,
  predecessorId: string,
  successorId: string,
  type: 'FS' | 'SS' | 'FF' | 'SF' = 'FS',
  lagDays: number = 0
): Promise<ActionResponse> {
  const supabase = createAdminClient()

  // Insert dependency record
  const { data: dep, error: insertErr } = await supabase
    .from('dependencies')
    .insert({
      project_id: projectId,
      predecessor_id: predecessorId,
      successor_id: successorId,
      type,
      lag_days: lagDays
    })
    .select('id')
    .single()

  if (insertErr || !dep) {
    return { ok: false, error: insertErr?.message ?? 'Could not create dependency' }
  }

  // Recalculate schedule to check for cycles
  const recalcResult = await recalculateSchedule(projectId)
  
  if (!recalcResult.ok) {
    // Cycle detected or other error -> Rollback dependency creation
    await supabase
      .from('dependencies')
      .delete()
      .eq('id', dep.id)
    
    return { ok: false, error: recalcResult.error }
  }

  const { data } = await supabase.from('activities').select('name').eq('id', successorId).single()
  if (data) {
    await logProjectActivity(projectId, 'activity', successorId, 'updated', { name: data.name, field: 'dependency_added' })
  }

  return { ok: true }
}

/**
 * Deletes a dependency and updates dates.
 */
export async function deleteDependency(projectId: string, dependencyId: string): Promise<ActionResponse> {
  const supabase = createAdminClient()

  // Fetch successor to log
  const { data: dep } = await supabase.from('dependencies').select('successor_id').eq('id', dependencyId).single()

  const { error: delErr } = await supabase
    .from('dependencies')
    .delete()
    .eq('id', dependencyId)

  if (delErr) {
    return { ok: false, error: delErr.message }
  }

  if (dep?.successor_id) {
    const { data } = await supabase.from('activities').select('name').eq('id', dep.successor_id).single()
    if (data) {
      await logProjectActivity(projectId, 'activity', dep.successor_id, 'updated', { name: data.name, field: 'dependency_removed' })
    }
  }

  return recalculateSchedule(projectId)
}

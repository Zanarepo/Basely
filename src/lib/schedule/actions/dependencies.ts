'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { recalculateSchedule } from './recalculate'
import type { ActionResponse } from './types'

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

  return { ok: true }
}

/**
 * Deletes a dependency and updates dates.
 */
export async function deleteDependency(projectId: string, dependencyId: string): Promise<ActionResponse> {
  const supabase = createAdminClient()

  const { error: delErr } = await supabase
    .from('dependencies')
    .delete()
    .eq('id', dependencyId)

  if (delErr) {
    return { ok: false, error: delErr.message }
  }

  return recalculateSchedule(projectId)
}

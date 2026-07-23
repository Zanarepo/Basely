'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { recalculateSchedule } from './recalculate'
import type { ActionResponse } from './types'
import { logProjectActivity } from '@/lib/projects/activity-actions'

/**
 * Updates an activity's duration and recalculates schedule.
 */
export async function updateActivityDuration(
  projectId: string,
  activityId: string,
  duration: number
): Promise<ActionResponse> {
  const supabase = createAdminClient()

  const { error: updErr } = await supabase
    .from('activities')
    .update({ 
      duration, 
      type: duration === 0 ? 'Milestone' : 'Task',
      updated_at: new Date().toISOString() 
    })
    .eq('id', activityId)

  if (updErr) {
    return { ok: false, error: updErr.message }
  }

  // Fetch the name for logging
  const { data } = await supabase.from('activities').select('name').eq('id', activityId).single()
  if (data) {
    await logProjectActivity(projectId, 'activity', activityId, 'updated', { name: data.name, field: 'duration' })
  }

  return recalculateSchedule(projectId)
}

/**
 * Updates an activity's constraint settings and recalculates schedule.
 */
export async function updateActivityConstraint(
  projectId: string,
  activityId: string,
  constraintType: 'ASAP' | 'Must Start On' | 'Must Finish On' | 'Start No Earlier Than' | 'Finish No Later Than',
  constraintDate: string | null
): Promise<ActionResponse> {
  const supabase = createAdminClient()

  const { error: updErr } = await supabase
    .from('activities')
    .update({ 
      constraint_type: constraintType, 
      constraint_date: constraintDate, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', activityId)

  if (updErr) {
    return { ok: false, error: updErr.message }
  }

  const { data } = await supabase.from('activities').select('name').eq('id', activityId).single()
  if (data) {
    await logProjectActivity(projectId, 'activity', activityId, 'updated', { name: data.name, field: 'constraint' })
  }

  return recalculateSchedule(projectId)
}

/**
 * Updates scheduling attributes (duration, constraints) and predecessor dependencies in a single pass.
 */
export async function updateActivityScheduling(
  projectId: string,
  activityId: string,
  updates: {
    duration: number
    constraintType: 'ASAP' | 'Must Start On' | 'Must Finish On' | 'Start No Earlier Than' | 'Finish No Later Than'
    constraintDate: string | null
    predecessors: { predecessorId: string; type: 'FS' | 'SS' | 'FF' | 'SF'; lagDays: number }[]
  }
): Promise<ActionResponse> {
  const supabase = createAdminClient()

  // 1. Update activity fields
  const { error: actErr } = await supabase
    .from('activities')
    .update({
      duration: updates.duration,
      type: updates.duration === 0 ? 'Milestone' : 'Task',
      constraint_type: updates.constraintType,
      constraint_date: updates.constraintDate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', activityId)

  if (actErr) {
    return { ok: false, error: actErr.message }
  }

  // 2. Fetch current predecessors to support rollback if cycle calculation fails
  const { data: oldDeps } = await supabase
    .from('dependencies')
    .select('*')
    .eq('successor_id', activityId)

  // Delete existing predecessors
  const { error: delErr } = await supabase
    .from('dependencies')
    .delete()
    .eq('successor_id', activityId)

  if (delErr) {
    return { ok: false, error: delErr.message }
  }

  // Insert new predecessors
  if (updates.predecessors.length > 0) {
    const insertData = updates.predecessors.map((p) => ({
      project_id: projectId,
      predecessor_id: p.predecessorId,
      successor_id: activityId,
      type: p.type,
      lag_days: p.lagDays,
    }))

    const { error: insErr } = await supabase
      .from('dependencies')
      .insert(insertData)

    if (insErr) {
      // Rollback deletions
      if (oldDeps && oldDeps.length > 0) {
        await supabase.from('dependencies').insert(oldDeps.map(o => ({
          project_id: o.project_id,
          predecessor_id: o.predecessor_id,
          successor_id: o.successor_id,
          type: o.type,
          lag_days: o.lag_days
        })))
      }
      return { ok: false, error: insErr.message }
    }
  }

  // 3. Trigger recalculation
  const recalcRes = await recalculateSchedule(projectId)
  
  if (!recalcRes.ok) {
    // Rollback dependency updates if cycle or calculation error is encountered
    await supabase.from('dependencies').delete().eq('successor_id', activityId)
    if (oldDeps && oldDeps.length > 0) {
      await supabase.from('dependencies').insert(oldDeps.map(o => ({
        project_id: o.project_id,
        predecessor_id: o.predecessor_id,
        successor_id: o.successor_id,
        type: o.type,
        lag_days: o.lag_days
      })))
    }
    // Re-run recalculation with original state to recover
    await recalculateSchedule(projectId)
    
    return { ok: false, error: recalcRes.error }
  }

  const { data } = await supabase.from('activities').select('name').eq('id', activityId).single()
  if (data) {
    await logProjectActivity(projectId, 'activity', activityId, 'updated', { name: data.name, field: 'scheduling' })
  }

  return { ok: true }
}

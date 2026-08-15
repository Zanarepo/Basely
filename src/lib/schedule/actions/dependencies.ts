'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
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

  logProjectActivity(projectId, 'activity', successorId, 'updated', { field: 'dependency_added' }).catch(() => {})
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

  logProjectActivity(projectId, 'activity', dependencyId, 'updated', { field: 'dependency_removed' }).catch(() => {})
  return recalculateSchedule(projectId)
}

export async function autoGenerateProjectDependenciesWithAi(projectId: string): Promise<ActionResponse> {
  try {
    const supabase = createAdminClient()
    const { data: rawActivities } = await supabase
      .from('activities')
      .select('id, name, duration, wbs_element_id, wbs_elements(sort_order)')
      .eq('project_id', projectId)

    if (!rawActivities || rawActivities.length < 2) {
      return { ok: false, error: 'At least 2 activities are required to generate dependencies.' }
    }

    // Sort activities by WBS element sort_order ascending
    const activities = [...rawActivities].sort((a: any, b: any) => {
      const sortA = a.wbs_elements?.sort_order ?? 9999
      const sortB = b.wbs_elements?.sort_order ?? 9999
      return sortA - sortB
    })

    const keyToIdMap = new Map<string, string>()
    const activityPrompts = activities.map((act, index) => {
      const key = `act_${index + 1}`
      keyToIdMap.set(key, act.id)
      return `- Key: ${key} | Title: ${act.name}`
    })

    const { generateStructuredJson } = await import('@/lib/ai/ai-provider-router')

    const result = await generateStructuredJson<{
      dependencies: Array<{
        predecessor_key: string
        successor_key: string
        type: 'FS' | 'SS' | 'FF' | 'SF'
        lag_days?: number
      }>
    }>({
      systemPrompt: `You are an expert Lead CPM Schedule Analyst. Analyze the provided project activities (ordered in execution sequence) and map out logical predecessor dependencies.

CRITICAL SCHEDULING RULES:
1. FORWARD EXECUTION ONLY: "predecessor_key" MUST execute BEFORE "successor_key". Predecessors must ALWAYS have a smaller index number than successors (e.g. act_1 -> act_2, act_2 -> act_3). NEVER make a later task (like act_5) a predecessor to an earlier task (like act_1).
2. MULTIPLE PREDECESSORS: Tasks CAN and SHOULD have MULTIPLE predecessors when they depend on multiple earlier tasks (e.g. act_4 depends on BOTH act_2 AND act_3).
3. RELATIONSHIP TYPE: Default relationship type is "FS" (Finish-to-Start). Use "SS", "FF", "SF" where logically appropriate.

Output strictly a JSON object:
{
  "dependencies": [
    {
      "predecessor_key": "act_1",
      "successor_key": "act_2",
      "type": "FS",
      "lag_days": 0
    }
  ]
}`,
      userPrompt: `Activities in Execution Sequence:\n${activityPrompts.join('\n')}`
    })

    // Wipe stale or bad dependencies for this project before re-linking
    await supabase.from('dependencies').delete().eq('project_id', projectId)

    let insertedCount = 0
    if (result.dependencies && result.dependencies.length > 0) {
      for (const dep of result.dependencies) {
        const predId = keyToIdMap.get(dep.predecessor_key)
        const succId = keyToIdMap.get(dep.successor_key)
        if (predId && succId && predId !== succId) {
          const { error: insErr } = await supabase.from('dependencies').insert({
            project_id: projectId,
            predecessor_id: predId,
            successor_id: succId,
            type: ['FS', 'SS', 'FF', 'SF'].includes(dep.type) ? dep.type : 'FS',
            lag_days: typeof dep.lag_days === 'number' ? dep.lag_days : 0
          })
          if (!insErr) insertedCount++
        }
      }
    }

    // Fallback: If no dependencies were inserted, link activities sequentially in order of execution
    if (insertedCount === 0 && activities.length >= 2) {
      for (let i = 1; i < activities.length; i++) {
        const prev = activities[i - 1]
        const curr = activities[i]
        await supabase.from('dependencies').insert({
          project_id: projectId,
          predecessor_id: prev.id,
          successor_id: curr.id,
          type: 'FS',
          lag_days: 0
        })
      }
    }

    await recalculateSchedule(projectId)
    revalidatePath(`/dashboard/projects/${projectId}`)
    return { ok: true }
  } catch (err: any) {
    console.error('autoGenerateProjectDependenciesWithAi failed:', err)
    return { ok: false, error: err?.message || 'Failed to auto-generate dependencies' }
  }
}


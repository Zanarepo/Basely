'use server'

import { createClient } from '@/utils/supabase/server'
import { logProjectActivity } from '@/lib/projects/activity-actions'
import { checkProjectItemLimit } from '@/lib/organizations/tier-access'
import type { Iteration } from './types'

export async function createIteration(
  projectId: string,
  name: string,
  sequenceNumber: number,
  startDate: string,
  endDate: string,
  labelOverride?: 'sprint' | 'phase' | null
): Promise<{ ok: boolean; error?: string; limitKey?: string; maxLimit?: number; iteration?: Iteration }> {
  const limitCheck = await checkProjectItemLimit(projectId, 'max_sprints')
  if (!limitCheck.allowed) {
    return {
      ok: false,
      error: `Sprint limit reached (${limitCheck.maxLimit}). Upgrade your plan to plan unlimited Sprints.`,
      limitKey: limitCheck.limitKey,
      maxLimit: limitCheck.maxLimit,
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('iterations')
    .insert({
      project_id: projectId,
      name: name.trim(),
      sequence_number: sequenceNumber,
      start_date: startDate,
      end_date: endDate,
      label_override: labelOverride || null
    })
    .select('*')
    .single()

  if (error) return { ok: false, error: error.message }

  await logProjectActivity(projectId, 'iteration' as any, data.id, 'created', { name: data.name })
  return {
    ok: true,
    iteration: {
      id: data.id,
      projectId: data.project_id,
      name: data.name,
      sequenceNumber: data.sequence_number,
      startDate: data.start_date,
      endDate: data.end_date,
      labelOverride: data.label_override || null,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      taggedWbsCount: 0,
      taggedActivityCount: 0
    }
  }
}

export async function updateIteration(
  id: string,
  projectId: string,
  name: string,
  sequenceNumber: number,
  startDate: string,
  endDate: string,
  labelOverride?: 'sprint' | 'phase' | null
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('iterations')
    .update({
      name: name.trim(),
      sequence_number: sequenceNumber,
      start_date: startDate,
      end_date: endDate,
      label_override: labelOverride || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }
  await logProjectActivity(projectId, 'iteration' as any, id, 'updated', { name })
  return { ok: true }
}

export async function deleteIteration(id: string, projectId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('iterations')
    .delete()
    .eq('id', id)

  if (error) return { ok: false, error: error.message }
  await logProjectActivity(projectId, 'iteration' as any, id, 'deleted', {})
  return { ok: true }
}

export async function tagWorkItemToIteration(
  entityType: 'wbs_element' | 'activity',
  entityId: string,
  iterationId: string | null,
  projectId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const table = entityType === 'wbs_element' ? 'wbs_elements' : 'activities'
  
  const { error } = await supabase
    .from(table)
    .update({ iteration_id: iterationId })
    .eq('id', entityId)
    .eq('project_id', projectId)

  if (error) return { ok: false, error: error.message }
  await logProjectActivity(projectId, entityType as any, entityId, 'updated', { iteration_id: iterationId })
  return { ok: true }
}

export async function tagEpicToIteration(
  epicId: string,
  iterationId: string | null,
  projectId: string
): Promise<{ ok: boolean; count?: number; error?: string }> {
  try {
    const supabase = await createClient()

    // 1. Tag parent Epic
    const { error: epicErr } = await supabase
      .from('wbs_elements')
      .update({ iteration_id: iterationId })
      .eq('id', epicId)
      .eq('project_id', projectId)

    if (epicErr) return { ok: false, error: epicErr.message }

    // 2. Fetch and tag all child WBS elements
    const { data: children, error: childErr } = await supabase
      .from('wbs_elements')
      .select('id')
      .eq('parent_id', epicId)
      .eq('project_id', projectId)

    let updatedCount = 1

    if (!childErr && children && children.length > 0) {
      const childIds = children.map(c => c.id)
      const { error: batchErr } = await supabase
        .from('wbs_elements')
        .update({ iteration_id: iterationId })
        .in('id', childIds)

      if (!batchErr) {
        updatedCount += childIds.length
        // Also tag associated activities
        await supabase
          .from('activities')
          .update({ iteration_id: iterationId })
          .in('wbs_element_id', childIds)
      }
    }

    await logProjectActivity(projectId, 'wbs_element' as any, epicId, 'updated', {
      action: 'tag_epic_to_iteration',
      iteration_id: iterationId,
      items_tagged: updatedCount
    })

    return { ok: true, count: updatedCount }
  } catch (err: any) {
    console.error('tagEpicToIteration error:', err)
    return { ok: false, error: err.message || 'Failed to tag epic to iteration' }
  }
}

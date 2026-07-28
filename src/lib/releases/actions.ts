'use server'

import { createClient } from '@/utils/supabase/server'
import { logProjectActivity } from '@/lib/projects/activity-actions'
import { dispatchNotification } from '@/lib/notifications/actions'
import type { Iteration, Release, ReleaseStatus, ReleaseExitCriterion, ReleaseManualScope, ReleaseScopeItem, ReleaseReadinessItem, ReleaseDeploymentPlan, ReleaseRollbackPlan } from './types'

export async function fetchProjectReleasesData(projectId: string): Promise<{
  ok: boolean
  error?: string
  iterations?: Iteration[]
  releases?: Release[]
  scopeItemsMap?: Record<string, ReleaseScopeItem[]>
  availableWorkItems?: { id: string; type: 'wbs_element' | 'activity'; title: string; code?: string; iterationId?: string | null }[]
}> {
  try {
    const supabase = await createClient()

    // Fetch iterations
    const { data: rawIterations, error: iterErr } = await supabase
      .from('iterations')
      .select('*')
      .eq('project_id', projectId)
      .order('sequence_number', { ascending: true })

    if (iterErr) {
      // If tables don't exist yet (before migration runs), gracefully fallback to empty lists
      if (iterErr.code === '42P01' || iterErr.message?.includes('does not exist')) {
        return { ok: true, iterations: [], releases: [], scopeItemsMap: {}, availableWorkItems: [] }
      }
      return { ok: false, error: iterErr.message }
    }

    // Fetch releases
    const { data: rawReleases, error: relErr } = await supabase
      .from('releases')
      .select('*')
      .eq('project_id', projectId)
      .order('sequence_number', { ascending: true })

    if (relErr) return { ok: false, error: relErr.message }

    const releaseIds = (rawReleases || []).map(r => r.id)

    // Fetch join table release_iterations
    const { data: rawRelIters } = releaseIds.length > 0 ? await supabase
      .from('release_iterations')
      .select('release_id, iteration_id')
      .in('release_id', releaseIds) : { data: [] }

    // Fetch release exit criteria
    const { data: rawCriteria } = releaseIds.length > 0 ? await supabase
      .from('release_exit_criteria')
      .select('*')
      .in('release_id', releaseIds)
      .order('created_at', { ascending: true }) : { data: [] }

    // Fetch manual scope overrides
    const { data: rawManualScope } = releaseIds.length > 0 ? await supabase
      .from('release_manual_scope')
      .select('*')
      .in('release_id', releaseIds)
      .order('created_at', { ascending: true }) : { data: [] }

    // Fetch readiness items
    const { data: rawReadinessItems } = releaseIds.length > 0 ? await supabase
      .from('release_readiness_items')
      .select('*')
      .in('release_id', releaseIds)
      .order('created_at', { ascending: true }) : { data: [] }

    // Fetch deployment plans
    const { data: rawDeploymentPlans } = releaseIds.length > 0 ? await supabase
      .from('release_deployment_plans')
      .select('*')
      .in('release_id', releaseIds)
      .order('sort_order', { ascending: true }) : { data: [] }

    // Fetch rollback plans
    const { data: rawRollbackPlans } = releaseIds.length > 0 ? await supabase
      .from('release_rollback_plans')
      .select('*')
      .in('release_id', releaseIds)
      .order('sort_order', { ascending: true }) : { data: [] }

    // Fetch WBS items and Activities for scope computation and item tagging count
    const { data: rawWbs } = await supabase
      .from('wbs_elements')
      .select('id, name, code, iteration_id')
      .eq('project_id', projectId)

    const { data: rawActivities } = await supabase
      .from('activities')
      .select('id, name, wbs_element_id, iteration_id')
      .eq('project_id', projectId)

    const wbsMap = new Map((rawWbs || []).map(w => [w.id, w]))
    const iterMap = new Map((rawIterations || []).map(i => [i.id, {
      id: i.id,
      projectId: i.project_id,
      name: i.name,
      sequenceNumber: i.sequence_number,
      startDate: i.start_date,
      endDate: i.end_date,
      labelOverride: i.label_override || null,
      createdAt: i.created_at,
      updatedAt: i.updated_at,
      taggedWbsCount: (rawWbs || []).filter(w => w.iteration_id === i.id).length,
      taggedActivityCount: (rawActivities || []).filter(a => a.iteration_id === i.id).length,
    } as Iteration]))

    const iterations = Array.from(iterMap.values())

    // Build available work items for tagging/adding to releases
    const availableWorkItems = [
      ...(rawWbs || []).map(w => ({
        id: w.id,
        type: 'wbs_element' as const,
        title: w.name,
        code: w.code,
        iterationId: w.iteration_id || null
      })),
      ...(rawActivities || []).map(a => {
        const wbs = wbsMap.get(a.wbs_element_id)
        return {
          id: a.id,
          type: 'activity' as const,
          title: a.name,
          code: wbs ? `${wbs.code} (Activity)` : 'Activity',
          iterationId: a.iteration_id || null
        }
      })
    ]

    const scopeItemsMap: Record<string, ReleaseScopeItem[]> = {}

    const releases: Release[] = (rawReleases || []).map(r => {
      const linkedIterationIds = (rawRelIters || [])
        .filter(ri => ri.release_id === r.id)
        .map(ri => ri.iteration_id)
      
      const linkedIterations = linkedIterationIds
        .map(id => iterMap.get(id))
        .filter(Boolean) as Iteration[]

      const criteria: ReleaseExitCriterion[] = (rawCriteria || [])
        .filter(c => c.release_id === r.id)
        .map(c => ({
          id: c.id,
          releaseId: c.release_id,
          criterionText: c.criterion_text,
          isMet: c.is_met,
          createdAt: c.created_at
        }))

      const manualScope: ReleaseManualScope[] = (rawManualScope || [])
        .filter(m => m.release_id === r.id)
        .map(m => ({
          id: m.id,
          releaseId: m.release_id,
          entityType: m.entity_type as any,
          entityId: m.entity_id || null,
          title: m.title,
          action: m.action as 'added' | 'excluded',
          notes: m.notes || null,
          createdAt: m.created_at
        }))

      // Compute Scope Union for this release
      const excludedEntityIds = new Set(manualScope.filter(m => m.action === 'excluded' && m.entityId).map(m => m.entityId))
      const autoScopeItems: ReleaseScopeItem[] = []

      linkedIterationIds.forEach(iterId => {
        const iterObj = iterMap.get(iterId)
        const iterName = iterObj ? iterObj.name : undefined

        // Tagged WBS
        ;(rawWbs || []).filter(w => w.iteration_id === iterId).forEach(w => {
          if (!excludedEntityIds.has(w.id)) {
            autoScopeItems.push({
              id: `wbs_${w.id}`,
              entityId: w.id,
              entityType: 'wbs_element',
              title: w.name,
              code: w.code,
              iterationName: iterName,
              iterationId: iterId,
              source: 'auto_derived'
            })
          }
        })

        // Tagged Activities
        ;(rawActivities || []).filter(a => a.iteration_id === iterId).forEach(a => {
          if (!excludedEntityIds.has(a.id)) {
            const wbs = wbsMap.get(a.wbs_element_id)
            autoScopeItems.push({
              id: `act_${a.id}`,
              entityId: a.id,
              entityType: 'activity',
              title: a.name,
              code: wbs ? wbs.code : undefined,
              iterationName: iterName,
              iterationId: iterId,
              source: 'auto_derived'
            })
          }
        })
      })

      // Add manual overrides & excluded entries to scope map
      const manualItems: ReleaseScopeItem[] = manualScope.map(m => ({
        id: `man_${m.id}`,
        entityId: m.entityId || m.id,
        entityType: m.entityType,
        title: m.title,
        source: m.action === 'added' ? 'manual_override' : 'excluded',
        notes: m.notes || undefined
      }))

      scopeItemsMap[r.id] = [...autoScopeItems, ...manualItems]

      const readinessItems: ReleaseReadinessItem[] = (rawReadinessItems || [])
        .filter(r_item => r_item.release_id === r.id)
        .map(r_item => ({
          id: r_item.id,
          releaseId: r_item.release_id,
          category: r_item.category,
          itemText: r_item.item_text,
          isChecked: r_item.is_checked,
          checkedByUserId: r_item.checked_by_user_id,
          checkedAt: r_item.checked_at,
          createdAt: r_item.created_at
        }))

      const deploymentPlans: ReleaseDeploymentPlan[] = (rawDeploymentPlans || [])
        .filter(dp => dp.release_id === r.id)
        .map(dp => ({
          id: dp.id,
          releaseId: dp.release_id,
          phase: dp.phase,
          stepText: dp.step_text,
          isCompleted: dp.is_completed,
          completedByUserId: dp.completed_by_user_id,
          completedAt: dp.completed_at,
          createdAt: dp.created_at,
          sortOrder: dp.sort_order
        }))

      const rollbackPlans: ReleaseRollbackPlan[] = (rawRollbackPlans || [])
        .filter(rp => rp.release_id === r.id)
        .map(rp => ({
          id: rp.id,
          releaseId: rp.release_id,
          stepText: rp.step_text,
          isCompleted: rp.is_completed,
          completedByUserId: rp.completed_by_user_id,
          completedAt: rp.completed_at,
          createdAt: rp.created_at,
          sortOrder: rp.sort_order
        }))

      return {
        id: r.id,
        projectId: r.project_id,
        name: r.name,
        objective: r.objective || null,
        sequenceNumber: r.sequence_number,
        status: r.status as ReleaseStatus,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        iterationIds: linkedIterationIds,
        iterations: linkedIterations,
        exitCriteria: criteria,
        manualScope,
        readinessItems,
        deploymentPlans,
        rollbackPlans
      }
    })

    return { ok: true, iterations, releases, scopeItemsMap, availableWorkItems }
  } catch (err: any) {
    console.error('fetchProjectReleasesData error:', err)
    return { ok: false, error: err.message || 'Unknown error' }
  }
}

export async function createIteration(
  projectId: string,
  name: string,
  sequenceNumber: number,
  startDate: string,
  endDate: string,
  labelOverride?: 'sprint' | 'phase' | null
): Promise<{ ok: boolean; error?: string; iteration?: Iteration }> {
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

export async function createRelease(
  projectId: string,
  name: string,
  objective: string | null,
  sequenceNumber: number,
  status: ReleaseStatus,
  iterationIds: string[] = [],
  exitCriteriaTexts: string[] = []
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: release, error: relErr } = await supabase
    .from('releases')
    .insert({
      project_id: projectId,
      name: name.trim(),
      objective: objective ? objective.trim() : null,
      sequence_number: sequenceNumber,
      status: status || 'planned'
    })
    .select('id, name')
    .single()

  if (relErr) return { ok: false, error: relErr.message }

  // Insert linked iterations
  if (iterationIds.length > 0) {
    const joinData = iterationIds.map(iterId => ({
      release_id: release.id,
      iteration_id: iterId
    }))
    await supabase.from('release_iterations').insert(joinData)
  }

  // Insert initial exit criteria
  if (exitCriteriaTexts.length > 0) {
    const criteriaData = exitCriteriaTexts.filter(t => t.trim().length > 0).map(t => ({
      release_id: release.id,
      criterion_text: t.trim(),
      is_met: false
    }))
    if (criteriaData.length > 0) {
      await supabase.from('release_exit_criteria').insert(criteriaData)
    }
  }

  await logProjectActivity(projectId, 'release' as any, release.id, 'created', { name: release.name, status })

  const { data: authData } = await supabase.auth.getUser()
  if (authData?.user?.id) {
    await dispatchNotification({
      userId: authData.user.id,
      projectId,
      triggerType: 'schedule_change',
      referenceEntityType: 'schedule',
      referenceEntityId: release.id,
      contentSummary: `Created new release plan: "${release.name}" (${status})`
    }).catch(err => console.error('Notification failed:', err))
  }

  return { ok: true }
}

export async function updateRelease(
  id: string,
  projectId: string,
  name: string,
  objective: string | null,
  sequenceNumber: number,
  status: ReleaseStatus,
  iterationIds: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { error: updErr } = await supabase
    .from('releases')
    .update({
      name: name.trim(),
      objective: objective ? objective.trim() : null,
      sequence_number: sequenceNumber,
      status: status,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (updErr) return { ok: false, error: updErr.message }

  // Sync iterations join
  await supabase.from('release_iterations').delete().eq('release_id', id)
  if (iterationIds.length > 0) {
    const joinData = iterationIds.map(iterId => ({
      release_id: id,
      iteration_id: iterId
    }))
    await supabase.from('release_iterations').insert(joinData)
  }

  await logProjectActivity(projectId, 'release' as any, id, 'updated', { name, status })
  return { ok: true }
}

export async function deleteRelease(id: string, projectId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('releases')
    .delete()
    .eq('id', id)

  if (error) return { ok: false, error: error.message }
  await logProjectActivity(projectId, 'release' as any, id, 'deleted', {})
  return { ok: true }
}

export async function toggleExitCriterion(id: string, releaseId: string, isMet: boolean): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('release_exit_criteria')
    .update({ is_met: isMet })
    .eq('id', id)
    .eq('release_id', releaseId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function addExitCriterion(releaseId: string, criterionText: string): Promise<{ ok: boolean; error?: string; criterion?: ReleaseExitCriterion }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('release_exit_criteria')
    .insert({
      release_id: releaseId,
      criterion_text: criterionText.trim(),
      is_met: false
    })
    .select('*')
    .single()

  if (error) return { ok: false, error: error.message }
  return {
    ok: true,
    criterion: {
      id: data.id,
      releaseId: data.release_id,
      criterionText: data.criterion_text,
      isMet: data.is_met,
      createdAt: data.created_at
    }
  }
}

export async function deleteExitCriterion(id: string, releaseId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('release_exit_criteria')
    .delete()
    .eq('id', id)
    .eq('release_id', releaseId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function addManualScopeOverride(
  releaseId: string,
  entityType: 'wbs_element' | 'activity' | 'custom_item',
  title: string,
  action: 'added' | 'excluded',
  entityId?: string | null,
  notes?: string | null
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('release_manual_scope')
    .insert({
      release_id: releaseId,
      entity_type: entityType,
      entity_id: entityId || null,
      title: title.trim(),
      action: action,
      notes: notes ? notes.trim() : null
    })

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function deleteManualScopeOverride(id: string, releaseId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('release_manual_scope')
    .delete()
    .eq('id', id)
    .eq('release_id', releaseId)

  if (error) return { ok: false, error: error.message }
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

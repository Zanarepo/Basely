'use server'

import { createClient } from '@/utils/supabase/server'
import { logProjectActivity } from '@/lib/projects/activity-actions'
import { dispatchNotification } from '@/lib/notifications/dispatch'
import { checkProjectFeatureAccess } from '@/lib/organizations/tier-logic'
import { checkProjectItemLimit } from '@/lib/organizations/tier-access'
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
      .select('id, name, code, iteration_id, parent_id, status')
      .eq('project_id', projectId)

    const { data: rawActivities } = await supabase
      .from('activities')
      .select('id, name, wbs_element_id, iteration_id, status')
      .eq('project_id', projectId)

    const isCompletedStatus = (status?: string | null) => {
      if (!status) return false
      const s = status.trim().toLowerCase()
      return s === 'complete' || s === 'completed' || s === 'done' || s === 'closed' || s === 'finished'
    }

    const isInProgressStatus = (status?: string | null) => {
      if (!status) return false
      const s = status.trim().toLowerCase()
      return s === 'in progress' || s === 'in_progress' || s === 'active' || s === 'doing' || s === 'started'
    }

    const wbsMap = new Map((rawWbs || []).map(w => [w.id, w]))
    const iterMap = new Map((rawIterations || []).map(i => {
      const taggedWbs = (rawWbs || []).filter(w => w.iteration_id === i.id)
      const taggedActs = (rawActivities || []).filter(a => a.iteration_id === i.id)

      const totalItems = taggedWbs.length + taggedActs.length
      const completedWbs = taggedWbs.filter(w => isCompletedStatus(w.status)).length
      const completedActs = taggedActs.filter(a => isCompletedStatus(a.status)).length
      const completedCount = completedWbs + completedActs

      const inProgWbs = taggedWbs.filter(w => isInProgressStatus(w.status)).length
      const inProgActs = taggedActs.filter(a => isInProgressStatus(a.status)).length
      const inProgressCount = inProgWbs + inProgActs

      const epicNamesSet = new Set<string>()
      taggedWbs.forEach(w => {
        const parent = w.parent_id ? wbsMap.get(w.parent_id) : null
        if (parent) {
          epicNamesSet.add(parent.name)
        } else if (w.name) {
          epicNamesSet.add(w.name)
        }
      })
      taggedActs.forEach(a => {
        const parent = wbsMap.get(a.wbs_element_id)
        if (parent) epicNamesSet.add(parent.name)
      })

      let sprintStatus: 'planned' | 'active' | 'completed' = 'planned'
      if (totalItems > 0 && completedCount === totalItems) {
        sprintStatus = 'completed'
      } else if (completedCount > 0 || inProgressCount > 0) {
        sprintStatus = 'active'
      }

      return [i.id, {
        id: i.id,
        projectId: i.project_id,
        name: i.name,
        sequenceNumber: i.sequence_number,
        startDate: i.start_date,
        endDate: i.end_date,
        labelOverride: i.label_override || null,
        createdAt: i.created_at,
        updatedAt: i.updated_at,
        taggedWbsCount: taggedWbs.length,
        taggedActivityCount: taggedActs.length,
        completedCount,
        inProgressCount,
        epicNames: Array.from(epicNamesSet),
        status: sprintStatus
      } as Iteration]
    }))

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
            const parentEpic = w.parent_id ? wbsMap.get(w.parent_id) : undefined
            autoScopeItems.push({
              id: `wbs_${w.id}`,
              entityId: w.id,
              entityType: 'wbs_element',
              title: w.name,
              code: w.code,
              iterationName: iterName,
              iterationId: iterId,
              parentEpicId: parentEpic?.id || w.id,
              parentEpicName: parentEpic?.name || w.name,
              status: w.status || 'not_started',
              source: 'auto_derived'
            })
          }
        })

        // Tagged Activities
        ;(rawActivities || []).filter(a => a.iteration_id === iterId).forEach(a => {
          if (!excludedEntityIds.has(a.id)) {
            const wbs = wbsMap.get(a.wbs_element_id)
            const parentEpic = wbs?.parent_id ? wbsMap.get(wbs.parent_id) : wbs
            autoScopeItems.push({
              id: `act_${a.id}`,
              entityId: a.id,
              entityType: 'activity',
              title: a.name,
              code: wbs ? wbs.code : undefined,
              iterationName: iterName,
              iterationId: iterId,
              parentEpicId: parentEpic?.id,
              parentEpicName: parentEpic?.name,
              status: a.status || 'not_started',
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
        rollbackPlans,
        releaseNotes: r.release_notes || r.changelog || null
      }
    })

    return { ok: true, iterations, releases, scopeItemsMap, availableWorkItems }
  } catch (err: any) {
    console.error('fetchProjectReleasesData error:', err)
    return { ok: false, error: err.message || 'Unknown error' }
  }
}

export async function createRelease(
  projectId: string,
  name: string,
  objective: string | null,
  sequenceNumber: number,
  status: ReleaseStatus,
  iterationIds: string[] = [],
  exitCriteriaTexts: string[] = []
): Promise<{ ok: boolean; error?: string; limitKey?: string; maxLimit?: number }> {
  const limitCheck = await checkProjectItemLimit(projectId, 'max_releases')
  if (!limitCheck.allowed) {
    return { 
      ok: false, 
      error: `Release limit reached (${limitCheck.maxLimit}). Upgrade your plan to unlock unlimited Release planning.`,
      limitKey: limitCheck.limitKey,
      maxLimit: limitCheck.maxLimit
    }
  }

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

export async function deleteRelease(
  id: string,
  projectId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('releases')
    .delete()
    .eq('id', id)

  if (error) return { ok: false, error: error.message }
  await logProjectActivity(projectId, 'release' as any, id, 'deleted', {})
  return { ok: true }
}

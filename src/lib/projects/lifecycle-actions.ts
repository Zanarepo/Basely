'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { logProjectActivity } from '@/lib/projects/activity-actions'
import { dispatchNotification } from '@/lib/notifications/actions'

import type { ProjectLifecycleStatus, LifecycleTransitionLog } from './lifecycle-types'
import { LIFECYCLE_STAGES, isValidStandardTransition } from './lifecycle-types'

/**
 * Checks if a project is at one of the required lifecycle stages.
 * Universal gating function consumed by Phase 11 closure document generators.
 */
export async function isProjectAtLifecycleStage(
  projectId: string, 
  allowedStages: ProjectLifecycleStatus[]
): Promise<{ ok: boolean; currentStatus?: ProjectLifecycleStatus; error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('lifecycle_status')
    .eq('id', projectId)
    .maybeSingle()

  if (error || !data) {
    return { ok: false, error: 'Failed to query project lifecycle status.' }
  }

  const current = (data.lifecycle_status || 'Executing') as ProjectLifecycleStatus
  if (allowedStages.includes(current)) {
    return { ok: true, currentStatus: current }
  }

  return { 
    ok: false, 
    currentStatus: current, 
    error: `Project is currently in "${current}" status. This action requires the project to be in one of: ${allowedStages.join(', ')}.` 
  }
}

/**
 * Updates the project lifecycle status, enforces transition rules, logs audit history,
 * and notifies project stakeholders.
 */
export async function updateProjectLifecycleStatus(
  projectId: string,
  newStatus: ProjectLifecycleStatus,
  reason?: string,
  isOverride: boolean = false
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'Unauthorized: You must be signed in.' }
  }

  // 1. Fetch current status & verify project access
  const { data: project, error: fetchErr } = await supabase
    .from('projects')
    .select('id, name, lifecycle_status, organization_id')
    .eq('id', projectId)
    .maybeSingle()

  if (fetchErr || !project) {
    return { ok: false, error: 'Project not found or access denied.' }
  }

  const currentStatus = (project.lifecycle_status || 'Executing') as ProjectLifecycleStatus

  if (currentStatus === newStatus) {
    return { ok: true }
  }

  const isStandard = isValidStandardTransition(currentStatus, newStatus)
  const isTerminal = newStatus === 'Closing' || newStatus === 'Closed'

  // Enforce mandatory reason for non-standard phase jumps, overrides, or closure transitions
  if ((!isStandard || isOverride || isTerminal) && (!reason || !reason.trim())) {
    return { 
      ok: false, 
      error: `A detailed justification reason is required when transitioning to "${newStatus}".` 
    }
  }

  // 2. Perform table update
  const { error: updateErr } = await supabase
    .from('projects')
    .update({ lifecycle_status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', projectId)

  if (updateErr) {
    console.error('Failed to update project lifecycle status:', updateErr)
    return { ok: false, error: updateErr.message }
  }

  // 3. Log transition in audit table
  const { error: auditErr } = await supabase
    .from('project_lifecycle_transitions')
    .insert([{
      project_id: projectId,
      from_status: currentStatus,
      to_status: newStatus,
      reason: reason?.trim() || null,
      is_override: !isStandard || isOverride,
      transitioned_by: user.id
    }])

  if (auditErr) {
    console.error('Warning: Failed to insert lifecycle transition log:', auditErr)
  }

  // 4. Log project activity & dispatch team notifications
  await logProjectActivity(projectId, 'project', projectId, 'updated', {
    lifecycle_transition: { from: currentStatus, to: newStatus, reason: reason || 'Phase progress' }
  })

  await dispatchNotification({
    userId: user.id,
    triggerType: 'schedule_change',
    referenceEntityType: 'project',
    referenceEntityId: projectId,
    projectId,
    contentSummary: `Project "${project.name}" lifecycle progressed from ${currentStatus} ➔ ${newStatus}${reason ? ` (${reason})` : ''}.`,
  })

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { ok: true }
}

/**
 * Retrieves the full lifecycle stage transition timeline for audit dashboards and closure documentation.
 */
export async function getProjectLifecycleHistory(projectId: string): Promise<LifecycleTransitionLog[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('project_lifecycle_transitions')
    .select(`
      *,
      transitioned_by_profile:profiles(full_name, email)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to query lifecycle history:', error)
    return []
  }

  return data as LifecycleTransitionLog[]
}

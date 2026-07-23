'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { dispatchNotification } from '@/lib/notifications/actions'
import { logProjectActivity } from '@/lib/projects/activity-actions'
import type { ActionResponse } from './types'

/**
 * Freezes the current schedule dates as a named baseline.
 */
export async function saveBaseline(projectId: string, name: string): Promise<ActionResponse> {
  const adminClient = createAdminClient()
  const supabase = await createClient()

  const { data: project } = await supabase.from('projects').select('organization_id').eq('id', projectId).single()
  if (!project) return { ok: false, error: 'Project not found' }

  const { data: policy } = await supabase
    .from('approval_policies')
    .select('id, enabled')
    .eq('organization_id', project.organization_id)
    .eq('action_type', 'schedule_baseline')
    .maybeSingle()

  const isGated = policy?.enabled === true

  // 1. Fetch current activities
  const { data: acts } = await adminClient
    .from('activities')
    .select('id, name, es, ef, duration')
    .eq('project_id', projectId)

  if (!acts || acts.length === 0) {
    return { ok: true }
  }

  const snapshots = acts.map(a => ({
    // baseline_id is added later if not gated
    activity_id: a.id,
    activity_name: a.name,
    baseline_start: a.es,
    baseline_finish: a.ef,
    baseline_duration: Number(a.duration)
  }))

  if (isGated) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', user?.id).single()
    const requesterName = profile?.full_name || profile?.email || 'A user'
    const payload = {
      baseline: { project_id: projectId, name },
      snapshots
    }
    const { data: reqData, error: reqErr } = await supabase
      .from('approval_requests')
      .insert({
        policy_id: policy.id,
        requested_by_user_id: user?.id,
        payload,
      })
      .select('id')
      .single()

    if (reqErr) return { ok: false, error: reqErr.message }

    // Notify Admins
    const { data: admins } = await adminClient
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', project.organization_id)
      .eq('role', 'Admin')

    if (admins) {
      for (const admin of admins) {
        if (admin.user_id === user?.id) continue
        await dispatchNotification({
          userId: admin.user_id,
          triggerType: 'approval_request',
          referenceEntityType: 'approval_request',
          referenceEntityId: reqData.id,
          projectId: projectId,
          contentSummary: `${requesterName} requested a Schedule Baseline approval.`,
          emailContext: {
            subject: 'Action Required: Schedule Baseline Approval',
            title: 'New Approval Request',
            message: `A new schedule baseline "${name}" has been submitted for your review.`,
            actionUrl: `/dashboard/approvals`
          }
        })
      }
    }

    // @ts-ignore
    return { ok: true, pendingApproval: true }
  }

  // Not gated - execute normally
  const { data: bLine, error: baseErr } = await adminClient
    .from('baselines')
    .insert({ project_id: projectId, name })
    .select('id')
    .single()

  if (baseErr || !bLine) {
    return { ok: false, error: baseErr?.message ?? 'Could not create baseline record' }
  }

  const finalSnapshots = snapshots.map(s => ({ ...s, baseline_id: bLine.id }))

  const { error: snapErr } = await adminClient
    .from('baseline_activity_snapshots')
    .insert(finalSnapshots)

  if (snapErr) {
    return { ok: false, error: snapErr.message }
  }

  await logProjectActivity(projectId, 'schedule_baseline', bLine.id, 'created', { name })

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

/**
 * Deletes a baseline by ID.
 */
export async function deleteBaseline(projectId: string, baselineId: string): Promise<ActionResponse> {
  const adminClient = createAdminClient()
  
  // Verify access
  const { error: accessErr } = await adminClient
    .from('baselines')
    .select('id')
    .eq('id', baselineId)
    .eq('project_id', projectId)
    .single()

  if (accessErr) return { ok: false, error: 'Baseline not found' }

  const { error } = await adminClient
    .from('baselines')
    .delete()
    .eq('id', baselineId)

  if (error) {
    return { ok: false, error: error.message }
  }

  await logProjectActivity(projectId, 'schedule_baseline', baselineId, 'deleted')

  return { ok: true }
}

/**
 * Renames an existing baseline.
 */
export async function renameBaseline(projectId: string, baselineId: string, newName: string): Promise<ActionResponse> {
  if (!newName.trim()) return { ok: false, error: 'Name is required' }
  const adminClient = createAdminClient()
  
  const { error } = await adminClient
    .from('baselines')
    .update({ name: newName.trim() })
    .eq('id', baselineId)
    .eq('project_id', projectId)

  if (error) {
    return { ok: false, error: error.message }
  }

  await logProjectActivity(projectId, 'schedule_baseline', baselineId, 'updated', { name: newName.trim() })

  return { ok: true }
}

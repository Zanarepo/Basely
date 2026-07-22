'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { dispatchNotification } from '@/lib/notifications/actions'

/**
 * Approves a schedule baseline approval request.
 * Commits the baseline + activity snapshots to the actual tables.
 */
export async function approveScheduleBaseline(requestId: string, request: any, payload: any, comment?: string) {
  const supabase = await createClient()
  const { baseline, snapshots } = payload

  // Ensure baseline name is unique for this project to prevent violating unique_project_baseline_name constraint
  let baselineName = baseline.name
  let isUnique = false
  let counter = 0

  while (!isUnique) {
    const checkName = counter === 0 ? baselineName : `${baselineName} (${counter})`
    const { data: existing } = await supabase
      .from('baselines')
      .select('id')
      .eq('project_id', baseline.project_id)
      .eq('name', checkName)
      .maybeSingle()

    if (!existing) {
      baselineName = checkName
      isUnique = true
    } else {
      counter++
    }
  }
  baseline.name = baselineName

  // Insert baseline
  const { data: newBaseline, error: bErr } = await supabase
    .from('baselines')
    .insert(baseline)
    .select()
    .single()

  if (bErr) throw bErr

  // Insert snapshots (strip activity_name since it's not a DB column)
  if (snapshots && snapshots.length > 0) {
    const snapshotsWithId = snapshots.map((s: any) => {
      const { activity_name, ...dbFields } = s
      return { ...dbFields, baseline_id: newBaseline.id }
    })
    const { error: sErr } = await supabase
      .from('baseline_activity_snapshots')
      .insert(snapshotsWithId)

    if (sErr) throw sErr
  }

  // Update request status
  const { data: { user } } = await supabase.auth.getUser()
  const { error: updateErr } = await supabase
    .from('approval_requests')
    .update({
      status: 'approved',
      decided_by_user_id: user?.id,
      decision_comment: comment || null,
      decided_at: new Date().toISOString()
    })
    .eq('id', requestId)

  if (updateErr) throw updateErr

  // Notify the requester
  await dispatchNotification({
    userId: request.requested_by_user_id,
    triggerType: 'approval_update',
    referenceEntityType: 'approval_request',
    referenceEntityId: requestId,
    projectId: payload.baseline?.project_id,
    contentSummary: `Your schedule baseline request was approved.`,
    emailContext: {
      subject: 'Schedule Baseline Approved',
      title: 'Schedule Baseline Approved',
      message: `Your schedule baseline "${baseline.name}" has been approved by an admin.`,
      actionUrl: `/dashboard/projects/${payload.baseline?.project_id}?tab=schedule`
    }
  })

  revalidatePath('/dashboard')
}

/**
 * Gets the latest schedule baseline comparison for a project.
 * Returns the most recent saved baseline BEFORE the given request timestamp.
 */
export async function getScheduleBaselineComparison(projectId: string, requestCreatedAt?: string) {
  const supabaseAdmin = createAdminClient()

  let query = supabaseAdmin
    .from('baselines')
    .select('id, name, saved_at')
    .eq('project_id', projectId)
  if (requestCreatedAt) {
    query = query.lt('saved_at', requestCreatedAt)
  }
  const { data: latestBaseline, error: bError } = await query
    .order('saved_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (bError) {
    console.error('Error fetching latest schedule baseline:', bError)
    return { previousBaseline: null, snapshots: [] }
  }

  if (!latestBaseline) {
    return { previousBaseline: null, snapshots: [] }
  }

  const { data: snapshots, error: sError } = await supabaseAdmin
    .from('baseline_activity_snapshots')
    .select('*, activities(name)')
    .eq('baseline_id', latestBaseline.id)

  if (sError) {
    console.error('Error fetching baseline activity snapshots:', sError)
    return { previousBaseline: latestBaseline, snapshots: [] }
  }

  return { previousBaseline: latestBaseline, snapshots }
}

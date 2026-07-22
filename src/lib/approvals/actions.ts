'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { dispatchNotification } from '@/lib/notifications/actions'
import { approveScheduleBaseline, getScheduleBaselineComparison } from './schedule-actions'

// Note: In a real implementation, you would dynamically dispatch based on the action_type.
// For now, we will statically import the cost and schedule baselines functions.
// But wait, the original baseline functions create a direct insert. If we call them, they will trigger the policy check again!
// We need bypass logic or direct insert here.
// To keep things clean, the payload will contain exactly what needs to be inserted.

export async function approveRequest(requestId: string, comment?: string) {
  const supabase = await createClient()

  // 1. Fetch the request
  const { data: request, error: reqErr } = await supabase
    .from('approval_requests')
    .select('*, approval_policies(action_type, organization_id)')
    .eq('id', requestId)
    .single()

  if (reqErr || !request) {
    return { ok: false, error: reqErr?.message ?? 'Request not found' }
  }

  if (request.status !== 'pending') {
    return { ok: false, error: 'Request is no longer pending' }
  }

  // 2. Extract action type and payload
  const actionType = request.approval_policies?.action_type
  const payload = request.payload

  if (!actionType || !payload) {
    return { ok: false, error: 'Invalid request data' }
  }

  // 3. Commit the payload to the actual tables based on action_type
  try {
    if (actionType === 'budget_baseline') {
      // Payload has { baseline, snapshots }
      const { baseline, snapshots } = payload

      // Insert baseline
      const { data: newBaseline, error: bErr } = await supabase
        .from('budget_baselines')
        .insert(baseline)
        .select()
        .single()

      if (bErr) throw bErr

      // Insert snapshots
      if (snapshots && snapshots.length > 0) {
        const snapshotsWithId = snapshots.map((s: any) => ({
          ...s,
          baseline_id: newBaseline.id
        }))
        const { error: sErr } = await supabase
          .from('baseline_cost_snapshots')
          .insert(snapshotsWithId)

        if (sErr) throw sErr
      }
    } else if (actionType === 'schedule_baseline') {
      await approveScheduleBaseline(requestId, request, payload, comment)
      return { ok: true }
    } else {
      return { ok: false, error: 'Unsupported action type' }
    }

    // 4. Update request status
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
      contentSummary: `Your ${actionType.replace('_', ' ')} request was approved.`,
      emailContext: {
        subject: 'Baseline Request Approved',
        title: 'Baseline Approved',
        message: `Your request for a ${actionType.replace('_', ' ')} has been approved by an admin.`,
        actionUrl: `/dashboard/projects/${payload.baseline?.project_id}?tab=cost`
      }
    })

    revalidatePath('/dashboard')
    return { ok: true }
  } catch (e: any) {
    console.error('Error in approveRequest:', e)
    return { ok: false, error: e.message || 'An error occurred while approving' }
  }
}

export async function rejectRequest(requestId: string, comment?: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('approval_requests')
    .update({
      status: 'rejected',
      decided_by_user_id: user?.id,
      decision_comment: comment || null,
      decided_at: new Date().toISOString()
    })
    .eq('id', requestId)

  if (error) {
    return { ok: false, error: error.message }
  }

  // Fetch request details to notify the requester
  const { data: request } = await supabase
    .from('approval_requests')
    .select('requested_by_user_id, payload, approval_policies(action_type)')
    .eq('id', requestId)
    .single()

  if (request) {
    await dispatchNotification({
      userId: request.requested_by_user_id,
      triggerType: 'approval_update',
      referenceEntityType: 'approval_request',
      referenceEntityId: requestId,
      projectId: request.payload?.baseline?.project_id,
      contentSummary: `Your ${(request.approval_policies as any)?.action_type?.replace('_', ' ')} request was rejected.`,
      emailContext: {
        subject: 'Baseline Request Rejected',
        title: 'Baseline Rejected',
        message: `Your request has been rejected. Reason: ${comment || 'No reason provided.'}`,
        actionUrl: `/dashboard/projects/${request.payload?.baseline?.project_id}?tab=${(request.approval_policies as any)?.action_type === 'schedule_baseline' ? 'gantt' : 'cost'}`
      }
    })
  }

  revalidatePath('/dashboard')
  return { ok: true }
}

export async function deleteRequest(requestId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not authenticated' }

  // Ensure authorization: must be requester or admin
  const { data: req } = await supabase
    .from('approval_requests')
    .select('requested_by_user_id, policy_id, approval_policies!inner(organization_id)')
    .eq('id', requestId)
    .single()

  if (!req) return { ok: false, error: 'Request not found' }

  let authorized = false
  if (req.requested_by_user_id === user.id) {
    authorized = true
  } else {
    // Check if admin
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', (req.approval_policies as any)?.organization_id)
      .eq('user_id', user.id)
      .single()
    if (membership?.role === 'Admin') authorized = true
  }

  if (!authorized) {
    return { ok: false, error: 'Unauthorized to delete this request' }
  }

  // Use service role client to bypass RLS
  const supabaseAdmin = createAdminClient()

  const { error } = await supabaseAdmin
    .from('approval_requests')
    .delete()
    .eq('id', requestId)

  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { ok: true }
}

export async function getPendingApprovalsForProject(projectId: string, actionType: string, statuses: string[] = ['pending']) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('approval_requests')
    .select('*, approval_policies!inner(action_type)')
    .in('status', statuses)
    .eq('approval_policies.action_type', actionType)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to get pending approvals for project:', error)
    return []
  }

  // Filter in memory for the specific project ID
  const filtered = data.filter(req => req.payload?.baseline?.project_id === projectId)
  return filtered
}

export async function getLatestBaselineComparison(projectId: string, actionType: string, requestCreatedAt?: string) {
  if (actionType === 'schedule_baseline') {
    return getScheduleBaselineComparison(projectId, requestCreatedAt)
  }

  // Budget baseline comparison
  const supabaseAdmin = createAdminClient()

  let query = supabaseAdmin
    .from('budget_baselines')
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
    console.error('Error fetching latest budget baseline:', bError)
    return { previousBaseline: null, snapshots: [] }
  }

  if (!latestBaseline) {
    return { previousBaseline: null, snapshots: [] }
  }

  const { data: snapshots, error: sError } = await supabaseAdmin
    .from('baseline_cost_snapshots')
    .select('*')
    .eq('baseline_id', latestBaseline.id)

  if (sError) {
    console.error('Error fetching baseline cost snapshots:', sError)
    return { previousBaseline: latestBaseline, snapshots: [] }
  }

  return { previousBaseline: latestBaseline, snapshots }
}

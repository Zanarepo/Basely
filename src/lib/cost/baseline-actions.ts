'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import type { EstimationMethod } from './types'
import { dispatchNotification } from '@/lib/notifications/dispatch'
import { logProjectActivity } from '@/lib/projects/activity-actions'

export async function createBudgetBaseline(projectId: string, name: string) {
  const supabase = await createClient()
  
  // 1. Get project's organization_id
  const { data: project } = await supabase.from('projects').select('organization_id').eq('id', projectId).single()
  if (!project) throw new Error('Project not found')

  // 2. Check for active approval policy
  const { data: policy } = await supabase
    .from('approval_policies')
    .select('id, enabled')
    .eq('organization_id', project.organization_id)
    .eq('action_type', 'budget_baseline')
    .maybeSingle()

  const isGated = policy?.enabled === true
  
  // Fetch current data for snapshots
  const { data: wbsElements } = await supabase.from('wbs_elements').select('id, name, parent_id').eq('project_id', projectId)
  const { data: costAccounts } = await supabase.from('cost_accounts').select('*, time_phase_entries(*)').in('wbs_element_id', (wbsElements || []).map(w => w.id))

  if (wbsElements && costAccounts) {
    const snapshots = costAccounts.map(ca => {
      const wbs = wbsElements.find(w => w.id === ca.wbs_element_id)
      return {
        // baseline_id will be added during insertion if not gated
        wbs_element_id: ca.wbs_element_id,
        snapshotted_wbs_name: wbs?.name || 'Unknown',
        snapshotted_parent_id: wbs?.parent_id || null,
        baseline_total: ca.budgeted_total,
        exchange_rate_at_snapshot: 1.0, // Hardcoded for now
        baseline_time_phase: ca.time_phase_entries, // JSONB
      }
    })

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
        
      if (reqErr) throw reqErr

      // Notify Admins (use Admin Client to bypass RLS for fetching admins)
      const adminClient = createAdminClient()
      const { data: admins } = await adminClient
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', project.organization_id)
        .eq('role', 'Admin')

      if (admins) {
        for (const admin of admins) {
          if (admin.user_id === user?.id) continue; // Don't notify the requester
          await dispatchNotification({
            userId: admin.user_id,
            triggerType: 'approval_request',
            referenceEntityType: 'approval_request',
            referenceEntityId: reqData.id,
            projectId: projectId,
            contentSummary: `${requesterName} requested a Budget Baseline approval.`,
            emailContext: {
              subject: 'Action Required: Budget Baseline Approval',
              title: 'New Approval Request',
              message: `A new budget baseline "${name}" has been submitted for your review.`,
              actionUrl: `/dashboard/approvals`
            }
          })
        }
      }

      return { success: true, pendingApproval: true }
    }

    // Original logic: commit immediately
    const { data: baseline, error: bError } = await supabase
      .from('budget_baselines')
      .insert({ project_id: projectId, name })
      .select()
      .single()
      
    if (bError) throw bError

    if (snapshots.length > 0) {
      const finalSnapshots = snapshots.map(s => ({ ...s, baseline_id: baseline.id }))
      const { error: sError } = await supabase.from('baseline_cost_snapshots').insert(finalSnapshots)
      if (sError) throw sError
    }
    
    await logProjectActivity(projectId, 'budget_baseline', baseline.id, 'created', { name })

    return { success: true, data: baseline }
  }

  // Fallback if no wbsElements
  if (isGated) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', user?.id).single()
    const requesterName = profile?.full_name || profile?.email || 'A user'
    const payload = {
      baseline: { project_id: projectId, name },
      snapshots: []
    }
    const { data: reqData } = await supabase.from('approval_requests').insert({ policy_id: policy.id, requested_by_user_id: user?.id, payload }).select('id').single()
    
    // Notify Admins
    const adminClient = createAdminClient()
    const { data: admins } = await adminClient
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', project.organization_id)
      .eq('role', 'Admin')

    if (admins && reqData) {
      for (const admin of admins) {
        if (admin.user_id === user?.id) continue;
        await dispatchNotification({
          userId: admin.user_id,
          triggerType: 'approval_request',
          referenceEntityType: 'approval_request',
          referenceEntityId: reqData.id,
          projectId: projectId,
          contentSummary: `${requesterName} requested a Budget Baseline approval.`,
          emailContext: {
            subject: 'Action Required: Budget Baseline Approval',
            title: 'New Approval Request',
            message: `A new budget baseline "${name}" has been submitted for your review.`,
            actionUrl: `/dashboard/approvals`
          }
        })
      }
    }

    return { success: true, pendingApproval: true }
  }

  const { data: baseline, error: bError } = await supabase
    .from('budget_baselines')
    .insert({ project_id: projectId, name })
    .select()
    .single()
    
  if (bError) throw bError

  await logProjectActivity(projectId, 'budget_baseline', baseline.id, 'created', { name })

  return { success: true, data: baseline }
}

export async function getBaselineSnapshots(baselineId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('baseline_cost_snapshots')
    .select('*')
    .eq('baseline_id', baselineId)

  if (error) throw error
  return data
}

export async function updateBudgetBaseline(baselineId: string, name: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('budget_baselines')
    .update({ name })
    .eq('id', baselineId)
    .select()
    .single()

  if (error) throw error

  await logProjectActivity(data.project_id, 'budget_baseline', baselineId, 'updated', { name })

  return { success: true, data }
}

export async function deleteBudgetBaseline(baselineId: string) {
  const supabase = await createClient()
  
  const { data } = await supabase.from('budget_baselines').select('project_id').eq('id', baselineId).single()
  
  const { error } = await supabase
    .from('budget_baselines')
    .delete()
    .eq('id', baselineId)

  if (error) throw error
  
  if (data?.project_id) {
    await logProjectActivity(data.project_id, 'budget_baseline', baselineId, 'deleted', {})
  }
  
  return { success: true }
}

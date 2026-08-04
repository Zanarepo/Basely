'use server'

import { createClient } from '@/utils/supabase/server'
import { checkFeatureAccess } from '@/lib/organizations/tier-logic'
import { revalidatePath } from 'next/cache'

export async function promoteRelease(
  releaseId: string,
  projectId: string,
  targetStatus: 'in_progress' | 'released',
  rationale: string = 'Release Promotion'
): Promise<{ ok: boolean; error?: string; approvalRequested?: boolean }> {
  const supabase = await createClient()

  // 1. Fetch release details and check exit criteria blocking
  const { data: release, error: relErr } = await supabase
    .from('releases')
    .select('name, status')
    .eq('id', releaseId)
    .single()

  if (relErr || !release) return { ok: false, error: 'Release not found' }

  // If going to 'released', enforce exit criteria
  if (targetStatus === 'released') {
    const { data: criteria } = await supabase
      .from('release_exit_criteria')
      .select('is_met')
      .eq('release_id', releaseId)

    const unmetCriteria = (criteria || []).filter(c => !c.is_met)
    if (unmetCriteria.length > 0) {
      return { ok: false, error: 'Cannot mark as Released. There are unmet exit criteria.' }
    }
  }

  // 2. Fetch Project details for org ID
  const { data: project } = await supabase
    .from('projects')
    .select('organization_id')
    .eq('id', projectId)
    .single()

  if (!project) return { ok: false, error: 'Project not found' }

  // 3. Check for Approval Workflows Feature Access
  const hasApprovalWorkflows = (await checkFeatureAccess(project.organization_id, 'governance.approval_workflows')).allowed

  if (hasApprovalWorkflows) {
    // 4. Enterprise Path: Submit Approval Request
    const { data: policy } = await supabase
      .from('approval_policies')
      .select('id')
      .eq('organization_id', project.organization_id)
      .eq('action_type', 'release_promotion')
      .eq('enabled', true)
      .single()

    if (policy) {
      const payload = {
        releaseId,
        targetStatus,
        rationale
      }
      
      const { data: { user } } = await supabase.auth.getUser()
      const { error: reqErr } = await supabase.from('approval_requests').insert({
        policy_id: policy.id,
        requested_by_user_id: user?.id,
        payload
      })
      
      if (reqErr) {
        return { ok: false, error: reqErr.message }
      }
      return { ok: true, approvalRequested: true }
    } else {
      // If no active policy exists for release_promotion even though they have the feature enabled, 
      // fallback to standard change log approach below or block. The PRD says it uses ApprovalRequest.
      // We will fallback to standard log so it doesn't get stuck if they haven't configured this specific policy.
    }
  }

  // 5. Standard Path (Non-Enterprise or no policy defined): Log standalone Change Request Log and immediately update
  const { data: { user } } = await supabase.auth.getUser()
  
  const description = `Promoted Release "${release.name}" from ${release.status} to ${targetStatus}`

  const { error: logErr } = await supabase
    .from('change_request_log_entries')
    .insert({
      project_id: projectId,
      description,
      rationale,
      outcome: 'approved',
      created_by_user_id: user?.id
    })

  if (logErr) return { ok: false, error: 'Failed to log release promotion: ' + logErr.message }

  // Immediately update status
  const { error: updateErr } = await supabase
    .from('releases')
    .update({ status: targetStatus, updated_at: new Date().toISOString() })
    .eq('id', releaseId)

  if (updateErr) return { ok: false, error: 'Failed to update release status: ' + updateErr.message }

  revalidatePath('/dashboard')
  return { ok: true, approvalRequested: false }
}

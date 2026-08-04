'use server'

import { createClient } from '@/utils/supabase/server'
import { checkFeatureAccess } from '@/lib/organizations/tier-logic'
import { revalidatePath } from 'next/cache'
import { useChangeRequestCreatedHook } from './change-request-hooks'

export async function createStandaloneChangeRequest(
  projectId: string,
  description: string,
  rationale: string,
  outcome: 'pending' | 'approved' | 'rejected' | 'withdrawn' = 'pending'
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Verify the org doesn't have approval workflows enabled
  const { data: project } = await supabase
    .from('projects')
    .select('organization_id')
    .eq('id', projectId)
    .single()

  if (project) {
    const hasApprovalWorkflows = (await checkFeatureAccess(project.organization_id, 'governance.approval_workflows')).allowed
    if (hasApprovalWorkflows) {
      return { success: false, error: 'Your organization uses Approval Workflows. Please submit a formal approval request instead of logging a standalone change.' }
    }
  }

  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('change_request_log_entries')
    .insert({
      project_id: projectId,
      description,
      rationale,
      outcome,
      created_by_user_id: user?.id
    })

  if (error) {
    console.error('Error creating change request:', error)
    return { success: false, error: error.message }
  }

  // Dispatch side-effects (Notifications)
  useChangeRequestCreatedHook(projectId, description, rationale).catch(console.error)

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { success: true }
}

export async function updateStandaloneChangeRequest(
  id: string,
  updates: { description?: string, rationale?: string, outcome?: 'pending' | 'approved' | 'rejected' | 'withdrawn' }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get the change request to know who created it and which project it belongs to
  const { data: cr } = await supabase
    .from('change_request_log_entries')
    .select('project_id, created_by_user_id, description, outcome, projects(name)')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('change_request_log_entries')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('Error updating change request:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function deleteStandaloneChangeRequest(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('change_request_log_entries')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting change request:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

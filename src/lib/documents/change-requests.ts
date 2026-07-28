'use server'

import { createClient } from '@/utils/supabase/server'
import { checkFeatureAccess } from '@/lib/organizations/tier-logic'
import { revalidatePath } from 'next/cache'
import { dispatchNotification } from '@/lib/notifications/actions'

export type ChangeRequestEntry = {
  id: string
  description: string
  rationale?: string
  outcome: 'pending' | 'approved' | 'rejected' | 'withdrawn'
  created_at: string
  created_by_user_id?: string
  source?: 'standalone' | 'approval_workflow'
  creator?: { email: string, full_name: string }
}

export async function getChangeRequests(projectId: string): Promise<ChangeRequestEntry[]> {
  const supabase = await createClient()
  
  // 1. Get project's organization
  const { data: project } = await supabase
    .from('projects')
    .select('organization_id')
    .eq('id', projectId)
    .single()

  if (!project) return []

  const orgId = project.organization_id

  // 2. Check feature access (Enterprise Tier check)
  const hasApprovalWorkflows = await checkFeatureAccess(orgId, 'approval_workflows')

  let results: ChangeRequestEntry[] = []

  if (hasApprovalWorkflows) {
    // Enterprise: Read from approval_requests where action_type is related to changes
    // (We look for schedule_baseline, budget_baseline or any explicit change_request policies)
    const { data: requests, error } = await supabase
      .from('approval_requests')
      .select('*, approval_policies!inner(action_type, organization_id)')
      .eq('approval_policies.organization_id', orgId)

    if (error) {
      console.error('Error fetching approval requests for Change Log:', error)
      return []
    }

    results = (requests || []).map((req: any) => ({
      id: req.id,
      description: `Change Request via ${req.approval_policies?.action_type?.replace('_', ' ').toUpperCase()}`,
      rationale: req.decision_comment || req.payload?.rationale || 'Approval Workflow Request',
      outcome: req.status,
      created_at: req.created_at,
      created_by_user_id: req.requested_by_user_id,
      source: 'approval_workflow',
      creator: {
        email: 'Unknown',
        full_name: 'Unknown'
      }
    }))
  } else {
    // Standard: Read from change_request_log_entries
    const { data: logs, error } = await supabase
      .from('change_request_log_entries')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching standalone change requests:', error)
      return []
    }

    results = (logs || []).map((log: any) => ({
      id: log.id,
      description: log.description,
      rationale: log.rationale,
      outcome: log.outcome,
      created_at: log.created_at,
      created_by_user_id: log.created_by_user_id,
      source: 'standalone',
      creator: {
        email: 'Unknown',
        full_name: 'Unknown'
      }
    }))
  }

  // Fetch missing profiles
  const userIds = Array.from(new Set(results.map(r => r.created_by_user_id).filter(id => !!id))) as string[]
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds)
      
    if (profiles) {
      const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]))
      results.forEach(r => {
        if (r.created_by_user_id && profileMap[r.created_by_user_id]) {
          r.creator = {
            email: profileMap[r.created_by_user_id].email || 'Unknown',
            full_name: profileMap[r.created_by_user_id].full_name || 'Unknown'
          }
        }
      })
    }
  }

  // Sort unified results by created_at desc
  return results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

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
    const hasApprovalWorkflows = await checkFeatureAccess(project.organization_id, 'approval_workflows')
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

  // Determine who to notify (Project Creator, Project Managers, Org Owner)
  const notifyUserIds = new Set<string>()
  
  const { data: projectDetails } = await supabase
    .from('projects')
    .select('name, created_by, organization_id')
    .eq('id', projectId)
    .single()
    
  if (projectDetails?.created_by) notifyUserIds.add(projectDetails.created_by)

  const { data: pms } = await supabase
    .from('project_members')
    .select('user_id')
    .eq('project_id', projectId)
    .or('project_role_title.ilike.*manager*,project_role_title.ilike.*pm*,can_edit_documents.eq.true')
    
  if (pms) pms.forEach(pm => notifyUserIds.add(pm.user_id))

  if (projectDetails?.organization_id) {
    const { data: org } = await supabase.from('organizations').select('owner_id').eq('id', projectDetails.organization_id).single()
    if (org?.owner_id) notifyUserIds.add(org.owner_id)
  }

  // For testing purposes, we allow the creator to receive the notification
  // if (user) notifyUserIds.delete(user.id)

  const projectName = projectDetails?.name || 'Project'
  const actionUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/projects/${projectId}?tab=documents&doc=change_requests`

  for (const uid of Array.from(notifyUserIds)) {
    // Run asynchronously so we don't block the UI
    dispatchNotification({
      userId: uid,
      triggerType: 'document_change',
      referenceEntityType: 'change_request',
      referenceEntityId: projectId,
      projectId: projectId,
      contentSummary: `A new change request was logged for "${projectName}": ${description}`,
      emailContext: {
        subject: `[Basely PM] New Change Request: ${projectName}`,
        title: `Change Request Review`,
        message: `A new standalone change request has been logged and requires your review.\n\nDescription: ${description}\nRationale: ${rationale || 'N/A'}\n\nPlease review and approve or reject it from the project dashboard.`,
        actionUrl
      }
    }).catch(console.error)
  }

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

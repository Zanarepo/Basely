'use server'

import { createClient } from '@/utils/supabase/server'
import { checkFeatureAccess } from '@/lib/organizations/tier-logic'
import { ChangeRequestEntry } from './change-request-types'

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
  const hasApprovalWorkflows = (await checkFeatureAccess(orgId, 'governance.approval_workflows')).allowed

  let results: ChangeRequestEntry[] = []

  if (hasApprovalWorkflows) {
    // Enterprise: Read from approval_requests where action_type is related to changes
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

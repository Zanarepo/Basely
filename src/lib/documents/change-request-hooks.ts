import { createClient } from '@/utils/supabase/server'
import { dispatchNotification } from '@/lib/notifications/actions'

/**
 * Side-effect hook that runs after a change request is created.
 * Responsible for finding stakeholders and dispatching notifications.
 */
export async function useChangeRequestCreatedHook(projectId: string, description: string, rationale: string) {
  const supabase = await createClient()
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
}

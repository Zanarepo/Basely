'use server'

import { createClient } from '@/utils/supabase/server'

export type ActivityEntityType = 
  | 'project'
  | 'wbs_element'
  | 'activity'
  | 'cost_account'
  | 'baseline'
  | 'budget_baseline'
  | 'schedule_baseline'
  | 'actuals'
  | 'estimations'
  | 'resources'
  | 'stakeholder'
  | 'raci'
  | 'risk'
  | 'issue'
  | 'document'
  | 'status_report'
  | 'approval_request'
  | 'comment'

export type ActivityActionType = 
  | 'created'
  | 'updated'
  | 'deleted'
  | 'uploaded'
  | 'approved'
  | 'rejected'
  | 'published'

/**
 * Logs a project activity to the project_activity_logs table.
 * Fails silently to prevent crashing the main transaction if logging fails,
 * but logs the error to the console.
 */
export async function logProjectActivity(
  projectId: string,
  entityType: ActivityEntityType,
  entityId: string,
  action: ActivityActionType,
  detail: any = {}
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.warn('Failed to log project activity: Unauthorized', authError)
      return { ok: false, error: 'Unauthorized' }
    }

    const { error } = await supabase
      .from('project_activity_logs')
      .insert({
        project_id: projectId,
        actor_user_id: user.id,
        entity_type: entityType,
        entity_id: entityId,
        action: action,
        detail: detail,
      })

    if (error) {
      console.error('Failed to insert project activity log:', error)
      return { ok: false, error: error.message }
    }

    return { ok: true }
  } catch (err) {
    console.error('Unexpected error logging project activity:', err)
    return { ok: false, error: 'Unexpected error' }
  }
}

/**
 * Deletes multiple project activity logs. 
 * RLS will ensure that only authorized users (Admin, PM) can actually delete them.
 */
export async function deleteProjectActivityLogs(logIds: string[]) {
  if (!logIds || logIds.length === 0) return { ok: false, error: 'No logs selected' }

  const supabase = await createClient()
  
  const { error } = await supabase
    .from('project_activity_logs')
    .delete()
    .in('id', logIds)

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true }
}

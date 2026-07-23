'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'

export type GovernanceEventType = 'approval_decision' | 'permission_change' | 'sso_config_change'

export async function logGovernanceEvent(
  organizationId: string,
  eventType: GovernanceEventType,
  detail: any
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Failed to log governance event: Unauthorized', authError)
      return { ok: false, error: 'Unauthorized' }
    }

    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('governance_audit_log_entries')
      .insert({
        organization_id: organizationId,
        event_type: eventType,
        actor_user_id: user.id,
        detail: detail,
      })

    if (error) {
      console.error('Failed to insert governance audit log:', error)
      return { ok: false, error: error.message }
    }

    return { ok: true }
  } catch (err) {
    console.error('Unexpected error logging governance event:', err)
    return { ok: false, error: 'Unexpected error' }
  }
}

'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { getStaffSession } from '@/lib/backoffice/auth'
import { revalidatePath } from 'next/cache'

export interface AiLimitOverridePayload {
  generationsLimit: number | null
  basicActionsLimit: number | null
  justification: string
}

/**
 * Update an organization's custom per-org AI limit overrides.
 * Restricted to superadmin only.
 * Changes are logged in tenant_overrides_log for audit purposes.
 */
export async function updateOrgAiLimits(
  orgId: string,
  payload: AiLimitOverridePayload
): Promise<{ success: boolean; error?: string }> {
  const staff = await getStaffSession()
  if (!staff || staff.role !== 'superadmin') {
    return { success: false, error: 'Unauthorized: superadmin role required.' }
  }

  if (!payload.justification?.trim()) {
    return { success: false, error: 'A justification note is required.' }
  }

  const supabase = createAdminClient()

  // Fetch current values for the audit log
  const { data: org } = await supabase
    .from('organizations')
    .select('custom_ai_generations_limit, custom_ai_basic_actions_limit')
    .eq('id', orgId)
    .single()

  // Apply the override
  const { error: updateError } = await supabase
    .from('organizations')
    .update({
      custom_ai_generations_limit: payload.generationsLimit,
      custom_ai_basic_actions_limit: payload.basicActionsLimit,
    })
    .eq('id', orgId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  // Log both changes in audit trail
  const logEntries = []

  if (payload.generationsLimit !== org?.custom_ai_generations_limit) {
    logEntries.push({
      organization_id: orgId,
      staff_id: staff.id,
      action_type: 'ai_generations_limit_override',
      old_value: org?.custom_ai_generations_limit != null ? String(org.custom_ai_generations_limit) : 'tier_default',
      new_value: payload.generationsLimit != null ? String(payload.generationsLimit) : 'tier_default',
      justification: payload.justification,
    })
  }

  if (payload.basicActionsLimit !== org?.custom_ai_basic_actions_limit) {
    logEntries.push({
      organization_id: orgId,
      staff_id: staff.id,
      action_type: 'ai_basic_actions_limit_override',
      old_value: org?.custom_ai_basic_actions_limit != null ? String(org.custom_ai_basic_actions_limit) : 'tier_default',
      new_value: payload.basicActionsLimit != null ? String(payload.basicActionsLimit) : 'tier_default',
      justification: payload.justification,
    })
  }

  if (logEntries.length > 0) {
    await supabase.from('tenant_overrides_log').insert(logEntries)
  }

  revalidatePath(`/backoffice/tenants/${orgId}`)
  return { success: true }
}

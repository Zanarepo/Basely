'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { getStaffSession } from '@/lib/backoffice/auth'
import { revalidatePath } from 'next/cache'

export interface ProjectLimitOverridePayload {
  sprintsLimit: number | null
  releasesLimit: number | null
  justification: string
}

/**
 * Update an organization's custom per-org Sprints/Releases limit overrides.
 * Restricted to superadmin only.
 * Changes are logged in tenant_overrides_log for audit purposes.
 */
export async function updateOrgProjectLimits(
  orgId: string,
  payload: ProjectLimitOverridePayload
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
    .select('custom_max_sprints_limit, custom_max_releases_limit')
    .eq('id', orgId)
    .single()

  // Apply the override
  const { error: updateError } = await supabase
    .from('organizations')
    .update({
      custom_max_sprints_limit: payload.sprintsLimit,
      custom_max_releases_limit: payload.releasesLimit,
    })
    .eq('id', orgId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  // Log both changes in audit trail
  const logEntries = []

  if (payload.sprintsLimit !== org?.custom_max_sprints_limit) {
    logEntries.push({
      organization_id: orgId,
      staff_id: staff.id,
      action_type: 'max_sprints_limit_override',
      old_value: org?.custom_max_sprints_limit != null ? String(org.custom_max_sprints_limit) : 'tier_default',
      new_value: payload.sprintsLimit != null ? String(payload.sprintsLimit) : 'tier_default',
      justification: payload.justification,
    })
  }

  if (payload.releasesLimit !== org?.custom_max_releases_limit) {
    logEntries.push({
      organization_id: orgId,
      staff_id: staff.id,
      action_type: 'max_releases_limit_override',
      old_value: org?.custom_max_releases_limit != null ? String(org.custom_max_releases_limit) : 'tier_default',
      new_value: payload.releasesLimit != null ? String(payload.releasesLimit) : 'tier_default',
      justification: payload.justification,
    })
  }

  if (logEntries.length > 0) {
    await supabase.from('tenant_overrides_log').insert(logEntries)
  }

  revalidatePath(`/backoffice/tenants/${orgId}`)
  return { success: true }
}

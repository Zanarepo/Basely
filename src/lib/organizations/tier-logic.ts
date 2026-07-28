import { createAdminClient } from '@/utils/supabase/admin'

/**
 * Checks if a given feature is enabled for an organization.
 * For Sprint 41, we check if the organization has an approval_policy for 'change_request'.
 * In a real scenario, this might also check a subscription_tier column.
 */
export async function checkFeatureAccess(
  organizationId: string,
  featureName: 'approval_workflows' | 'change_requests'
): Promise<boolean> {
  const supabase = createAdminClient()

  if (featureName === 'approval_workflows') {
    // If they have any active approval policies, consider it enabled.
    const { count } = await supabase
      .from('approval_policies')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('enabled', true)

    return (count ?? 0) > 0
  }

  return true // Default open access for basic features
}

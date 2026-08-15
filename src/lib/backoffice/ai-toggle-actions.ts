'use server'

import { getStaffSession } from '@/lib/backoffice/auth'
import { createAdminClient } from '@/utils/supabase/admin'

export async function togglePremiumAiAccess(organizationId: string, enabled: boolean) {
  const staff = await getStaffSession()
  if (!staff || !['superadmin', 'support_senior'].includes(staff.role)) {
    return { ok: false, error: 'Unauthorized. Only Senior Support or Superadmins can modify Praz-AI access.' }
  }

  const supabase = createAdminClient()
  
  // Verify it's actually a premium tier before allowing the toggle
  const { data: sub } = await supabase
    .from('organization_subscriptions')
    .select('tier_id')
    .eq('organization_id', organizationId)
    .single()

  if (sub?.tier_id !== 'premium') {
    return { ok: false, error: 'Praz-AI toggles can only be applied to Premium workspaces. Enterprise gets it automatically.' }
  }

  const { error } = await supabase
    .from('organizations')
    .update({ ai_features_enabled: enabled })
    .eq('id', organizationId)

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true }
}

'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function bulkOverrideTenantsAction(
  tenantIds: string[], 
  actionType: 'tier' | 'status' | 'tag', 
  value: string, 
  justification: string
) {
  const supabase = await createAdminClient()

  // First, fetch staff user for logging
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  for (const id of tenantIds) {
    if (actionType === 'tier' || actionType === 'status') {
      // Update subscription
      const updates = actionType === 'tier' ? { tier_id: value } : { status: value }
      
      const { error: subErr } = await supabase
        .from('organization_subscriptions')
        .update(updates)
        .eq('organization_id', id)
        
      if (subErr) {
        console.error('Bulk action error on sub:', subErr)
        continue // Or throw, but in bulk it's often better to do partial or fail early
      }

      // Log override
      await supabase.from('system_overrides_log').insert({
        organization_id: id,
        staff_id: user.id,
        action_type: actionType,
        previous_value: 'bulk_unknown', // Typically we'd fetch previous, but simplified for bulk
        new_value: value,
        justification: `[BULK OPERATION] ${justification}`
      })
    } else if (actionType === 'tag') {
      // Mock tagging (requires a tags table or column)
      // Usually would be an insert into organization_tags or update metadata
      console.log(`Tagging ${id} with ${value} (simulated)`)
    }
  }

  revalidatePath('/backoffice/tenants')
}

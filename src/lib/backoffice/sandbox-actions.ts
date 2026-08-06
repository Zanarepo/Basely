'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function toggleSandboxStatusAction(orgId: string, isSandbox: boolean) {
  const supabase = await createAdminClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
    
  const { error } = await supabase
    .from('organizations')
    .update({ is_sandbox: isSandbox })
    .eq('id', orgId)
    
  if (error) {
    console.error('Error toggling sandbox:', error)
    throw new Error('Failed to toggle sandbox status.')
  }
  
  // Log the override
  await supabase.from('system_overrides_log').insert({
    organization_id: orgId,
    staff_id: user.id,
    action_type: 'sandbox_toggle',
    previous_value: String(!isSandbox),
    new_value: String(isSandbox),
    justification: `[ADMIN ACTION] Marked as ${isSandbox ? 'sandbox' : 'production'} organization`
  })
  
  revalidatePath(`/backoffice/tenants/${orgId}`)
}

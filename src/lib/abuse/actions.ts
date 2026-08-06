'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function resolveAbuseFlagAction(flagId: string, outcome: string) {
  const supabase = await createAdminClient()
  
  const { error } = await supabase
    .from('abuse_flags')
    .update({ 
      reviewed_at: new Date().toISOString(),
      review_outcome: outcome
    })
    .eq('id', flagId)
    
  if (error) {
    console.error('Error resolving abuse flag:', error)
    throw new Error('Failed to resolve abuse flag.')
  }
  
  revalidatePath('/backoffice/abuse')
}

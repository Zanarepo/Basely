'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import type { EstimationMethod } from './types'
import { dispatchNotification } from '@/lib/notifications/dispatch'
import { logProjectActivity } from '@/lib/projects/activity-actions'

export async function updateProjectContingency(projectId: string, amount: number, type?: 'flat' | 'percentage') {
  const supabase = await createClient()
  
  const updateData: any = { contingency_amount: amount }
  if (type) {
    updateData.contingency_type = type
  }

  const { data, error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', projectId)
    .select('contingency_amount, contingency_type')
    .single()
    
  if (error) throw error
  return { success: true, data }
}

export async function updateGlobalOverhead(projectId: string, percentage: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .update({ global_overhead_percentage: percentage })
    .eq('id', projectId)
    .select('global_overhead_percentage')
    .single()
    
  if (error) throw error
  return { success: true, data }
}

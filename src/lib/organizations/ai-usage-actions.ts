'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { checkFeatureAccess, checkUsageLimit } from './tier-access'
import { LimitKey } from './tier-types'

type AiMetric = 'generations' | 'basic_actions' | 'meetings' | 'pipeline_runs'

export async function incrementAiUsage(
  organizationId: string, 
  metric: AiMetric,
  count = 1
): Promise<{ success: boolean; reason?: string }> {
  const supabase = createAdminClient()
  
  // 1. Fetch current usage record
  const { data: usage, error } = await supabase
    .from('organization_ai_usage')
    .select('*')
    .eq('organization_id', organizationId)
    .single()

  if (error || !usage) {
    // If no record exists, they might have created the org before the trigger existed. Let's create it.
    await supabase.from('organization_ai_usage').insert({ organization_id: organizationId })
    return incrementAiUsage(organizationId, metric, count)
  }

  // 2. Check if we need to reset for a new calendar month
  const cycleStart = new Date(usage.billing_cycle_start)
  const now = new Date()
  const isNewMonth = cycleStart.getFullYear() !== now.getFullYear() || cycleStart.getMonth() !== now.getMonth()

  // 3. Prepare the update
  const updateData: Record<string, any> = {}
  
  if (isNewMonth) {
    // Reset all counts and set new billing cycle start
    updateData.billing_cycle_start = new Date().toISOString()
    updateData.ai_generations_count = 0
    updateData.ai_basic_actions_count = 0
    updateData.ai_meetings_count = 0
    updateData.ai_pipeline_runs_count = 0
  }

  // Increment the specific metric
  const dbColumn = `ai_${metric}_count`
  const baseValue = isNewMonth ? 0 : usage[dbColumn as keyof typeof usage] as number
  updateData[dbColumn] = baseValue + count
  updateData.updated_at = new Date().toISOString()

  // 4. Update the record
  const { error: updateError } = await supabase
    .from('organization_ai_usage')
    .update(updateData)
    .eq('id', usage.id)

  if (updateError) {
    return { success: false, reason: 'Failed to increment usage' }
  }

  return { success: true }
}

export async function checkAiFeatureAccess(organizationId: string, featureKey: string) {
  return checkFeatureAccess(organizationId, featureKey)
}

export async function checkAiUsageLimit(organizationId: string, limitKey: LimitKey) {
  return checkUsageLimit(organizationId, limitKey)
}

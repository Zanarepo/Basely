'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { invalidateTierSettingsCache } from '../organizations/tier-access'
import { getStaffSession } from '@/lib/backoffice/auth'

export async function getSubscriptionPlans() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('subscription_tiers')
    .select('*')
    .order('price_per_seat', { ascending: true })

  if (error) {
    console.error('Failed to fetch plans', error)
    return []
  }

  return data
}

export async function getSubscriptionPlanDetails(tierId: string) {
  const supabase = createAdminClient()
  
  const [tierRes, featuresRes, limitsRes] = await Promise.all([
    supabase.from('subscription_tiers').select('*').eq('id', tierId).single(),
    supabase.from('tier_feature_map').select('*').eq('tier_id', tierId).order('module', { ascending: true }),
    supabase.from('tier_usage_limits').select('*').eq('tier_id', tierId)
  ])

  return {
    tier: tierRes.data,
    features: featuresRes.data || [],
    limits: limitsRes.data || [],
  }
}

export async function updatePlanFeature(tierId: string, featureKey: string, enabled: boolean) {
  const staff = await getStaffSession()
  if (!staff || staff.role !== 'superadmin') {
    return { success: false, error: 'Unauthorized: Only superadmins can update plan features.' }
  }

  const supabase = createClient()
  const { data: { user } } = await (await supabase).auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('tier_feature_map')
    .update({ enabled })
    .eq('tier_id', tierId)
    .eq('feature_key', featureKey)
    .select()

  if (error) {
    console.error('Feature Update Error:', error)
    return { success: false, error: error.message }
  }
  
  if (!data || data.length === 0) {
    console.error('Feature Update Error: No rows updated. Tier:', tierId, 'Feature:', featureKey)
  }

  // Audit log
  await adminClient.from('backoffice_audit_logs').insert({
    admin_id: user.id,
    action_type: 'UPDATE_PLAN_FEATURE',
    target_tier: tierId,
    details: { feature_key: featureKey, enabled }
  })

  invalidateTierSettingsCache()
  revalidatePath(`/backoffice/plans/${tierId}`)
  return { success: true }
}

export async function updatePlanLimit(tierId: string, limitKey: string, maxValue: number) {
  const staff = await getStaffSession()
  if (!staff || staff.role !== 'superadmin') {
    return { success: false, error: 'Unauthorized: Only superadmins can update plan limits.' }
  }

  const supabase = createClient()
  const { data: { user } } = await (await supabase).auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('tier_usage_limits')
    .update({ max_value: maxValue })
    .eq('tier_id', tierId)
    .eq('limit_key', limitKey)

  if (error) {
    return { success: false, error: error.message }
  }

  // Audit log
  await adminClient.from('backoffice_audit_logs').insert({
    admin_id: user.id,
    action_type: 'UPDATE_PLAN_LIMIT',
    target_tier: tierId,
    details: { limit_key: limitKey, max_value: maxValue }
  })

  invalidateTierSettingsCache()
  revalidatePath(`/backoffice/plans/${tierId}`)
  return { success: true }
}

export async function updatePlanDetails(tierId: string, updates: { price_per_seat?: number, description?: string }) {
  const staff = await getStaffSession()
  if (!staff || staff.role !== 'superadmin') {
    return { success: false, error: 'Unauthorized: Only superadmins can update plan details.' }
  }

  const supabase = createClient()
  const { data: { user } } = await (await supabase).auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('subscription_tiers')
    .update(updates)
    .eq('id', tierId)

  if (error) {
    return { success: false, error: error.message }
  }

  // Audit log
  await adminClient.from('backoffice_audit_logs').insert({
    admin_id: user.id,
    action_type: 'UPDATE_PLAN_DETAILS',
    target_tier: tierId,
    details: updates
  })

  invalidateTierSettingsCache()
  revalidatePath(`/backoffice/plans/${tierId}`)
  revalidatePath('/backoffice/plans')
  return { success: true }
}

export async function getBackofficeAuditLogs(page = 1, pageSize = 20, searchQuery = '', includeArchived = false) {
  const supabase = createAdminClient()
  let query = supabase
    .from('backoffice_audit_logs')
    .select('*, admin:admin_id(id, email, role, auth_user_id)', { count: 'exact' })
    
  if (!includeArchived) {
    query = query.eq('is_archived', false)
  }

  if (searchQuery) {
    query = query.or(`action_type.ilike.%${searchQuery}%,target_tier.ilike.%${searchQuery}%`)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    console.error('Failed to fetch audit logs', error)
    return { data: [], count: 0 }
  }

  return { data, count: count || 0 }
}

export async function archiveAuditLog(logId: string) {
  const staff = await getStaffSession()
  if (!staff || staff.role !== 'superadmin') {
    return { success: false, error: 'Unauthorized: Only superadmins can archive audit logs.' }
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('backoffice_audit_logs')
    .update({ is_archived: true, archived_at: new Date().toISOString() })
    .eq('id', logId)

  if (error) {
    console.error('Failed to archive audit log', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/backoffice/plans')
  return { success: true }
}

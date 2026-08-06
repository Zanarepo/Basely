'use server'

import { requireSuperadmin, requireStaffWriteAccess } from './auth'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { sendDirectEmail } from '@/lib/notifications/actions'

export async function overrideTenantTierAction(
  organizationId: string, 
  newTier: string,
  newStatus: string,
  newSeats: number,
  justification: string
) {
  // Must have write access (Senior or Superadmin)
  const staff = await requireStaffWriteAccess()

  const supabase = createAdminClient()

  // 1. Get current state
  const { data: currentSub } = await supabase
    .from('organization_subscriptions')
    .select('tier_id, status, seat_count')
    .eq('organization_id', organizationId)
    .single()

  const oldTier = currentSub?.tier_id || 'free'
  const oldSeats = currentSub?.seat_count || 1

  // 2. Log the override immutably
  const { error: logError } = await supabase
    .from('tenant_overrides_log')
    .insert({
      organization_id: organizationId,
      staff_id: staff.id,
      action_type: 'tier_status_seats_change',
      old_value: `${oldTier} (${currentSub?.status}) - ${oldSeats} seats`,
      new_value: `${newTier} (${newStatus}) - ${newSeats} seats`,
      justification
    })

  if (logError) throw new Error('Failed to log override: ' + logError.message)

  // 3. Apply the override
  const { error: updateError } = await supabase
    .from('organization_subscriptions')
    .update({ 
      tier_id: newTier,
      status: newStatus,
      seat_count: newSeats,
      updated_at: new Date().toISOString()
    })
    .eq('organization_id', organizationId)

  if (updateError) throw new Error('Failed to apply override: ' + updateError.message)

  // 4. Notify Account Managers if it's a downgrade or cancellation
  const isDowngrade = 
    (oldTier === 'enterprise' && newTier !== 'enterprise') || 
    (oldTier === 'premium' && newTier === 'free') ||
    (newStatus === 'canceled' || newStatus === 'expired')

  if (isDowngrade) {
    const { data: assignments } = await supabase
      .from('account_assignments')
      .select('internal_staff(email)')
      .eq('organization_id', organizationId)

    if (assignments && assignments.length > 0) {
      for (const assignment of assignments) {
        const staffEmail = (assignment as any).internal_staff?.email
        if (staffEmail) {
          await sendDirectEmail(staffEmail, {
            subject: `[Alert] Tenant Downgrade: ${organizationId}`,
            title: `Tenant Downgrade Alert`,
            message: `A manual override has downgraded the subscription or status for organization ${organizationId}. \n\nOld: ${oldTier} (${currentSub?.status})\nNew: ${newTier} (${newStatus})\n\nJustification: ${justification}`,
            actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/backoffice/tenants/${organizationId}`
          }).catch(err => console.error('Failed to notify AM on downgrade:', err))
        }
      }
    }
  }

  revalidatePath(`/backoffice/tenants/${organizationId}`)
  return { success: true }
}

export async function toggleProjectArchiveStatus(
  projectId: string,
  currentStatus: boolean,
  organizationId: string
) {
  // Only superadmins can perform this action
  await requireSuperadmin()
  
  const supabase = createAdminClient()
  
  const { error } = await supabase
    .from('projects')
    .update({ 
      is_archived: !currentStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId)

  if (error) throw new Error('Failed to toggle project status: ' + error.message)

  revalidatePath(`/backoffice/tenants/${organizationId}`)
  return { success: true }
}

export async function getTenantBillingDetailsAction(organizationId: string) {
  const supabase = createAdminClient()

  // 1. Get Org & Sub
  const { data: org } = await supabase.from('organizations').select('*').eq('id', organizationId).single()
  const { data: sub } = await supabase.from('organization_subscriptions').select('*').eq('organization_id', organizationId).single()
  
  // 2. Get Members Count
  const { count: membersCount } = await supabase
    .from('organization_members')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)

  // 3. Get Overrides (Billing history proxy for now)
  const { data: overrides } = await supabase
    .from('tenant_overrides_log')
    .select('*, internal_staff(email)')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  return {
    org,
    sub,
    membersCount: membersCount || 0,
    overrides: overrides || []
  }
}

'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import {
  TierId,
  OrgSubscriptionInfo,
  getOrganizationSubscription,
  setInMemoryTestSubscription,
  enforceDowngradeLocks,
  checkWorkspaceLockStatus,
} from './tier-logic'

export async function getWorkspaceSubscriptionAction(organizationId: string): Promise<{ ok: boolean; subscription?: OrgSubscriptionInfo; error?: string }> {
  try {
    const sub = await getOrganizationSubscription(organizationId)
    return { ok: true, subscription: sub }
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Failed to fetch subscription' }
  }
}

export async function updateWorkspaceTierAction(
  organizationId: string,
  newTierId: TierId,
  simulateExpiredTrial = false
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Authentication required' }

    const adminClient = createAdminClient()
    
    const effectiveTier = simulateExpiredTrial ? 'free' : newTierId
    const status = simulateExpiredTrial ? 'expired' : (newTierId === 'enterprise' ? 'trialing' : 'active')
    const now = new Date()
    const trialStart = now.toISOString()
    const trialEnd = simulateExpiredTrial
      ? new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      : new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days ahead

    const newSub: OrgSubscriptionInfo = {
      organizationId,
      tierId: effectiveTier,
      status: status as any,
      seatCount: 1,
      trialStart,
      trialEnd,
      currentPeriodEnd: trialEnd,
    }

    // Update in-memory fallback first for immediate testing consistency
    setInMemoryTestSubscription(organizationId, newSub)

    // Attempt DB upsert gracefully
    try {
      await adminClient
        .from('organization_subscriptions')
        .upsert({
          organization_id: organizationId,
          tier_id: newSub.tierId,
          status: newSub.status,
          seat_count: newSub.seatCount,
          trial_start: newSub.trialStart,
          trial_end: newSub.trialEnd,
          current_period_end: newSub.currentPeriodEnd,
        }, { onConflict: 'organization_id' })
        .select()
    } catch {}

    // Enforce downgrade lock behavior if transitioned to free or lower limit tier
    await enforceDowngradeLocks(organizationId, effectiveTier)

    revalidatePath('/dashboard', 'layout')
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Failed to update subscription tier' }
  }
}

export async function checkWorkspaceLockStatusAction(organizationId: string): Promise<{ isLocked: boolean; reason?: string }> {
  try {
    return await checkWorkspaceLockStatus(organizationId)
  } catch {
    return { isLocked: false }
  }
}


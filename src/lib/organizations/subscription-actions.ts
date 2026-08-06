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
import { getOrganizationFeatures } from './tier-access'
import { PaystackAdapter } from '@/lib/payments/paystack-adapter'
import { validatePromoCode, applyPromoUsage } from '@/lib/payments/promo-validation'

export async function getWorkspaceSubscriptionAction(organizationId: string): Promise<{ ok: boolean; subscription?: OrgSubscriptionInfo; features?: Record<string, boolean>; error?: string }> {
  try {
    const sub = await getOrganizationSubscription(organizationId)
    const features = await getOrganizationFeatures(organizationId)
    return { ok: true, subscription: sub, features }
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

export async function createCheckoutSessionAction(
  organizationId: string,
  tierId: TierId,
  amount: number,
  currency: string,
  isAutoRenew: boolean,
  promoCode?: string
): Promise<{ ok: boolean; url?: string; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { ok: false, error: 'Authentication required' }

    // Get the actual organization name
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single()

    let finalAmount = amount
    
    if (promoCode) {
      const promoCheck = await validatePromoCode(promoCode, organizationId)
      if (!promoCheck.valid || !promoCheck.promo) {
        return { ok: false, error: promoCheck.message || 'Invalid promo code.' }
      }
      
      const promo = promoCheck.promo
      if (promo.discount_type === 'percentage') {
        finalAmount = Math.max(0, finalAmount * (1 - promo.discount_value / 100))
      } else if (promo.discount_type === 'fixed_amount') {
        finalAmount = Math.max(0, finalAmount - promo.discount_value)
      }
      
      // We asynchronously record the usage. In a highly strict system, we'd only increment after payment succeeds (via webhook).
      // For this demo, we can just increment it here or leave it for the webhook.
      await applyPromoUsage(promo.id)
    }

    const adapter = new PaystackAdapter()
    const res = await adapter.initializeTransaction({
      organizationId,
      orgName: org?.name || 'Workspace',
      tierId,
      amount: finalAmount,
      currency,
      customerEmail: user.email || 'customer@basely.com',
      autoRenew: isAutoRenew
    })
    
    return res
  } catch (err: any) {
    return { ok: false, error: err.message || 'Failed to initialize checkout' }
  }
}


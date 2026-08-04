import { createAdminClient } from '@/utils/supabase/admin'
import { TierId, OrgSubscriptionInfo } from './tier-types'
import { USAGE_LIMITS } from './tier-constants'
import { subscriptionCache, inMemoryTestStore, CACHE_TTL_MS } from './tier-cache'

// ============================================================================
// CORE SUBSCRIPTION RETRIEVAL & TRIAL CHECK
// ============================================================================
export async function getOrganizationSubscription(organizationId: string): Promise<OrgSubscriptionInfo> {
  // Check TTL cache for immediate sub-millisecond return
  const cached = subscriptionCache.get(organizationId)
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data
  }

  // Check in-memory manual testing override store first
  const override = inMemoryTestStore.get(organizationId)
  if (override) {
    // Re-verify if trial expired in override state
    if (override.status === 'trialing' && override.trialEnd && new Date(override.trialEnd).getTime() < Date.now()) {
      override.tierId = 'free'
      override.status = 'expired'
      inMemoryTestStore.set(organizationId, override)
      await enforceDowngradeLocks(organizationId, 'free')
    }
    subscriptionCache.set(organizationId, { data: override, expiresAt: Date.now() + CACHE_TTL_MS })
    return override
  }

  const supabase = createAdminClient()
  
  // Try fetching from DB
  let subInfo: OrgSubscriptionInfo
  try {
    const { data: dbSub, error } = await supabase
      .from('organization_subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .single()

    if (error || !dbSub) {
      // Default fallback: New accounts automatically get a 14-day Enterprise Trial
      const now = new Date()
      const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
      
      subInfo = {
        organizationId,
        tierId: 'enterprise',
        status: 'trialing',
        seatCount: 1,
        trialStart: now.toISOString(),
        trialEnd: twoWeeksLater.toISOString(),
        currentPeriodEnd: twoWeeksLater.toISOString(),
      }

      try {
        await supabase.from('organization_subscriptions').upsert({
          organization_id: organizationId,
          tier_id: 'enterprise',
          status: 'trialing',
          seat_count: 1,
          trial_start: subInfo.trialStart,
          trial_end: subInfo.trialEnd,
          current_period_end: subInfo.currentPeriodEnd
        })
      } catch {
        // Silently ignore upsert error during offline or read-only SSR checks
      }
    } else {
      subInfo = {
        organizationId: dbSub.organization_id,
        tierId: (dbSub.tier_id as TierId) || 'free',
        status: dbSub.status || 'active',
        seatCount: dbSub.seat_count || 1,
        trialStart: dbSub.trial_start,
        trialEnd: dbSub.trial_end,
        currentPeriodEnd: dbSub.current_period_end
      }
    }
  } catch {
    // If table doesn't exist or connection issues, provide fallback Enterprise Trial
    const now = new Date()
    const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
    subInfo = {
      organizationId,
      tierId: 'enterprise',
      status: 'trialing',
      seatCount: 1,
      trialStart: now.toISOString(),
      trialEnd: twoWeeksLater.toISOString(),
      currentPeriodEnd: twoWeeksLater.toISOString()
    }
  }

  // Automatic Expiry Check: If trial has expired, automatically downgrade to free!
  if (subInfo.status === 'trialing' && subInfo.trialEnd && new Date(subInfo.trialEnd).getTime() < Date.now()) {
    subInfo.tierId = 'free'
    subInfo.status = 'expired'
    try {
      await supabase
        .from('organization_subscriptions')
        .update({ tier_id: 'free', status: 'expired' })
        .eq('organization_id', organizationId)
    } catch {}
    await enforceDowngradeLocks(organizationId, 'free')
  }

  // Grace Period Expiry Check (3 Days): For manual payments or delayed auto-renewals
  if (subInfo.status === 'active' && subInfo.currentPeriodEnd) {
    const periodEnd = new Date(subInfo.currentPeriodEnd).getTime()
    const gracePeriodEnd = periodEnd + (3 * 24 * 60 * 60 * 1000) // 3 Days in milliseconds
    
    if (Date.now() > gracePeriodEnd) {
      subInfo.tierId = 'free'
      subInfo.status = 'expired'
      try {
        await supabase
          .from('organization_subscriptions')
          .update({ tier_id: 'free', status: 'expired' })
          .eq('organization_id', organizationId)
      } catch {}
      await enforceDowngradeLocks(organizationId, 'free')
    }
  }

  subscriptionCache.set(organizationId, { data: subInfo, expiresAt: Date.now() + CACHE_TTL_MS })
  return subInfo
}

// ============================================================================
// DOWNGRADE LOCK ENFORCEMENT
// ============================================================================
export async function enforceDowngradeLocks(organizationId: string, newTierId: TierId): Promise<void> {
  const supabase = createAdminClient()

  let maxActiveProjects = -1
  const { data: limitData } = await supabase
    .from('tier_usage_limits')
    .select('max_value')
    .eq('tier_id', newTierId)
    .eq('limit_key', 'max_active_projects')
    .single()
    
  if (limitData) {
    maxActiveProjects = limitData.max_value
  } else {
    const limits = USAGE_LIMITS[newTierId] || USAGE_LIMITS['free']
    maxActiveProjects = limits['max_active_projects'] ?? -1
  }

  // If new tier is unlimited, unlock any locked projects
  if (maxActiveProjects === -1) {
    try {
      await supabase
        .from('projects')
        .update({ is_locked: false, locked_reason: null })
        .eq('organization_id', organizationId)
        .eq('is_locked', true)
    } catch {}
    return
  }

  // When downgraded to a limited tier (e.g. Free = 1 active project):
  // Query active projects ordered by created_at ASC (oldest first).
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, is_archived, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true })

    if (error || !projects) return

    const activeProjects = projects.filter(p => !p.is_archived)

    for (let i = 0; i < activeProjects.length; i++) {
      const proj = activeProjects[i]
      const shouldBeLocked = i >= maxActiveProjects

      await supabase
        .from('projects')
        .update({
          is_locked: shouldBeLocked,
          locked_reason: shouldBeLocked ? 'TIER_DOWNGRADE_PROJECT_LIMIT' : null
        })
        .eq('id', proj.id)
    }
  } catch {}
}

/**
 * Verifies whether an organization is locked due to being a secondary owned Free workspace (Option 2).
 * A user can only have 1 active Free workspace (their oldest). Secondary Free workspaces become read-only.
 */
export async function checkWorkspaceLockStatus(organizationId: string): Promise<{ isLocked: boolean; reason?: string }> {
  try {
    const sub = await getOrganizationSubscription(organizationId)
    if (!sub || sub.tierId !== 'free' || sub.status === 'trialing') {
      return { isLocked: false }
    }

    const supabase = createAdminClient()
    const { data: org, error: orgErr } = await supabase
      .from('organizations')
      .select('id, owner_id, created_at')
      .eq('id', organizationId)
      .single()

    if (orgErr || !org || !org.owner_id) {
      return { isLocked: false }
    }

    // Fetch all workspaces owned by this user, ordered oldest first
    const { data: ownedOrgs } = await supabase
      .from('organizations')
      .select('id, created_at')
      .eq('owner_id', org.owner_id)
      .order('created_at', { ascending: true })

    if (!ownedOrgs || ownedOrgs.length <= 1) {
      return { isLocked: false }
    }

    // Check which owned organizations are currently Free tier (and not in trial)
    const orgIds = ownedOrgs.map((o) => o.id)
    const { data: subs } = await supabase
      .from('organization_subscriptions')
      .select('organization_id, tier_id, status')
      .in('organization_id', orgIds)

    const freeOrgIds: string[] = []
    for (const item of ownedOrgs) {
      const itemSub = subs?.find((s) => s.organization_id === item.id)
      const isPaidOrTrial = itemSub && (itemSub.status === 'trialing' || itemSub.tier_id === 'premium' || itemSub.tier_id === 'enterprise')
      if (!isPaidOrTrial) {
        freeOrgIds.push(item.id)
      }
    }

    // If there are multiple free workspaces owned, only the oldest (first in freeOrgIds) remains active
    if (freeOrgIds.length > 1 && freeOrgIds[0] !== organizationId) {
      return {
        isLocked: true,
        reason: 'Secondary Free Workspace (Locked). Free accounts can own 1 active workspace. Your oldest workspace remains active, while this secondary workspace is read-only until upgraded.',
      }
    }

    return { isLocked: false }
  } catch {
    return { isLocked: false }
  }
}

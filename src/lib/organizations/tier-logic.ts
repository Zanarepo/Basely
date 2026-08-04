import { createAdminClient } from '@/utils/supabase/admin'

export type TierId = 'free' | 'premium' | 'enterprise'
export type LimitKey = 'max_seats' | 'max_active_projects' | 'seats' | 'active_projects'

export interface FeatureAccessResult {
  allowed: boolean
  requiredTier: string
  featureKey: string
  reason?: 'FEATURE_GATED'
  currentTier?: TierId
  isTrialing?: boolean
}

export interface UsageLimitResult {
  allowed: boolean
  currentUsage: number
  maxLimit: number
  limitKey: string
  requiredTier?: TierId
  reason?: 'USAGE_LIMIT_EXCEEDED'
  currentTier?: TierId
  isTrialing?: boolean
}

export interface OrgSubscriptionInfo {
  organizationId: string
  tierId: TierId
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired'
  seatCount: number
  trialStart?: string
  trialEnd?: string
  currentPeriodEnd?: string
}

// ============================================================================
// IN-MEMORY TTL CACHE (Sub-5ms overhead target)
// ============================================================================
interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const subscriptionCache = new Map<string, CacheEntry<OrgSubscriptionInfo>>()
const inMemoryTestStore = new Map<string, OrgSubscriptionInfo>()
const CACHE_TTL_MS = 60 * 1000 // 60 seconds

export function invalidateSubscriptionCache(orgId: string): void {
  subscriptionCache.delete(orgId)
}

export function setInMemoryTestSubscription(orgId: string, info: OrgSubscriptionInfo): void {
  inMemoryTestStore.set(orgId, info)
  invalidateSubscriptionCache(orgId)
}

// ============================================================================
// DEFINITIVE FEATURE MAPPING (Task 1.3 - 24 Features) & LIMITS
// ============================================================================

const FEATURE_TO_MIN_TIER: Record<string, TierId> = {
  // Free Tier (Foundation & Planning Core)
  'foundation.workspace': 'free',
  'planning.wbs': 'free',

  // Premium Tier (Starter & Business Modules)
  'cost.evm_engine': 'premium',
  'cost.resource_rates': 'premium',
  'cost.actuals_tracking': 'premium',
  'accountability.raci': 'premium',
  'accountability.risks': 'premium',
  'documentation.engine': 'premium',
  'documentation.status_reports': 'premium',
  'documentation.custom_templates': 'premium',
  'collaboration.realtime': 'premium',
  'collaboration.notifications': 'premium',
  'reporting.analytics': 'premium',
  'product.roadmap_gtm': 'premium',
  'product.backlog_prioritization': 'premium',
  'pm.adr_skills_raid': 'premium',
  'releases.management': 'premium',

  // Enterprise Tier (Governance & Integrations)
  'governance.granular_rbac': 'enterprise',
  'governance.approval_workflows': 'enterprise',
  'governance.audit_logs': 'enterprise',
  'governance.sso': 'enterprise',
  'integrations.api_webhooks': 'enterprise',
  'integrations.cloud_calendar': 'enterprise',
  'integrations.erp_connector': 'enterprise',
}

const LEGACY_FEATURE_MAP: Record<string, string> = {
  'approval_workflows': 'governance.approval_workflows',
  'change_requests': 'governance.approval_workflows',
  'risks': 'accountability.risks',
  'wbs': 'planning.wbs',
  'actual_costs': 'cost.actuals_tracking',
  'activities': 'reporting.analytics',
  'calendar': 'integrations.cloud_calendar',
}

const TIER_HIERARCHY: Record<TierId, number> = {
  'free': 1,
  'premium': 2,
  'enterprise': 3,
}

const USAGE_LIMITS: Record<TierId, Record<string, number>> = {
  'free': { max_seats: 3, max_active_projects: 2 },
  'premium': { max_seats: -1, max_active_projects: -1 },
  'enterprise': { max_seats: -1, max_active_projects: -1 },
}

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

  subscriptionCache.set(organizationId, { data: subInfo, expiresAt: Date.now() + CACHE_TTL_MS })
  return subInfo
}

// ============================================================================
// FEATURE-GATE ENFORCEMENT ENGINE
// ============================================================================
export async function checkFeatureAccess(
  organizationId: string,
  rawFeatureKey: string
): Promise<FeatureAccessResult> {
  const featureKey = LEGACY_FEATURE_MAP[rawFeatureKey] || rawFeatureKey
  const sub = await getOrganizationSubscription(organizationId)
  
  const minRequiredTier = FEATURE_TO_MIN_TIER[featureKey] || 'premium'
  
  const currentLevel = TIER_HIERARCHY[sub.tierId] || 1
  const requiredLevel = TIER_HIERARCHY[minRequiredTier] || 2
  
  if (currentLevel >= requiredLevel) {
    return {
      allowed: true,
      requiredTier: minRequiredTier,
      featureKey,
      currentTier: sub.tierId,
      isTrialing: sub.status === 'trialing',
    }
  }

  return {
    allowed: false,
    requiredTier: minRequiredTier,
    featureKey,
    reason: 'FEATURE_GATED',
    currentTier: sub.tierId,
    isTrialing: sub.status === 'trialing',
  }
}

// ============================================================================
// USAGE LIMIT ENFORCEMENT ENGINE
// ============================================================================
export async function checkUsageLimit(
  organizationId: string,
  rawLimitKey: LimitKey
): Promise<UsageLimitResult> {
  const limitKey = (rawLimitKey === 'seats' ? 'max_seats' : rawLimitKey === 'active_projects' ? 'max_active_projects' : rawLimitKey) as 'max_seats' | 'max_active_projects'
  
  const sub = await getOrganizationSubscription(organizationId)
  const limits = USAGE_LIMITS[sub.tierId] || USAGE_LIMITS['free']
  const maxLimit = limits[limitKey] ?? -1

  // -1 means unlimited
  if (maxLimit === -1) {
    return {
      allowed: true,
      currentUsage: 0,
      maxLimit: -1,
      limitKey,
      currentTier: sub.tierId,
      isTrialing: sub.status === 'trialing',
    }
  }

  const supabase = createAdminClient()
  let currentUsage = 0

  if (limitKey === 'max_seats') {
    // PRD Rule: Only active edit-level roles ('Owner', 'Admin', 'PM', 'Team Member') count. 'Viewer' is excluded.
    try {
      const { data: members, error } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)

      if (!error && members) {
        currentUsage = members.filter((m) => m.role !== 'Viewer').length
      }
    } catch {}
  } else if (limitKey === 'max_active_projects') {
    // Count active unarchived and unlocked projects
    try {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('id, is_archived')
        .eq('organization_id', organizationId)

      if (!error && projects) {
        currentUsage = projects.filter((p) => !p.is_archived).length
      }
    } catch {}
  }

  if (currentUsage >= maxLimit) {
    return {
      allowed: false,
      currentUsage,
      maxLimit,
      limitKey,
      reason: 'USAGE_LIMIT_EXCEEDED',
      requiredTier: 'premium',
      currentTier: sub.tierId,
      isTrialing: sub.status === 'trialing',
    }
  }

  return {
    allowed: true,
    currentUsage,
    maxLimit,
    limitKey,
    currentTier: sub.tierId,
    isTrialing: sub.status === 'trialing',
  }
}

// ============================================================================
// DOWNGRADE LOCK ENFORCEMENT
// ============================================================================
export async function enforceDowngradeLocks(organizationId: string, newTierId: TierId): Promise<void> {
  const limits = USAGE_LIMITS[newTierId] || USAGE_LIMITS['free']
  const maxActiveProjects = limits['max_active_projects'] ?? -1

  const supabase = createAdminClient()

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


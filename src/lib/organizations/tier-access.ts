import { createAdminClient } from '@/utils/supabase/admin'
import { TierId, LimitKey, FeatureAccessResult, UsageLimitResult } from './tier-types'
import { FEATURE_TO_MIN_TIER, LEGACY_FEATURE_MAP, TIER_HIERARCHY, USAGE_LIMITS } from './tier-constants'
import { getOrganizationSubscription } from './tier-core'

// ============================================================================
// DYNAMIC TIER SETTINGS CACHE
// ============================================================================
let featureMapCache: Record<string, Record<string, boolean>> | null = null
let limitsCache: Record<string, Record<string, number>> | null = null
let cacheExpiresAt = 0
const CACHE_TTL = 60 * 1000 // 60 seconds

export function invalidateTierSettingsCache() {
  featureMapCache = null
  limitsCache = null
  cacheExpiresAt = 0
}

async function fetchTierSettings() {
  if (featureMapCache && limitsCache && Date.now() < cacheExpiresAt) {
    return { features: featureMapCache, limits: limitsCache }
  }

  const supabase = createAdminClient()
  const [featuresRes, limitsRes] = await Promise.all([
    supabase.from('tier_feature_map').select('tier_id, feature_key, enabled'),
    supabase.from('tier_usage_limits').select('tier_id, max_seats, max_active_projects, max_workspaces')
  ])

  const newFeatures: Record<string, Record<string, boolean>> = {}
  if (featuresRes.data) {
    for (const row of featuresRes.data) {
      if (!newFeatures[row.tier_id]) newFeatures[row.tier_id] = {}
      newFeatures[row.tier_id][row.feature_key] = row.enabled
    }
  }

  const newLimits: Record<string, Record<string, number>> = {}
  if (limitsRes.data) {
    for (const row of limitsRes.data) {
      newLimits[row.tier_id] = {
        max_seats: row.max_seats,
        max_active_projects: row.max_active_projects,
        max_workspaces: row.max_workspaces
      }
    }
  }

  featureMapCache = newFeatures
  limitsCache = newLimits
  cacheExpiresAt = Date.now() + CACHE_TTL

  return { features: newFeatures, limits: newLimits }
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
  
  const { features } = await fetchTierSettings()
  
  const tierFeatures = features[sub.tierId] || {}
  const isEnabled = tierFeatures[featureKey] ?? (sub.tierId === 'enterprise' || sub.tierId === 'premium')
  
  if (isEnabled) {
    return {
      allowed: true,
      requiredTier: 'premium',
      featureKey,
      currentTier: sub.tierId,
      isTrialing: sub.status === 'trialing',
    }
  }

  return {
    allowed: false,
    requiredTier: 'premium',
    featureKey,
    reason: 'FEATURE_GATED',
    currentTier: sub.tierId,
    isTrialing: sub.status === 'trialing',
  }
}

export async function getOrganizationFeatures(organizationId: string): Promise<Record<string, boolean>> {
  const sub = await getOrganizationSubscription(organizationId)
  const { features } = await fetchTierSettings()
  const tierFeatures = features[sub.tierId] || {}
  
  // Return a proxy or just the object so we can check features easily
  // If a feature isn't found in the DB, fallback to true if premium/enterprise, false if free
  return new Proxy(tierFeatures, {
    get: (target, prop) => {
      if (typeof prop !== 'string') return target[prop as any]
      const key = LEGACY_FEATURE_MAP[prop] || prop
      if (key in target) return target[key]
      return sub.tierId === 'enterprise' || sub.tierId === 'premium'
    }
  })
}

export async function checkProjectFeatureAccess(
  projectId: string,
  rawFeatureKey: string
): Promise<FeatureAccessResult> {
  const supabase = createAdminClient()
  const { data: proj } = await supabase
    .from('projects')
    .select('organization_id')
    .eq('id', projectId)
    .single()
    
  if (!proj?.organization_id) {
    return {
      allowed: false,
      requiredTier: 'premium',
      featureKey: rawFeatureKey,
      reason: 'FEATURE_GATED',
      currentTier: 'free',
      isTrialing: false,
    }
  }
  
  return checkFeatureAccess(proj.organization_id, rawFeatureKey)
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
  const { limits } = await fetchTierSettings()
  
  const tierLimits = limits[sub.tierId] || limits['free'] || {}
  const maxLimit = tierLimits[limitKey] ?? -1

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

export async function checkWorkspaceCreationLimit(userId: string): Promise<{ allowed: boolean, reason?: string, currentUsage: number, maxLimit: number }> {
  // Free tier rule: Users without any paid workspaces can only own max_workspaces (1).
  const maxLimit = USAGE_LIMITS['free'].max_workspaces

  const supabase = createAdminClient()
  const { data: userOrgs } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', userId)

  const currentUsage = userOrgs ? userOrgs.length : 0

  if (currentUsage >= maxLimit) {
    // Check if they have at least one paid workspace
    const orgIds = userOrgs?.map(o => o.id) || []
    if (orgIds.length > 0) {
      const { data: subs } = await supabase
        .from('organization_subscriptions')
        .select('tier_id, status')
        .in('organization_id', orgIds)
        
      const hasPaidPlan = subs?.some((s) => (s.tier_id === 'premium' || s.tier_id === 'enterprise') && s.status !== 'trialing')
      
      if (hasPaidPlan) {
        return { allowed: true, currentUsage, maxLimit }
      }
    }
    
    return { 
      allowed: false, 
      reason: `Free accounts can own a maximum of ${maxLimit} workspace. Please upgrade your existing workspace to create additional organizations!`,
      currentUsage, 
      maxLimit 
    }
  }

  return { allowed: true, currentUsage, maxLimit }
}

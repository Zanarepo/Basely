import { createAdminClient } from '@/utils/supabase/admin'
import { TierId, LimitKey, FeatureAccessResult, UsageLimitResult } from './tier-types'
import { FEATURE_TO_MIN_TIER, LEGACY_FEATURE_MAP, TIER_HIERARCHY, USAGE_LIMITS } from './tier-constants'
import { getOrganizationSubscription } from './tier-core'

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

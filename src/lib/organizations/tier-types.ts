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

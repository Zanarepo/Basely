import { OrgSubscriptionInfo } from './tier-types'


interface CacheEntry<T> {
  data: T
  expiresAt: number
}

export const subscriptionCache = new Map<string, CacheEntry<OrgSubscriptionInfo>>()
export const inMemoryTestStore = new Map<string, OrgSubscriptionInfo>()
export const CACHE_TTL_MS = 60 * 1000 // 60 seconds

export function invalidateSubscriptionCache(orgId: string): void {
  subscriptionCache.delete(orgId)
}

export function setInMemoryTestSubscription(orgId: string, info: OrgSubscriptionInfo): void {
  inMemoryTestStore.set(orgId, info)
  invalidateSubscriptionCache(orgId)
}

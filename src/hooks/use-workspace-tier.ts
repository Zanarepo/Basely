'use client'

import { useState, useEffect, useCallback } from 'react'
import { getWorkspaceSubscriptionAction, updateWorkspaceTierAction, checkWorkspaceLockStatusAction } from '@/lib/organizations/subscription-actions'
import type { TierId, OrgSubscriptionInfo } from '@/lib/organizations/tier-logic'

export function useWorkspaceTier(organizationId?: string) {
  const [subscription, setSubscription] = useState<OrgSubscriptionInfo | null>(null)
  const [isWorkspaceLocked, setIsWorkspaceLocked] = useState(false)
  const [workspaceLockReason, setWorkspaceLockReason] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  const refresh = useCallback(async () => {
    if (!organizationId) {
      setLoading(false)
      return
    }
    setLoading(true)
    const [res, lockRes] = await Promise.all([
      getWorkspaceSubscriptionAction(organizationId),
      checkWorkspaceLockStatusAction(organizationId),
    ])
    if (res.ok && res.subscription) {
      setSubscription(res.subscription)
      setError(null)
    } else {
      setError(res.error || 'Could not load subscription')
    }
    setIsWorkspaceLocked(lockRes.isLocked)
    setWorkspaceLockReason(lockRes.reason)
    setLoading(false)
  }, [organizationId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const switchPlan = async (newTierId: TierId, simulateExpiredTrial = false) => {
    if (!organizationId) return { ok: false, error: 'No organization ID provided' }
    setUpdating(true)
    const res = await updateWorkspaceTierAction(organizationId, newTierId, simulateExpiredTrial)
    if (res.ok) {
      await refresh()
    }
    setUpdating(false)
    return res
  }

  const effectiveTier: TierId = subscription?.tierId || 'free'
  const isTrialing = subscription?.status === 'trialing'
  const isExpired = subscription?.status === 'expired'
  
  let daysRemaining = 0
  if (isTrialing && subscription?.trialEnd) {
    const diff = new Date(subscription.trialEnd).getTime() - Date.now()
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  return {
    subscription,
    tier: effectiveTier,
    isTrialing,
    isExpired,
    isWorkspaceLocked,
    workspaceLockReason,
    daysRemaining,
    loading,
    updating,
    error,
    refresh,
    switchPlan,
  }
}


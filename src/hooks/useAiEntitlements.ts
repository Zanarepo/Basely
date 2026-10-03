'use client'

import { useState } from 'react'
import { checkAiFeatureAccess, checkAiUsageLimit, incrementAiUsage } from '@/lib/organizations/ai-usage-actions'
import { useUpgradePrompt } from '@/components/dashboard/billing/useUpgradePrompt'
import { LimitKey, TierId } from '@/lib/organizations/tier-types'
import { useWorkspaceTier } from '@/hooks/use-workspace-tier'

type AiMetric = 'generations' | 'basic_actions' | 'meetings' | 'pipeline_runs'

export function useAiEntitlements(organizationId: string) {
  const [isChecking, setIsChecking] = useState(false)
  const upgradePrompt = useUpgradePrompt()
  const { tier, loading: tierLoading } = useWorkspaceTier(organizationId)

  const checkFeature = async (featureKey: string): Promise<boolean> => {
    if (!tierLoading && tier === 'free') {
      upgradePrompt.openPrompt(
        `This AI feature is exclusively available on Premium or Enterprise tiers. Upgrade your workspace to unlock advanced AI workflows.`,
        featureKey
      )
      return false
    }

    setIsChecking(true)
    try {
      const result = await checkAiFeatureAccess(organizationId, featureKey)
      if (!result.allowed) {
        upgradePrompt.openPrompt(
          `This AI feature is exclusively available on the ${result.requiredTier} tier. Upgrade your workspace to unlock advanced AI workflows.`,
          featureKey
        )
        return false
      }
      return true
    } finally {
      setIsChecking(false)
    }
  }

  const checkLimit = async (limitKey: LimitKey): Promise<boolean> => {

    setIsChecking(true)
    try {
      const result = await checkAiUsageLimit(organizationId, limitKey)
      if (!result.allowed) {
        upgradePrompt.openPrompt(
          `You have reached your monthly limit of ${result.maxLimit} for this AI action. Upgrade your workspace for unlimited usage.`,
          limitKey
        )
        return false
      }
      return true
    } finally {
      setIsChecking(false)
    }
  }

  const recordUsage = async (metric: AiMetric, count = 1) => {
    await incrementAiUsage(organizationId, metric, count)
  }

  return {
    isChecking,
    checkFeature,
    checkLimit,
    recordUsage,
    UpgradePromptModalProps: {
      isOpen: upgradePrompt.isOpen,
      onClose: upgradePrompt.closePrompt,
      reason: upgradePrompt.reason,
      requiredTier: upgradePrompt.requiredTier as TierId,
      organizationId,
    }
  }
}

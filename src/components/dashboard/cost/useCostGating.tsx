'use client'

import React from 'react'
import { FeatureGateScreen } from '@/components/dashboard/billing'
import { Lock } from 'lucide-react'

export function useCostGating(isPremium: boolean, canUpgrade: boolean) {
  const permissions = {
    canUseAiEstimator: isPremium,
    canUseAiResourceAssigner: isPremium,
    canImportCsv: isPremium,
    canViewTimePhasing: isPremium,
    canViewBaselines: isPremium,
    canViewActuals: true,
  }

  const RestrictedView: React.FC<{ featureName: string; description: string }> = ({ featureName, description }) => {
    return (
      <div className="mt-8">
        <FeatureGateScreen
          featureName={featureName}
          description={description}
          canUpgrade={canUpgrade}
        />
      </div>
    )
  }

  const RestrictedTabIcon = ({ isRestricted }: { isRestricted: boolean }) => {
    if (!isRestricted) return null
    return <Lock className="w-3.5 h-3.5 text-app-muted shrink-0" />
  }

  return { permissions, RestrictedView, RestrictedTabIcon }
}

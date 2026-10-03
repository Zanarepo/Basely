'use client'

import React from 'react'
import { FeatureGateScreen } from '@/components/dashboard/billing'
import { Lock } from 'lucide-react'

export function useCapacityGating(isPremium: boolean, canUpgrade: boolean) {
  const permissions = {
    canUseCapacityPlanner: isPremium,
    maxSpecialists: isPremium ? Infinity : 5,
  }

  const RestrictedModal = ({ isOpen, onClose, featureName, description }: { isOpen: boolean; onClose: () => void; featureName: string; description: string }) => {
    if (!isOpen) return null
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-app-muted hover:text-app-fg p-1.5 rounded-xl hover:bg-app-muted-surface border border-transparent hover:border-app-border transition-all cursor-pointer z-10"
          >
            ✕
          </button>
          <FeatureGateScreen
            featureName={featureName}
            description={description}
            canUpgrade={canUpgrade}
          />
        </div>
      </div>
    )
  }

  const RestrictedTabIcon = ({ isRestricted }: { isRestricted: boolean }) => {
    if (!isRestricted) return null
    return <Lock className="w-3.5 h-3.5 text-app-muted shrink-0" />
  }

  return { permissions, RestrictedModal, RestrictedTabIcon }
}

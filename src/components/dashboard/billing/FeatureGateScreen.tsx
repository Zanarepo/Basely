'use client'

import React, { useState } from 'react'
import { Lock, Sparkles, ArrowRight, ShieldCheck, Zap } from 'lucide-react'
import { UpgradePromptModal } from './UpgradePromptModal'
import type { TierId } from '@/lib/organizations/tier-logic'

interface FeatureGateScreenProps {
  featureName: string
  requiredTier?: TierId
  description?: string
  canUpgrade?: boolean
}

export const FeatureGateScreen: React.FC<FeatureGateScreenProps> = ({
  featureName,
  requiredTier = 'premium',
  description = 'This module is part of our advanced project governance capabilities. Upgrade your workspace plan to unlock unlimited access.',
  canUpgrade = true,
}) => {
  const [modalOpen, setModalOpen] = useState(false)
  const isEnterprise = requiredTier === 'enterprise'

  return (
    <div className="flex flex-col items-center justify-center min-h-[450px] p-8 md:p-12 my-6 rounded-3xl backdrop-blur-xl bg-app-surface/90 border border-indigo-500/20 shadow-2xl relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-purple-600/20 via-indigo-600/20 to-pink-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-gradient-to-tr from-indigo-500/20 to-blue-500/20 blur-3xl pointer-events-none" />

      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-500/15 to-purple-500/15 text-indigo-400 dark:text-indigo-300 border border-indigo-500/30 mb-6 shadow-sm">
        <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
        <span className="uppercase tracking-wider">
          {isEnterprise ? 'Enterprise Module Required' : 'Premium Feature Gate'}
        </span>
      </div>

      {/* Lock icon container */}
      <div className="p-4 rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white shadow-xl shadow-indigo-500/30 mb-6 transform hover:scale-105 transition-transform duration-300">
        <Lock className="h-10 w-10 animate-bounce" />
      </div>

      {/* Title */}
      <h3 className="text-2xl md:text-3xl font-black text-app-fg text-center mb-3 tracking-tight max-w-xl">
        Unlock {featureName}
      </h3>

      {/* Description */}
      <p className="text-sm md:text-base text-app-muted text-center max-w-lg mb-8 leading-relaxed">
        {description}
      </p>

      {/* Plan highlight box */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md mb-8 text-left text-xs text-app-muted font-medium bg-app-surface-solid/60 p-4 rounded-2xl border border-app-border">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-400 shrink-0" />
          <span>Free Tier: WBS & Basic Gantt</span>
        </div>
        <div className="flex items-center gap-2 text-indigo-400 font-bold">
          <ShieldCheck className="h-4 w-4 text-indigo-500 shrink-0" />
          <span>{isEnterprise ? 'Enterprise Tier Required' : 'Premium Tier Required'}</span>
        </div>
      </div>

      {/* Action Button */}
      {canUpgrade ? (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          style={{ cursor: 'pointer' }}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-extrabold text-sm text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-400 shadow-xl shadow-indigo-600/30 transform hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
        >
          <span>Upgrade Workspace Plan</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      ) : (
        <span className="inline-flex items-center gap-2 px-6 py-3 bg-red-950/40 text-rose-300 border border-red-500/40 font-extrabold text-sm rounded-2xl shadow-inner">
          <Lock className="h-4 w-4 text-rose-400" />
          <span>Contact Workspace Admin to Upgrade</span>
        </span>
      )}

      {/* Embedded Upgrade Modal for instant conversion */}
      <UpgradePromptModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        currentTier="free"
        onSelectTier={() => setModalOpen(false)}
        featureOrLimitName={featureName}
      />
    </div>
  )
}

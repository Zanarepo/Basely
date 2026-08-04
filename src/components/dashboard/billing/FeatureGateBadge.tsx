'use client'

import React, { useState } from 'react'
import type { TierId } from '@/lib/organizations/tier-logic'

interface FeatureGateBadgeProps {
  requiredTier: TierId
  featureName?: string
  onClickUpgrade?: () => void
}

export const FeatureGateBadge: React.FC<FeatureGateBadgeProps> = ({
  requiredTier,
  featureName,
  onClickUpgrade,
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const isEnterprise = requiredTier === 'enterprise'
  const badgeGradient = isEnterprise
    ? 'from-purple-600 to-indigo-600 border-purple-500/50 shadow-purple-500/20'
    : 'from-amber-500 to-amber-600 border-amber-400/50 shadow-amber-500/20'

  return (
    <span
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClickUpgrade}
      style={{ cursor: 'pointer' }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${badgeGradient} border shadow-lg transition-all duration-300 transform hover:scale-105 select-none`}
    >
      <span className="animate-pulse">✨</span>
      <span className="capitalize">{requiredTier}</span>
      {featureName && <span className="hidden sm:inline opacity-90">· {featureName}</span>}
      {isHovered && (
        <span className="ml-1 text-[10px] uppercase tracking-wider bg-white/20 px-1.5 py-0.2 rounded font-bold animate-fadeIn">
          Upgrade
        </span>
      )}
    </span>
  )
}

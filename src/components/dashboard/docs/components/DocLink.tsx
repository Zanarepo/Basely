'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useWorkspace } from '@/components/dashboard/WorkspaceContext'
import { useWorkspaceTier } from '@/hooks/use-workspace-tier'
import type { TierId } from '@/lib/organizations/tier-logic'

export const DocLink = ({ 
  href, 
  children, 
  requiredTier, 
  featureName,
  onRequiresUpgrade 
}: { 
  href: string
  children: React.ReactNode
  requiredTier?: TierId
  featureName?: string
  onRequiresUpgrade?: (feature: string, tier: TierId) => void
}) => {
  const router = useRouter()
  const { activeWorkspace } = useWorkspace()
  const { tier } = useWorkspaceTier(activeWorkspace?.id)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    
    if (requiredTier && onRequiresUpgrade) {
      const tiers = { free: 0, premium: 1, enterprise: 2 }
      const currentTierLevel = tiers[(tier as TierId) || 'free'] || 0
      const requiredTierLevel = tiers[requiredTier] || 0
      
      if (currentTierLevel < requiredTierLevel) {
        onRequiresUpgrade(featureName || 'This feature', requiredTier)
        return
      }
    }
    
    router.push(href)
  }

  return (
    <a href={href} onClick={handleClick} className="text-violet-500 hover:underline cursor-pointer font-medium">
      {children}
    </a>
  )
}

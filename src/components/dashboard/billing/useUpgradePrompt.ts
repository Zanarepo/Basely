'use client'

import { useState } from 'react'
import type { TierId } from '@/lib/organizations/tier-logic'

export function useUpgradePrompt(defaultRequiredTier: TierId = 'premium') {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState<string | undefined>(undefined)
  const [featureName, setFeatureName] = useState<string | undefined>(undefined)

  const openPrompt = (promptReason?: string, customFeatureName?: string) => {
    if (promptReason) setReason(promptReason)
    if (customFeatureName) setFeatureName(customFeatureName)
    setIsOpen(true)
  }

  const closePrompt = () => {
    setIsOpen(false)
  }

  return {
    isOpen,
    reason,
    featureName,
    openPrompt,
    closePrompt,
    requiredTier: defaultRequiredTier,
  }
}

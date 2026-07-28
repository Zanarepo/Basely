'use client'

import React from 'react'
import { Zap, Layers } from 'lucide-react'
import { getIterationLabel } from '@/lib/releases/types'

interface IterationBadgeProps {
  methodology?: string | null
  labelOverride?: 'sprint' | 'phase' | null
  sequenceNumber?: number
  name?: string
  size?: 'sm' | 'md'
}

export function IterationBadge({
  methodology,
  labelOverride,
  sequenceNumber,
  name,
  size = 'md'
}: IterationBadgeProps) {
  const label = getIterationLabel(methodology, labelOverride)
  const isSprint = label === 'Sprint'

  const sizeClass = size === 'sm' 
    ? 'px-2 py-0.5 text-xs gap-1' 
    : 'px-2.5 py-1 text-xs font-semibold gap-1.5'

  const badgeTheme = isSprint
    ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/25'
    : 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/25'

  return (
    <span className={`inline-flex items-center rounded-full border ${badgeTheme} ${sizeClass}`}>
      {isSprint ? (
        <Zap className={size === 'sm' ? 'h-3 w-3 text-purple-500' : 'h-3.5 w-3.5 text-purple-500'} />
      ) : (
        <Layers className={size === 'sm' ? 'h-3 w-3 text-teal-500' : 'h-3.5 w-3.5 text-teal-500'} />
      )}
      <span>
        {label} {sequenceNumber ? `#${sequenceNumber}` : ''}{name ? `: ${name}` : ''}
      </span>
    </span>
  )
}

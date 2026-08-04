'use client'

import React, { useState } from 'react'
import type { LimitKey } from '@/lib/organizations/tier-logic'

interface UsageProgressMeterProps {
  label: string
  current: number
  max: number
  limitKey?: LimitKey
  onUpgrade?: () => void
}

export const UsageProgressMeter: React.FC<UsageProgressMeterProps> = ({
  label,
  current,
  max,
  onUpgrade,
}) => {
  const [isHovered, setIsHovered] = useState(false)
  
  const isUnlimited = max === -1
  const percentage = isUnlimited ? 0 : Math.min(100, Math.round((current / (max || 1)) * 100))
  const isAtLimit = !isUnlimited && current >= max
  const isNearLimit = !isUnlimited && percentage >= 80

  let progressColor = 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-emerald-500/20'
  if (isAtLimit) {
    progressColor = 'bg-gradient-to-r from-red-500 to-rose-600 shadow-red-500/40 animate-pulse'
  } else if (isNearLimit) {
    progressColor = 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/30'
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col justify-between rounded-xl border border-gray-200/60 dark:border-white/10 bg-white/70 dark:bg-gray-900/60 backdrop-blur-md p-4 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{label}</span>
          {isAtLimit && (
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
              LIMIT REACHED
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            {isUnlimited ? (
              <span className="font-bold text-emerald-600 dark:text-emerald-400">Unlimited</span>
            ) : (
              <>
                <strong className="text-gray-900 dark:text-white font-bold">{current}</strong> of{' '}
                <strong className="text-gray-900 dark:text-white font-bold">{max}</strong> used
              </>
            )}
          </span>

          {/* Hover-revealed action button as mandated by development rules */}
          {!isUnlimited && onUpgrade && (
            <button
              onClick={onUpgrade}
              style={{ cursor: 'pointer' }}
              className={`transition-all duration-300 transform ${
                isHovered || isAtLimit
                  ? 'opacity-100 scale-100 translate-x-0 pointer-events-auto'
                  : 'opacity-0 scale-95 translate-x-2 pointer-events-none'
              } inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-sm hover:from-blue-700 hover:to-indigo-700 active:scale-95`}
            >
              <span>Upgrade</span>
              <span className="text-[10px]">↗</span>
            </button>
          )}
        </div>
      </div>

      {!isUnlimited && (
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
          <div
            className={`h-full ${progressColor} transition-all duration-700 ease-out`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  )
}

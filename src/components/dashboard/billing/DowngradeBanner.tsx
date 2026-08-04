'use client'

import React, { useState } from 'react'
import type { TierId } from '@/lib/organizations/tier-logic'

interface DowngradeBannerProps {
  isTrialing?: boolean
  daysRemaining?: number
  hasLockedProjects?: boolean
  isWorkspaceLocked?: boolean
  workspaceLockReason?: string
  canUpgrade?: boolean
  onOpenUpgrade?: () => void
}

export const DowngradeBanner: React.FC<DowngradeBannerProps> = ({
  isTrialing,
  daysRemaining = 0,
  hasLockedProjects,
  isWorkspaceLocked,
  workspaceLockReason,
  canUpgrade = true,
  onOpenUpgrade,
}) => {
  const [isHovered, setIsHovered] = useState(false)

  if (!isTrialing && !hasLockedProjects && !isWorkspaceLocked) return null

  const isLockedWarning = (hasLockedProjects && !isTrialing) || isWorkspaceLocked
  
  const bgGradient = isWorkspaceLocked
    ? 'from-red-950 via-rose-900 to-red-900 border-red-500/70 shadow-red-500/20'
    : isLockedWarning
    ? 'from-amber-600/90 via-orange-600/90 to-red-600/90 border-amber-400/50 shadow-red-500/10'
    : 'from-purple-900/90 via-indigo-900/90 to-blue-900/90 border-indigo-500/40 shadow-indigo-500/10'

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative w-full overflow-hidden border-y bg-gradient-to-r ${bgGradient} backdrop-blur-md transition-all duration-300 shadow-md py-2.5 px-4 sm:px-6 text-white`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm font-semibold">
        <div className="flex items-center gap-2">
          <span className="text-base animate-bounce">{isLockedWarning ? '🔒' : '⚡'}</span>
          {isWorkspaceLocked ? (
            <span>
              <strong className="text-rose-200 font-extrabold">Secondary Workspace Locked:</strong> {workspaceLockReason || 'Free accounts can own 1 active workspace. Your oldest workspace remains active; this secondary workspace is read-only.'}
            </span>
          ) : isLockedWarning ? (
            <span>
              <strong>Project Limit Notice:</strong> Older projects are temporarily locked due to Free tier limits (2 active projects max). No data is lost.
            </span>
          ) : (
            <span>
              <strong className="text-amber-300 font-extrabold">Enterprise Trial Active:</strong> You have unlimited access and all advanced governance modules unlocked for the next{' '}
              <strong className="underline decoration-wavy decoration-amber-400 font-extrabold">{daysRemaining} day{daysRemaining === 1 ? '' : 's'}</strong> before automatic transition to Free.
            </span>
          )}
        </div>

        {/* Hover-revealed action button adhering strictly to UI guidelines */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {canUpgrade ? (
            <button
              onClick={onOpenUpgrade}
              style={{ cursor: 'pointer' }}
              className={`transition-all duration-300 transform ${
                isHovered || isLockedWarning
                  ? 'opacity-100 translate-y-0 scale-100'
                  : 'opacity-0 -translate-y-1 sm:translate-y-0 sm:translate-x-3 scale-95 pointer-events-none'
              } inline-flex items-center gap-1.5 px-3 py-1 bg-white text-gray-900 font-extrabold text-xs rounded-lg shadow hover:bg-gray-100 hover:scale-105 active:scale-95`}
            >
              <span>{isWorkspaceLocked ? 'Upgrade Workspace' : isLockedWarning ? 'Upgrade to Unlock All' : 'Lock in Plan & Save'}</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1 rounded font-black">↗</span>
            </button>
          ) : isLockedWarning ? (
            <span className="px-2.5 py-1 bg-black/30 text-rose-200 border border-white/20 font-bold text-xs rounded-lg whitespace-nowrap shadow">
              Contact Admin to Upgrade
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

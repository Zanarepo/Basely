'use client'

import React from 'react'
import { ShieldAlert, ArrowUpRight, Lock, CheckCircle2 } from 'lucide-react'
import type { ProjectLifecycleStatus } from '@/lib/projects/lifecycle-types'

export interface LifecycleGatingBannerProps {
  documentTitle: string
  currentStatus: ProjectLifecycleStatus
  requiredStatuses: ProjectLifecycleStatus[]
  onOpenLifecycleModal?: () => void
  canEdit?: boolean
}

export function LifecycleGatingBanner({
  documentTitle,
  currentStatus,
  requiredStatuses,
  onOpenLifecycleModal,
  canEdit = true
}: LifecycleGatingBannerProps) {
  const isUnlocked = requiredStatuses.includes(currentStatus)

  if (isUnlocked) {
    return (
      <div className="w-full mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-4 transition-all duration-200">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm md:text-base font-bold text-emerald-800 dark:text-emerald-300 truncate">
              {documentTitle} Unlocked & Ready
            </h4>
            <p className="text-xs md:text-sm text-emerald-700/90 dark:text-emerald-400/90 truncate">
              Project is actively in <strong className="text-app-fg">{currentStatus}</strong> phase. You have authorization to generate and archive closure artifacts.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full my-4 sm:my-6 p-4 sm:p-6 md:p-8 rounded-2xl bg-app-surface border border-app-border shadow-xl flex flex-col items-center text-center justify-center space-y-4 sm:space-y-6">
      <div className="p-3 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 max-w-fit shadow-lg shadow-amber-500/5">
        <Lock className="w-8 h-8 sm:w-10 sm:h-10" />
      </div>
      
      <div className="space-y-2 max-w-lg">
        <h3 className="text-lg sm:text-xl md:text-2xl font-black text-app-fg tracking-tight">
          {documentTitle} is Gated by Project Lifecycle
        </h3>
        <p className="text-xs sm:text-sm md:text-base text-app-muted leading-relaxed">
          This document can only be generated or modified once the project enters formal wrap-up. Your project is currently in the <span className="font-bold text-indigo-400 px-2 py-0.5 bg-indigo-500/10 rounded-md border border-indigo-500/20 inline-block">{currentStatus}</span> phase.
        </p>
      </div>

      <div className="p-3 sm:p-4 bg-app-bg border border-app-border rounded-xl w-full max-w-md flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
        <span className="text-app-muted font-medium">Required Phases:</span>
        <div className="flex items-center gap-2">
          {requiredStatuses.map((s) => (
            <span key={s} className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-400 font-bold border border-orange-500/20 text-xs">
              {s}
            </span>
          ))}
        </div>
      </div>

      {canEdit && onOpenLifecycleModal && (
        <button
          onClick={onOpenLifecycleModal}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white font-bold text-xs sm:text-sm transition-all duration-150 shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer group"
        >
          <span>Advance Lifecycle Phase Now</span>
          <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      )}
    </div>
  )
}

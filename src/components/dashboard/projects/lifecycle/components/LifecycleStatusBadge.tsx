'use client'

import React, { useState, useRef, useEffect } from 'react'
import type { ProjectLifecycleStatus } from '@/lib/projects/lifecycle-types'
import { LIFECYCLE_STAGES } from '@/lib/projects/lifecycle-types'
import { useProjectLifecycle } from '../hooks/useProjectLifecycle'
import { LifecycleTransitionModal } from './LifecycleTransitionModal'
import { 
  Activity, 
  CheckCircle2, 
  ChevronDown, 
  Clock, 
  Flag, 
  Lock, 
  PlayCircle, 
  ShieldCheck, 
  History,
  Layers,
  Check
} from 'lucide-react'

export interface LifecycleStatusBadgeProps {
  projectId: string
  initialStatus?: ProjectLifecycleStatus
  canEdit?: boolean
  onStatusChange?: (newStatus: ProjectLifecycleStatus) => void
  showFullStepper?: boolean
}

const STAGE_CONFIG: Record<ProjectLifecycleStatus, { icon: React.ElementType; color: string; bg: string; border: string; step: number }> = {
  'Initiating': { icon: PlayCircle, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30', step: 1 },
  'Planning': { icon: Layers, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', step: 2 },
  'Executing': { icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', step: 3 },
  'Monitoring & Controlling': { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', step: 4 },
  'Closing': { icon: Flag, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', step: 5 },
  'Closed': { icon: ShieldCheck, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', step: 6 },
}

export function LifecycleStatusBadge({
  projectId,
  initialStatus = 'Executing',
  canEdit = true,
  onStatusChange,
  showFullStepper = false
}: LifecycleStatusBadgeProps) {
  const {
    currentStatus,
    history,
    isTransitioning,
    error,
    transitionStage,
    checkRequiresReason
  } = useProjectLifecycle(projectId, initialStatus, onStatusChange)

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [targetStatus, setTargetStatus] = useState<ProjectLifecycleStatus | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const config = STAGE_CONFIG[currentStatus] || STAGE_CONFIG['Executing']
  const IconComponent = config.icon

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
        setShowHistory(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleStageSelect = (stage: ProjectLifecycleStatus) => {
    if (stage === currentStatus) return
    setTargetStatus(stage)
    setDropdownOpen(false)
    setModalOpen(true)
  }

  return (
    <div className="relative inline-flex items-center" ref={dropdownRef}>
      {/* Compact / Responsive Badge Button */}
      <button
        type="button"
        onClick={() => canEdit && setDropdownOpen(!dropdownOpen)}
        disabled={!canEdit || isTransitioning}
        className={`group inline-flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-1.5 md:px-3.5 md:py-2 rounded-xl border font-bold text-xs sm:text-sm transition-all duration-150 shadow-xs cursor-pointer ${
          config.bg
        } ${config.border} ${config.color} hover:brightness-110 active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed`}
      >
        <IconComponent className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
        <span className="truncate max-w-[120px] sm:max-w-xs md:max-w-none">{currentStatus}</span>
        <span className="hidden md:inline-block text-[11px] font-mono opacity-80 pl-0.5">
          ({config.step}/6)
        </span>
        {canEdit && (
          <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-app-muted transition-transform duration-150 shrink-0 ${
            dropdownOpen ? 'rotate-180' : ''
          }`} />
        )}
      </button>

      {/* Desktop Inline Stepper Preview (optional high-density view) */}
      {showFullStepper && (
        <div className="hidden xl:flex items-center gap-1 ml-3 px-3 py-1.5 bg-app-surface/60 border border-app-border rounded-xl">
          {LIFECYCLE_STAGES.map((stage, idx) => {
            const isCurrent = stage === currentStatus
            const isPassed = STAGE_CONFIG[stage].step < config.step
            return (
              <React.Fragment key={stage}>
                <button
                  onClick={() => canEdit && handleStageSelect(stage)}
                  disabled={!canEdit || isCurrent}
                  title={`Stage ${idx + 1}: ${stage}`}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    isCurrent 
                      ? `${STAGE_CONFIG[stage].bg} ${STAGE_CONFIG[stage].color} border ${STAGE_CONFIG[stage].border}`
                      : isPassed 
                        ? 'text-app-muted hover:text-app-fg hover:bg-app-hover/50' 
                        : 'text-app-muted/40 hover:text-app-muted hover:bg-app-hover/30'
                  }`}
                >
                  <span className="text-[10px] w-4 h-4 rounded-full bg-app-bg border border-app-border/60 flex items-center justify-center font-mono">
                    {idx + 1}
                  </span>
                  <span className="hidden 2xl:inline">{stage}</span>
                </button>
                {idx < LIFECYCLE_STAGES.length - 1 && (
                  <div className="w-3 h-0.5 bg-app-border/60 mx-0.5 shrink-0" />
                )}
              </React.Fragment>
            )
          })}
        </div>
      )}

      {/* Responsive Dropdown Menu (Mobile, Tablet, Desktop) */}
      {dropdownOpen && (
        <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 md:w-96 z-40 bg-app-surface border border-app-border rounded-xl shadow-xl p-2 animate-in fade-in zoom-in-95 duration-150 max-h-[80vh] overflow-y-auto flex flex-col">
          <div className="p-2 border-b border-app-border flex items-center justify-between text-xs font-bold text-app-muted uppercase tracking-wider shrink-0">
            <span>Select Project Lifecycle Stage</span>
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1 px-2 py-1 rounded bg-app-bg hover:bg-app-hover text-app-fg transition-colors font-normal cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span>{showHistory ? 'Stages' : 'Audit Trail'}</span>
            </button>
          </div>

          {!showHistory ? (
            <div className="py-1.5 space-y-1 overflow-y-auto">
              {LIFECYCLE_STAGES.map((stage) => {
                const stgCfg = STAGE_CONFIG[stage]
                const StgIcon = stgCfg.icon
                const isSelected = stage === currentStatus
                return (
                  <button
                    key={stage}
                    onClick={() => handleStageSelect(stage)}
                    className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between gap-3 transition-colors cursor-pointer group ${
                      isSelected ? `${stgCfg.bg} border ${stgCfg.border}` : 'hover:bg-app-hover/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-md ${stgCfg.bg} ${stgCfg.color} shrink-0`}>
                        <StgIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs sm:text-sm font-bold truncate ${isSelected ? stgCfg.color : 'text-app-fg'}`}>
                            {stage}
                          </span>
                          <span className="text-[10px] font-mono text-app-muted shrink-0">
                            Step {stgCfg.step}/6
                          </span>
                        </div>
                        <p className="text-[11px] text-app-muted truncate hidden sm:block">
                          {stage === 'Closing' || stage === 'Closed' ? '⚡ Enables Phase 11 Closure Docs' : 'Standard PM lifecycle progression'}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className={`w-4 h-4 shrink-0 ${stgCfg.color}`} />
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="py-2 px-1 space-y-2 max-h-64 overflow-y-auto">
              <h4 className="text-xs font-bold text-app-fg px-2 mb-1">Recent Phase Transitions</h4>
              {history.length === 0 ? (
                <div className="text-center py-4 text-xs text-app-muted">No status transitions recorded yet.</div>
              ) : (
                history.map((log) => (
                  <div key={log.id} className="p-2 bg-app-bg/60 rounded-lg border border-app-border text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-app-fg">
                      <span>{log.from_status} ➔ {log.to_status}</span>
                      <span className="text-[10px] text-app-muted font-mono">
                        {new Date(log.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {log.reason && (
                      <div className="text-[11px] text-app-muted bg-app-surface p-1.5 rounded border border-app-border/40">
                        "{log.reason}"
                      </div>
                    )}
                    <div className="text-[10px] text-app-muted flex items-center justify-between">
                      <span>By: {log.transitioned_by_profile?.full_name || log.transitioned_by_profile?.email || 'Admin'}</span>
                      {log.is_override && (
                        <span className="text-amber-500 font-bold bg-amber-500/10 px-1 rounded">Override</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      <LifecycleTransitionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        currentStatus={currentStatus}
        targetStatus={targetStatus}
        onConfirm={async (t, r, o) => {
          const success = await transitionStage(t, r, o)
          if (success && onStatusChange) onStatusChange(t)
          return success
        }}
        requiresReason={targetStatus ? checkRequiresReason(targetStatus) : false}
        isTransitioning={isTransitioning}
        error={error}
      />
    </div>
  )
}

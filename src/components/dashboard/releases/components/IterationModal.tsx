import React, { useState, useEffect } from 'react'
import { X, Loader2, Calendar, Hash, Tag, Layers } from 'lucide-react'
import type { Iteration } from '@/lib/releases/types'
import { getIterationLabel } from '@/lib/releases/types'
import type { WbsElement } from '@/lib/wbs/constants'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'
import { analyzeSprintCapacityRisk } from '@/lib/schedule/ai-capacity-actions'
import { AlertTriangle } from 'lucide-react'
import { useAiEntitlements } from '@/hooks/useAiEntitlements'
import { UpgradePromptModal } from '@/components/dashboard/billing/UpgradePromptModal'
import { WorkloadRebalanceWidget } from './WorkloadRebalanceWidget'

interface IterationModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (
    name: string,
    sequenceNumber: number,
    startDate: string,
    endDate: string,
    labelOverride?: 'sprint' | 'phase' | null,
    selectedWbsIds?: string[]
  ) => Promise<any>
  onLimitReached?: (reason: string) => void
  iterationToEdit?: Iteration | null
  projectMethodology?: string | null
  nextSequenceNumber: number
  availableWbsElements?: { id: string; name?: string; title?: string; code?: string; priority?: string | null; iterationId?: string | null }[]
  projectId: string
  organizationId: string
}

export function IterationModal({
  isOpen,
  onClose,
  onSave,
  onLimitReached,
  iterationToEdit,
  projectMethodology,
  nextSequenceNumber,
  availableWbsElements,
  projectId,
  organizationId,
}: IterationModalProps) {
  const [name, setName] = useState('')
  const [sequenceNumber, setSequenceNumber] = useState(1)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [labelOverride, setLabelOverride] = useState<'sprint' | 'phase' | ''>('')
  const [selectedWbsIds, setSelectedWbsIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [capacityRisk, setCapacityRisk] = useState<{
    hasRisk: boolean;
    warningMessage: string;
    totalPoints: number;
    teamCapacity: number;
  } | null>(null)
  const [isAnalyzingRisk, setIsAnalyzingRisk] = useState(false)

  const { checkLimit, recordUsage, isChecking, UpgradePromptModalProps } = useAiEntitlements(organizationId)

  const defaultLabel = getIterationLabel(projectMethodology)
  const isHybrid = (projectMethodology || '').toLowerCase() === 'hybrid'

  useEffect(() => {
    if (iterationToEdit) {
      setName(iterationToEdit.name)
      setSequenceNumber(iterationToEdit.sequenceNumber)
      setStartDate(iterationToEdit.startDate)
      setEndDate(iterationToEdit.endDate)
      setLabelOverride(iterationToEdit.labelOverride || '')
      setSelectedWbsIds(
        availableWbsElements
          ?.filter((el: any) => el.iterationId === iterationToEdit.id)
          .map(el => el.id) || []
      )
    } else {
      setName(`${defaultLabel} ${nextSequenceNumber}`)
      setSequenceNumber(nextSequenceNumber)
      
      // Default to today and +2 weeks
      const today = new Date()
      const twoWeeks = new Date()
      twoWeeks.setDate(today.getDate() + 14)
      
      setStartDate(today.toISOString().split('T')[0])
      setEndDate(twoWeeks.toISOString().split('T')[0])
      setLabelOverride(isHybrid ? 'sprint' : '')
      setSelectedWbsIds([])
    }
    setError(null)
  }, [iterationToEdit, nextSequenceNumber, defaultLabel, isHybrid, isOpen])

  useEffect(() => {
    if (!isOpen || selectedWbsIds.length === 0) {
      setCapacityRisk(null)
      return
    }

    const timer = setTimeout(async () => {
      // 1. Check AI feature access limits
      const canAnalyze = await checkLimit('max_ai_generations')
      if (!canAnalyze) {
        setIsAnalyzingRisk(false)
        return
      }

      setIsAnalyzingRisk(true)
      const sprintId = iterationToEdit?.id || 'new'
      const res = await analyzeSprintCapacityRisk(projectId, organizationId, sprintId, selectedWbsIds)
      
      if (res.ok && res.data) {
        setCapacityRisk(res.data)
        // Record usage for AI generations limit
        await recordUsage('generations')
      } else {
        setCapacityRisk(null)
      }
      setIsAnalyzingRisk(false)
    }, 800) // debounce 800ms

    return () => clearTimeout(timer)
  }, [selectedWbsIds, isOpen, projectId, organizationId, iterationToEdit])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required.')
      return
    }
    if (!startDate || !endDate) {
      setError('Start and end dates are required.')
      return
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('End date must occur on or after start date.')
      return
    }

    setLoading(true)
    setError(null)
    const res = await onSave(
      name,
      Number(sequenceNumber),
      startDate,
      endDate,
      labelOverride === '' ? null : (labelOverride as 'sprint' | 'phase'),
      selectedWbsIds
    )
    setLoading(false)

    if (res.ok) {
      onClose()
    } else if (res.limitKey) {
      onClose()
      if (onLimitReached) onLimitReached(res.error || 'Limit reached')
    } else {
      setError(res.error || 'Failed to save iteration.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150 cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-app-card border border-app-border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] cursor-default"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-app-border bg-app-surface/50">
          <h2 className="text-lg font-bold text-app-fg">
            {iterationToEdit ? `Edit ${defaultLabel}` : `New ${defaultLabel}`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-app-muted hover:text-app-fg hover:bg-app-surface transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {iterationToEdit && (
          <div className="px-6 pt-4">
            <WorkloadRebalanceWidget 
              projectId={projectId}
              organizationId={organizationId}
              iterationId={iterationToEdit.id}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-app-muted flex items-center gap-1.5 uppercase tracking-wider">
              Iteration Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Sprint 1 - Core Foundation"
              className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-app-muted flex items-center gap-1.5 uppercase tracking-wider">
                <Hash className="h-3.5 w-3.5 text-violet-500" />
                Sequence Order
              </label>
              <input
                type="number"
                min={1}
                required
                value={sequenceNumber}
                onChange={e => setSequenceNumber(parseInt(e.target.value) || 1)}
                className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2 text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-violet-500 font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-app-muted flex items-center gap-1.5 uppercase tracking-wider">
                <Tag className="h-3.5 w-3.5 text-purple-500" />
                Methodology Label
              </label>
              <EnterpriseSelect
                value={labelOverride}
                onChange={(val) => setLabelOverride(val as any)}
                options={[
                  { value: '', label: `Project Default (${defaultLabel})`, description: 'Inherit workspace methodology setting' },
                  { value: 'sprint', label: 'Sprint', description: 'Agile / Hybrid time-boxed sprint' },
                  { value: 'phase', label: 'Phase', description: 'Waterfall / Hybrid sequential stage' },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-app-muted flex items-center gap-1.5 uppercase tracking-wider">
                <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-app-muted flex items-center gap-1.5 uppercase tracking-wider">
                <Calendar className="h-3.5 w-3.5 text-violet-500" />
                End Date
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Tag Scope Deliverables Checklist */}
          {availableWbsElements && availableWbsElements.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-app-border/60">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-app-muted flex items-center gap-1.5 uppercase tracking-wider">
                  <Layers className="h-3.5 w-3.5 text-purple-500" />
                  Tag Scope Deliverables ({selectedWbsIds.length} Selected)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedWbsIds.length === availableWbsElements.length) {
                      setSelectedWbsIds([])
                    } else {
                      setSelectedWbsIds(availableWbsElements.map(e => e.id))
                    }
                  }}
                  className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                >
                  {selectedWbsIds.length === availableWbsElements.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="max-h-[40vh] min-h-[150px] overflow-y-auto border border-app-border rounded-xl divide-y divide-app-border/50 bg-app-surface/40 p-1">
                {availableWbsElements.map((el) => {
                  const isChecked = selectedWbsIds.includes(el.id)
                  return (
                    <label
                      key={el.id}
                      className="flex items-center justify-between p-2 hover:bg-app-surface transition-colors cursor-pointer rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedWbsIds((prev) => [...prev, el.id])
                            } else {
                              setSelectedWbsIds((prev) => prev.filter((id) => id !== el.id))
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-purple-600 focus:ring-purple-500 bg-white dark:bg-slate-950 cursor-pointer"
                        />
                        <span className="font-semibold text-app-fg truncate">
                          {el.code ? `[${el.code}] ` : ''}
                          {el.name || el.title}
                        </span>
                      </div>
                      {el.priority && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300">
                          {el.priority}
                        </span>
                      )}
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {isAnalyzingRisk && (
            <div className="flex items-center gap-2 p-3 bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 rounded-xl text-violet-600 dark:text-violet-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing sprint capacity risk...</span>
            </div>
          )}

          {!isAnalyzingRisk && capacityRisk && capacityRisk.hasRisk && (
            <div className="flex items-start gap-3 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-rose-700 dark:text-rose-400">Capacity Risk Detected</p>
                <p className="text-xs text-rose-600 dark:text-rose-300 mt-1">{capacityRisk.warningMessage}</p>
                <p className="text-[11px] font-medium text-rose-500 dark:text-rose-400/80 mt-2">
                  Total Points: {capacityRisk.totalPoints} / Team Capacity: {capacityRisk.teamCapacity}
                </p>
              </div>
            </div>
          )}

          {!isAnalyzingRisk && capacityRisk && !capacityRisk.hasRisk && capacityRisk.totalPoints > 0 && (
            <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl">
              <Layers className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Capacity Looking Good</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-300 mt-1">{capacityRisk.warningMessage}</p>
                <p className="text-[11px] font-medium text-emerald-500 dark:text-emerald-400/80 mt-2">
                  Total Points: {capacityRisk.totalPoints} / Team Capacity: {capacityRisk.teamCapacity}
                </p>
              </div>
            </div>
          )}

          <p className="text-xs text-app-muted bg-app-surface/60 p-3 rounded-xl border border-app-border/50">
            <strong>Unified Schema Notice:</strong> Sprints and Phases use an identical underlying data model. Switching your project methodology mid-flight will preserve all iterations and work item mappings without data loss.
          </p>
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-app-border bg-app-surface/50">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-app-border text-sm font-semibold text-app-muted hover:text-app-fg hover:bg-app-surface transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {iterationToEdit ? 'Save Changes' : `Create ${defaultLabel}`}
          </button>
        </div>
      </div>
      <UpgradePromptModal {...UpgradePromptModalProps} />
    </div>
  )
}

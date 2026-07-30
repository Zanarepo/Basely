'use client'

import { useState } from 'react'
import { X, Save, Clock, Zap, UserCheck, ShieldAlert, Calendar, Sliders, Info } from 'lucide-react'
import { saveMemberCapacity, type MemberCapacityAllocation } from '@/lib/team/capacity-actions'

interface CapacityPlannerModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  organizationId: string
  methodology?: 'waterfall' | 'agile' | 'hybrid'
  memberName?: string
  userId: string
  initialData?: MemberCapacityAllocation | null
  onSuccess?: (data: { hours: number; velocity: number; bandwidth: number }) => void
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void
}

export default function CapacityPlannerModal({
  isOpen,
  onClose,
  projectId,
  organizationId,
  methodology = 'hybrid',
  memberName = 'Team Member',
  userId,
  initialData,
  onSuccess,
  onShowToast
}: CapacityPlannerModalProps) {
  const [hoursPerWeek, setHoursPerWeek] = useState(initialData?.available_hours_per_week?.toString() || '40')
  const [allocatedPct, setAllocatedPct] = useState(initialData?.allocated_percentage?.toString() || '100')
  const [velocityPoints, setVelocityPoints] = useState(initialData?.sprint_velocity_points?.toString() || '15')
  const [startDate, setStartDate] = useState(initialData?.effective_start_date || new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(initialData?.effective_end_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0])
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const isAgile = methodology === 'agile'
  const isWaterfall = methodology === 'waterfall'

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    const hours = parseFloat(hoursPerWeek) || 40
    const bandwidth = parseInt(allocatedPct) || 100
    const velocity = parseFloat(velocityPoints) || 15

    const isUuid = (str?: string) => str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
    const validId = initialData?.id && isUuid(initialData.id) ? initialData.id : undefined

    const res = await saveMemberCapacity({
      id: validId,
      organization_id: organizationId,
      project_id: projectId,
      user_id: userId,
      available_hours_per_week: hours,
      allocated_percentage: bandwidth,
      sprint_velocity_points: velocity,
      effective_start_date: startDate,
      effective_end_date: endDate
    })

    setIsSaving(false)

    if (!res.ok) {
      setError(res.error || 'Failed to persist capacity allocation.')
      if (onShowToast) onShowToast('error', res.error || 'Failed to update bandwidth capacity.')
      return
    }

    if (onShowToast) {
      onShowToast('success', `Bandwidth capacity allocation updated for ${memberName}.`)
    }
    if (onSuccess) {
      onSuccess({ hours, velocity, bandwidth })
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-app-surface border border-app-border rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-app-border bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-inner">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-app-fg">
                  Configure Bandwidth & Capacity
                </h3>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                  {methodology} Mode
                </span>
              </div>
              <p className="text-xs text-app-muted">
                Target Specialist: <strong className="text-app-fg font-bold">{memberName}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-app-muted hover:text-app-fg hover:bg-app-muted-surface border border-transparent hover:border-app-border transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Horizontal Layout */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 flex flex-col justify-between space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Horizontal 2-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Methodology & Metrics (7 cols) */}
            <div className="md:col-span-7 space-y-4 p-4 rounded-2xl bg-app-muted-surface/60 border border-app-border">
              <div className="flex items-center justify-between border-b border-app-border pb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-app-fg flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                  {isAgile ? 'Agile Sprint Capacity' : isWaterfall ? 'Waterfall Man-Hours' : 'Hybrid Velocity & Hours'}
                </span>
              </div>

              {!isAgile && (
                <div>
                  <label className="text-xs font-bold text-app-fg flex items-center gap-1.5 mb-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    Available Weekly Man-Hours (Billable)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="168"
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-app-surface border border-app-border text-app-fg text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                  <p className="text-[11px] text-app-muted mt-1 leading-relaxed">
                    Baseline weekly capacity for earned value burn rates & WBS scheduling.
                  </p>
                </div>
              )}

              {!isWaterfall && (
                <div className={!isAgile ? 'pt-2 border-t border-app-border/60' : ''}>
                  <label className="text-xs font-bold text-app-fg flex items-center gap-1.5 mb-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Target Sprint Velocity (Story Points / Sprint)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="200"
                    value={velocityPoints}
                    onChange={(e) => setVelocityPoints(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-app-surface border border-app-border text-app-fg text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                    required
                  />
                  <p className="text-[11px] text-app-muted mt-1 leading-relaxed">
                    Story point commitment target per sprint iteration for velocity planning.
                  </p>
                </div>
              )}
            </div>

            {/* Right Column: Allocation & Dates (5 cols) */}
            <div className="md:col-span-5 space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/5 via-app-muted-surface to-app-surface border border-app-border space-y-3">
                <label className="text-xs font-bold text-app-fg block">
                  Project Dedicated Bandwidth (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={allocatedPct}
                    onChange={(e) => setAllocatedPct(e.target.value)}
                    className="flex-1 accent-indigo-600 h-2 bg-app-input rounded-lg cursor-pointer"
                  />
                  <span className={`w-14 text-center font-extrabold text-sm px-2 py-1 rounded-xl border ${
                    parseInt(allocatedPct) >= 95 
                      ? 'bg-rose-500/15 text-rose-500 border-rose-500/30' 
                      : 'bg-indigo-500/15 text-indigo-500 border-indigo-500/30'
                  }`}>
                    {allocatedPct}%
                  </span>
                </div>
                <p className="text-[11px] text-app-muted flex items-center gap-1">
                  <Info className="w-3 h-3 text-indigo-400 shrink-0" />
                  {parseInt(allocatedPct) < 50 ? 'Part-time consultant / shared resource.' : parseInt(allocatedPct) > 90 ? 'Fully committed core project contributor.' : 'Split allocation across concurrent sprints.'}
                </p>
              </div>

              {/* Date Validity Window */}
              <div className="p-4 rounded-2xl bg-app-muted-surface/60 border border-app-border space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-app-muted flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Allocation Window
                </h4>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-app-muted block mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full h-9 px-2 rounded-xl bg-app-surface border border-app-border text-app-fg text-xs font-medium focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-app-muted block mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full h-9 px-2 rounded-xl bg-app-surface border border-app-border text-app-fg text-xs font-medium focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-app-border mt-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-app-border bg-app-muted-surface hover:bg-app-hover text-app-muted hover:text-app-fg text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSaving ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Committing...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Commit Bandwidth Allocation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

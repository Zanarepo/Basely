'use client'

import { useEffect, useState } from 'react'
import { X, User, FileText, CheckSquare, Settings2, Loader2, Save, Calendar as CalIcon, Link2, AlertCircle, Lock } from 'lucide-react'
import type { WbsElement, WbsStatus } from '@/lib/wbs/constants'
import { createClient } from '@/utils/supabase/client'
import { updateActivityScheduling } from '@/lib/schedule/actions'
import { calculateFinishDate, calculateStartDate, countWorkingDays } from '@/lib/schedule/cpm'
import type { CalendarConfig } from '@/lib/schedule/cpm'

import { WbsBasicDetails } from './sidepanel/WbsBasicDetails'
import { WbsSchedulingFields } from './sidepanel/WbsSchedulingFields'
import { WbsDependenciesList } from './sidepanel/WbsDependenciesList'

type WbsElementSidePanelProps = {
  element: WbsElement | null
  workspaceMembers: { userId: string; name: string; email: string }[]
  onClose: () => void
  onSave: (id: string, updates: Partial<WbsElement>) => Promise<boolean>
  hasEditAccess: boolean
  customStatuses: string[]
  onAddCustomStatus: (newStatus: string) => void
}

type PredecessorInput = {
  predecessorId: string
  type: 'FS' | 'SS' | 'FF' | 'SF'
  lagDays: number
}

export function WbsElementSidePanel({
  element,
  workspaceMembers,
  onClose,
  onSave,
  hasEditAccess,
  customStatuses,
  onAddCustomStatus
}: WbsElementSidePanelProps) {
  // WBS Element States
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [deliverables, setDeliverables] = useState('')
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('')
  const [status, setStatus] = useState<WbsStatus>('Not Started')
  const [isWorkPackage, setIsWorkPackage] = useState(false)
  const [ownerId, setOwnerId] = useState<string>('')
  const [saving, setSaving] = useState(false)

  // Scheduling States (Activities & Dependencies)
  const [loadingSchedule, setLoadingSchedule] = useState(false)
  const [activityId, setActivityId] = useState<string | null>(null)
  
  // Reactively linked triad states
  const [autoSchedule, setAutoSchedule] = useState<boolean>(true)
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [duration, setDuration] = useState<number>(1)
  
  // Calendar config loaded from the active project
  const [calendar, setCalendar] = useState<CalendarConfig>({
    workingDays: [1, 2, 3, 4, 5],
    holidays: [],
  })

  const [projectActivities, setProjectActivities] = useState<any[]>([])
  const [predecessors, setPredecessors] = useState<PredecessorInput[]>([])
  const [scheduleError, setScheduleError] = useState<string | null>(null)

  // Sync state when active WBS element changes
  useEffect(() => {
    if (element) {
      setName(element.name)
      setDescription(element.description ?? '')
      setDeliverables(element.deliverables ?? '')
      setAcceptanceCriteria(element.acceptanceCriteria ?? '')
      setStatus(element.status)
      setIsWorkPackage(element.isWorkPackage)
      setOwnerId(element.ownerId ?? '')
      setScheduleError(null)

      // If it's a work package, fetch scheduling information
      if (element.isWorkPackage) {
        fetchSchedulingData(element.id, element.projectId)
      } else {
        setActivityId(null)
        setPredecessors([])
        setProjectActivities([])
      }
    }
  }, [element])

  // If work package toggle is clicked, fetch scheduling data if it becomes true
  useEffect(() => {
    if (isWorkPackage && element && !activityId) {
      fetchSchedulingData(element.id, element.projectId)
    }
  }, [isWorkPackage])

  const fetchSchedulingData = async (wbsId: string, projectId: string) => {
    setLoadingSchedule(true)
    setScheduleError(null)
    try {
      const supabase = createClient()
      
      // 0. Fetch project calendar details
      const { data: proj } = await supabase
        .from('projects')
        .select('start_date, calendar_config')
        .eq('id', projectId)
        .single()

      let activeCalendar: CalendarConfig = {
        workingDays: [1, 2, 3, 4, 5],
        holidays: [],
      }

      if (proj && proj.calendar_config) {
        const config = proj.calendar_config as any
        activeCalendar = {
          workingDays: config.working_days || [1, 2, 3, 4, 5],
          holidays: config.holidays || [],
        }
        setCalendar(activeCalendar)
      }
      
      // 1. Fetch activity associated with WBS
      const { data: act, error: actErr } = await supabase
        .from('activities')
        .select('*')
        .eq('wbs_element_id', wbsId)
        .maybeSingle()

      if (actErr) throw new Error(actErr.message)

      if (act) {
        setActivityId(act.id)
        setDuration(act.duration || 1)
        const isAuto = act.constraint_type === 'ASAP'
        setAutoSchedule(isAuto)
        
        // Use early start/finish dates computed by CPM engine
        setStartDate(act.es || '')
        setEndDate(act.ef || '')

        // 2. Fetch current predecessors
        const { data: deps, error: depErr } = await supabase
          .from('dependencies')
          .select('*')
          .eq('successor_id', act.id)

        if (depErr) throw new Error(depErr.message)

        setPredecessors(
          (deps || []).map((d) => ({
            predecessorId: d.predecessor_id,
            type: d.type,
            lagDays: d.lag_days,
          }))
        )
      } else {
        // Fallback default values if database trigger hasn't spawned it yet
        setActivityId(null)
        setDuration(1)
        setAutoSchedule(true)
        setStartDate('')
        setEndDate('')
        setPredecessors([])
      }

      // 3. Fetch all other candidate activities in the project
      const { data: allActs, error: allErr } = await supabase
        .from('activities')
        .select('id, name, wbs_element_id')
        .eq('project_id', projectId)
        .neq('wbs_element_id', wbsId)

      if (allErr) throw new Error(allErr.message)
      setProjectActivities(allActs || [])

    } catch (err: any) {
      console.error(err)
      setScheduleError('Failed to load scheduling data: ' + err.message)
    } finally {
      setLoadingSchedule(false)
    }
  }

  if (!element) return null

  // --- Linked Triad Handlers ---

  const handleDurationChange = (durVal: number) => {
    const nextDur = Math.max(1, durVal)
    setDuration(nextDur)

    if (startDate) {
      const nextEnd = calculateFinishDate(startDate, nextDur, calendar)
      setEndDate(nextEnd)
    }
  }

  const handleStartDateChange = (startVal: string) => {
    setStartDate(startVal)

    // In manual mode, adjust End Date to keep Duration fixed
    if (!autoSchedule && startVal && duration > 0) {
      const nextEnd = calculateFinishDate(startVal, duration, calendar)
      setEndDate(nextEnd)
    }
  }

  const handleEndDateChange = (endVal: string) => {
    setEndDate(endVal)

    // In manual mode, adjust Duration to fit the new range
    if (!autoSchedule && startDate && endVal) {
      const workingDaysCount = countWorkingDays(startDate, endVal, calendar)
      const nextDur = Math.max(1, workingDaysCount + 1)
      setDuration(nextDur)
    }
  }

  // Predecessor checkbox and inputs helpers
  const handleTogglePredecessor = (predId: string, checked: boolean) => {
    if (checked) {
      setPredecessors((prev) => [...prev, { predecessorId: predId, type: 'FS', lagDays: 0 }])
    } else {
      setPredecessors((prev) => prev.filter((p) => p.predecessorId !== predId))
    }
  }

  const handleUpdatePredType = (predId: string, type: 'FS' | 'SS' | 'FF' | 'SF') => {
    setPredecessors((prev) =>
      prev.map((p) => (p.predecessorId === predId ? { ...p, type } : p))
    )
  }

  const handleUpdatePredLag = (predId: string, lag: number) => {
    setPredecessors((prev) =>
      prev.map((p) => (p.predecessorId === predId ? { ...p, lagDays: Math.max(0, lag) } : p))
    )
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasEditAccess) return

    setSaving(true)
    setScheduleError(null)

    try {
      // 1. Save WBS element details first
      const wbsSuccess = await onSave(element.id, {
        name: name.trim(),
        description: description.trim() || null,
        deliverables: deliverables.trim() || null,
        acceptanceCriteria: acceptanceCriteria.trim() || null,
        status,
        isWorkPackage,
        ownerId: ownerId || null,
      })

      if (!wbsSuccess) {
        setSaving(false)
        return
      }

      // 2. If work package is active, save scheduling parameters (and propagate updates)
      if (isWorkPackage) {
        let activeActId = activityId
        const supabase = createClient()
        
        if (!activeActId) {
          const { data: newAct } = await supabase
            .from('activities')
            .select('id')
            .eq('wbs_element_id', element.id)
            .maybeSingle()
          if (newAct) activeActId = newAct.id
        }

        if (activeActId) {
          const constraintType = autoSchedule ? 'ASAP' : 'Start No Earlier Than'
          const constraintDate = autoSchedule ? null : (startDate || null)

          const schedRes = await updateActivityScheduling(element.projectId, activeActId, {
            duration,
            constraintType,
            constraintDate,
            predecessors,
          })

          if (!schedRes.ok) {
            setScheduleError(schedRes.error)
            setSaving(false)
            return // Stop submission, keep sidebar open for corrections
          }
        }
      }

      setSaving(false)
      onClose() // Close sidebar on success
    } catch (err: any) {
      console.error(err)
      setScheduleError(err.message)
      setSaving(false)
    }
  }

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-app-surface-solid border-l border-app-border shadow-2xl p-6 overflow-y-auto flex flex-col justify-between animate-fade-in-right">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-app-border mb-6 shrink-0">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-indigo-500" />
            <h3 className="text-lg font-bold text-app-fg">
              WBS Element Details <span className="text-sm font-normal text-app-muted">({element.code})</span>
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-app-subtle hover:text-app-fg hover:bg-app-hover transition-colors cursor-pointer"
            aria-label="Close panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Display scheduling error messages */}
        {scheduleError && (
          <div className="mb-4 p-4 border border-red-200 bg-red-50 dark:bg-red-500/10 dark:border-red-500/25 rounded-2xl flex items-start gap-3 shrink-0">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-red-800 dark:text-red-400">Scheduling Recalculation Blocked</span>
              <p className="text-[11px] text-red-700 dark:text-red-300 mt-1">{scheduleError}</p>
            </div>
          </div>
        )}

        {/* Form content scrolling area */}
        <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col justify-between overflow-y-auto pr-1">
          <div className="space-y-5 pb-6">
            <WbsBasicDetails
              name={name}
              setName={setName}
              ownerId={ownerId}
              setOwnerId={setOwnerId}
              status={status}
              setStatus={setStatus}
              isWorkPackage={isWorkPackage}
              setIsWorkPackage={setIsWorkPackage}
              description={description}
              setDescription={setDescription}
              deliverables={deliverables}
              setDeliverables={setDeliverables}
              acceptanceCriteria={acceptanceCriteria}
              setAcceptanceCriteria={setAcceptanceCriteria}
              hasEditAccess={hasEditAccess}
              saving={saving}
              workspaceMembers={workspaceMembers}
              customStatuses={customStatuses}
              onAddCustomStatus={onAddCustomStatus}
            />

            {/* --- REACTIVE CALENDAR & SCHEDULING SECTION (WORK PACKAGES ONLY) --- */}
            {isWorkPackage && (
              <div className="border border-indigo-500/25 bg-indigo-500/5 dark:bg-indigo-950/20 rounded-2xl p-4 space-y-4 shadow-xs">
                <WbsSchedulingFields
                  isWorkPackage={isWorkPackage}
                  autoSchedule={autoSchedule}
                  setAutoSchedule={setAutoSchedule}
                  loadingSchedule={loadingSchedule}
                  hasEditAccess={hasEditAccess}
                  saving={saving}
                  startDate={startDate}
                  handleStartDateChange={handleStartDateChange}
                  endDate={endDate}
                  handleEndDateChange={handleEndDateChange}
                  duration={duration}
                  handleDurationChange={handleDurationChange}
                />

                <WbsDependenciesList
                  isWorkPackage={isWorkPackage}
                  loadingSchedule={loadingSchedule}
                  projectActivities={projectActivities}
                  predecessors={predecessors}
                  hasEditAccess={hasEditAccess}
                  saving={saving}
                  handleTogglePredecessor={handleTogglePredecessor}
                  handleUpdatePredType={handleUpdatePredType}
                  handleUpdatePredLag={handleUpdatePredLag}
                />
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-6 border-t border-app-border mt-8 flex items-center justify-end gap-3 bg-app-surface-solid shrink-0">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            {hasEditAccess && (
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Dictionary
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  )
}

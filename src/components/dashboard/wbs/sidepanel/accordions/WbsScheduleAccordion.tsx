import { useState } from 'react'
import { Calendar as CalIcon, ChevronDown, ChevronRight } from 'lucide-react'
import { WbsSchedulingFields } from '../WbsSchedulingFields'
import { WbsDependenciesList } from '../WbsDependenciesList'

type WbsScheduleAccordionProps = {
  projectId: string | undefined
  wbsElementId: string | undefined
  isWorkPackage: boolean
  autoSchedule: boolean
  setAutoSchedule: (auto: boolean) => void
  isMilestone: boolean
  setIsMilestone: (milestone: boolean) => void
  loadingSchedule: boolean
  hasEditAccess: boolean
  saving: boolean
  startDate: string
  handleStartDateChange: (val: string) => void
  endDate: string
  handleEndDateChange: (val: string) => void
  duration: number
  handleDurationChange: (duration: number) => void
  projectActivities: any[]
  predecessors: any[]
  handleTogglePredecessor: (predId: string, checked: boolean) => void
  handleUpdatePredType: (predId: string, type: 'FS' | 'SS' | 'FF' | 'SF') => void
  handleUpdatePredLag: (predId: string, lag: number) => void
  onDependenciesChanged: () => void
  methodology?: string | null
}

export function WbsScheduleAccordion({
  projectId,
  wbsElementId,
  isWorkPackage,
  autoSchedule,
  setAutoSchedule,
  isMilestone,
  setIsMilestone,
  loadingSchedule,
  hasEditAccess,
  saving,
  startDate,
  handleStartDateChange,
  endDate,
  handleEndDateChange,
  duration,
  handleDurationChange,
  projectActivities,
  predecessors,
  handleTogglePredecessor,
  handleUpdatePredType,
  handleUpdatePredLag,
  onDependenciesChanged,
  methodology,
}: WbsScheduleAccordionProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border border-violet-500/25 rounded-xl overflow-hidden bg-violet-500/5 dark:bg-violet-950/20 shadow-xs">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-transparent hover:bg-violet-500/10 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-violet-700 dark:text-violet-400">
          <CalIcon className="w-4 h-4" />
          {isWorkPackage ? 'Scheduling & Dependencies' : 'External RAID Governance & Dependencies'}
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-violet-500/70" />
        ) : (
          <ChevronRight className="w-4 h-4 text-violet-500/70" />
        )}
      </button>

      {isOpen && (
        <div className="p-4 border-t border-violet-500/25 space-y-4">
          <WbsSchedulingFields
            isWorkPackage={isWorkPackage}
            autoSchedule={autoSchedule}
            setAutoSchedule={setAutoSchedule}
            isMilestone={isMilestone}
            setIsMilestone={setIsMilestone}
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
            projectId={projectId}
            wbsElementId={wbsElementId}
            onDependenciesChanged={onDependenciesChanged}
            methodology={methodology}
          />
        </div>
      )}
    </div>
  )
}

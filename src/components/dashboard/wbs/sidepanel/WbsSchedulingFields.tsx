import { Calendar as CalIcon, Lock, Loader2 } from 'lucide-react'

type WbsSchedulingFieldsProps = {
  isWorkPackage: boolean
  autoSchedule: boolean
  setAutoSchedule: (val: boolean) => void
  isMilestone: boolean
  setIsMilestone: (val: boolean) => void
  loadingSchedule: boolean
  hasEditAccess: boolean
  saving: boolean
  startDate: string
  handleStartDateChange: (val: string) => void
  endDate: string
  handleEndDateChange: (val: string) => void
  duration: number
  handleDurationChange: (val: number) => void
}

export function WbsSchedulingFields({
  isWorkPackage,
  autoSchedule, setAutoSchedule,
  isMilestone, setIsMilestone,
  loadingSchedule,
  hasEditAccess,
  saving,
  startDate, handleStartDateChange,
  endDate, handleEndDateChange,
  duration, handleDurationChange,
}: WbsSchedulingFieldsProps) {
  if (!isWorkPackage) return null

  return (
    <div className="border border-indigo-500/25 bg-indigo-500/5 dark:bg-indigo-950/20 rounded-2xl p-4 space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-indigo-500/10 pb-2">
        <div className="flex items-center gap-2">
          <CalIcon className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-bold text-indigo-500">📅 Schedule Properties</span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Milestone Toggle Switch */}
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-[10px] font-bold text-app-subtle">Milestone</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={isMilestone}
                disabled={!hasEditAccess || saving}
                onChange={(e) => setIsMilestone(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-app-border rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-amber-500" />
            </div>
          </label>

          {/* Auto-schedule Toggle Switch */}
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-[10px] font-bold text-app-subtle">Auto-Schedule</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={autoSchedule}
                disabled={!hasEditAccess || saving}
                onChange={(e) => setAutoSchedule(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-app-border rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-indigo-500" />
            </div>
          </label>
        </div>
      </div>

      {loadingSchedule ? (
        <div className="flex items-center justify-center py-4 gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          <span className="text-xs text-app-subtle">Syncing scheduling parameters...</span>
        </div>
      ) : (
        <>
          {/* The Start Date, End Date, and Duration Reactive Triad */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="space-y-1.5">
                <label htmlFor="sched-start" className="text-[11px] font-bold text-app-subtle flex items-center gap-1">
                  {autoSchedule && <Lock className="w-2.5 h-2.5 text-app-subtle" />}
                  Start Date
                </label>
                <input
                  id="sched-start"
                  type="date"
                  disabled={!hasEditAccess || saving || autoSchedule}
                  value={startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  onClick={(e) => {
                    if (!autoSchedule) {
                      try {
                        e.currentTarget.showPicker()
                      } catch (err) {}
                    }
                  }}
                  className="w-full px-3 py-1.5 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs disabled:opacity-60 cursor-pointer"
                />
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <label htmlFor="sched-end" className="text-[11px] font-bold text-app-subtle flex items-center gap-1">
                  {(autoSchedule || isMilestone) && <Lock className="w-2.5 h-2.5 text-app-subtle" />}
                  End Date
                </label>
                <input
                  id="sched-end"
                  type="date"
                  disabled={!hasEditAccess || saving || autoSchedule || isMilestone}
                  value={endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  onClick={(e) => {
                    if (!autoSchedule && !isMilestone) {
                      try {
                        e.currentTarget.showPicker()
                      } catch (err) {}
                    }
                  }}
                  className="w-full px-3 py-1.5 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs disabled:opacity-60 cursor-pointer"
                />
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <label htmlFor="sched-duration" className="text-[11px] font-bold text-app-subtle flex items-center gap-1">
                {isMilestone && <Lock className="w-2.5 h-2.5 text-app-subtle" />}
                Duration (Work Days)
              </label>
              <input
                id="sched-duration"
                type="number"
                min="0"
                disabled={!hasEditAccess || saving || isMilestone}
                value={duration}
                onChange={(e) => handleDurationChange(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-1.5 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs disabled:opacity-60"
              />
            </div>

            {autoSchedule ? (
              <p className="text-[10px] text-indigo-500 italic mt-1 leading-relaxed">
                ⚡ Auto-Schedule active: Dates are computed automatically from predecessor links. Turn toggle off to set manual constraints.
              </p>
            ) : (
              <p className="text-[10px] text-amber-500 italic mt-1 leading-relaxed">
                📌 Manual Schedule active: Dates are locked to constraints. Use "Auto-Schedule" to float based on predecessor dates.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

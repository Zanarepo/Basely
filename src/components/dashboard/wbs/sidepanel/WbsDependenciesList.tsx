import { Link2 } from 'lucide-react'

type PredecessorInput = {
  predecessorId: string
  type: 'FS' | 'SS' | 'FF' | 'SF'
  lagDays: number
}

type WbsDependenciesListProps = {
  isWorkPackage: boolean
  loadingSchedule: boolean
  projectActivities: any[]
  predecessors: PredecessorInput[]
  hasEditAccess: boolean
  saving: boolean
  handleTogglePredecessor: (predId: string, checked: boolean) => void
  handleUpdatePredType: (predId: string, type: 'FS' | 'SS' | 'FF' | 'SF') => void
  handleUpdatePredLag: (predId: string, lag: number) => void
}

export function WbsDependenciesList({
  isWorkPackage,
  loadingSchedule,
  projectActivities,
  predecessors,
  hasEditAccess,
  saving,
  handleTogglePredecessor,
  handleUpdatePredType,
  handleUpdatePredLag,
}: WbsDependenciesListProps) {
  if (!isWorkPackage || loadingSchedule) return null

  return (
    <div className="space-y-2 pt-2 border-t border-indigo-500/10">
      <label className="text-[11px] font-bold text-app-subtle flex items-center gap-1">
        <Link2 className="w-3.5 h-3.5" />
        Dependencies (Predecessors)
      </label>
      
      {projectActivities.length === 0 ? (
        <p className="text-[10px] text-app-subtle italic">No other tasks available to link.</p>
      ) : (
        <div className="max-h-36 overflow-y-auto border border-app-border rounded-xl p-2.5 bg-app-input space-y-2">
          {projectActivities.map((act) => {
            const isLinked = predecessors.some((p) => p.predecessorId === act.id)
            const currentPred = predecessors.find((p) => p.predecessorId === act.id)

            return (
              <div key={act.id} className="flex flex-col gap-1.5 pb-2 border-b border-app-border/40 last:border-b-0">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={isLinked}
                    disabled={!hasEditAccess || saving}
                    onChange={(e) => handleTogglePredecessor(act.id, e.target.checked)}
                    className="rounded-xs border-app-border text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                  />
                  <span className="truncate flex-1 font-semibold text-app-fg">{act.name}</span>
                </label>

                {isLinked && currentPred && (
                  <div className="pl-5 flex items-center gap-2 animate-fade-in">
                    <select
                      value={currentPred.type}
                      disabled={!hasEditAccess || saving}
                      onChange={(e) => handleUpdatePredType(act.id, e.target.value as any)}
                      className="px-2 py-0.5 bg-app-surface-solid border border-app-border rounded-lg text-[10px] text-app-fg"
                    >
                      <option value="FS">Finish-to-Start (FS)</option>
                      <option value="SS">Start-to-Start (SS)</option>
                      <option value="FF">Finish-to-Finish (FF)</option>
                      <option value="SF">Start-to-Finish (SF)</option>
                    </select>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-app-subtle">Lag:</span>
                      <input
                        type="number"
                        min="0"
                        value={currentPred.lagDays}
                        disabled={!hasEditAccess || saving}
                        onChange={(e) => handleUpdatePredLag(act.id, parseInt(e.target.value) || 0)}
                        className="w-10 px-1 py-0.5 bg-app-surface-solid border border-app-border rounded-lg text-center text-[10px] text-app-fg"
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

import { CheckSquare, AlertCircle } from 'lucide-react'

export default function ReleaseChecklistSummaryWidget({
  exitCriteriaPct,
  readinessPct
}: {
  exitCriteriaPct: number
  readinessPct: number
}) {
  const isReady = exitCriteriaPct === 100 && readinessPct === 100

  return (
    <div className="bg-white dark:bg-app-surface border border-app-border rounded-3xl p-6 shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-all">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-app-fg">Checklist Completion</h3>
          <CheckSquare className="h-5 w-5 text-indigo-500" />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 dark:bg-app-hover rounded-2xl p-3 border border-app-border text-center">
            <div className="text-[10px] text-app-muted font-bold uppercase tracking-wider mb-1">
              Exit Criteria
            </div>
            <div className={`text-xl font-extrabold ${exitCriteriaPct === 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
              {exitCriteriaPct}%
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-app-hover rounded-2xl p-3 border border-app-border text-center">
            <div className="text-[10px] text-app-muted font-bold uppercase tracking-wider mb-1">
              Readiness
            </div>
            <div className={`text-xl font-extrabold ${readinessPct === 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
              {readinessPct}%
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 mt-2">
          {isReady ? (
            <>
              <div className="p-1 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <CheckSquare className="h-4 w-4" />
              </div>
              <p className="text-xs text-app-muted font-medium mt-0.5">All checklists are complete. The release is fully documented and ready.</p>
            </>
          ) : (
            <>
              <div className="p-1 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                <AlertCircle className="h-4 w-4" />
              </div>
              <p className="text-xs text-app-muted font-medium mt-0.5">Some items are incomplete. Ensure all criteria and readiness items are met before deployment.</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

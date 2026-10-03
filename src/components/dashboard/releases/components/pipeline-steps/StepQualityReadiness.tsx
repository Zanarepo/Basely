import React from 'react'
import {
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Loader2,
  ListTodo
} from 'lucide-react'

interface StepQualityReadinessProps {
  readinessPercent: number
  completedQualityChecks: number
  totalQualityChecks: number
  localExitCriteria: { id: string; criterionText: string; isMet: boolean }[]
  localReadinessItems: { id: string; category: string; itemText: string; isChecked: boolean }[]
  hasEditAccess: boolean
  newCriterion: string
  setNewCriterion: (val: string) => void
  addingCriterion: boolean
  handleAddExitCriterionSubmit: (e: React.FormEvent) => Promise<void>
  handleToggleCriterionOptimistic: (id: string, isMet: boolean) => Promise<void>
  handleDeleteCriterionOptimistic: (id: string) => Promise<void>
  newReadiness: string
  setNewReadiness: (val: string) => void
  addingReadiness: boolean
  handleAddReadinessItemSubmit: (e: React.FormEvent) => Promise<void>
  handleToggleReadinessOptimistic: (id: string, isChecked: boolean) => Promise<void>
  handleDeleteReadinessOptimistic: (id: string) => Promise<void>
}

export function StepQualityReadiness({
  readinessPercent,
  completedQualityChecks,
  totalQualityChecks,
  localExitCriteria,
  localReadinessItems,
  hasEditAccess,
  newCriterion,
  setNewCriterion,
  addingCriterion,
  handleAddExitCriterionSubmit,
  handleToggleCriterionOptimistic,
  handleDeleteCriterionOptimistic,
  newReadiness,
  setNewReadiness,
  addingReadiness,
  handleAddReadinessItemSubmit,
  handleToggleReadinessOptimistic,
  handleDeleteReadinessOptimistic
}: StepQualityReadinessProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Release Quality Score: {readinessPercent}%
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              {completedQualityChecks} of {totalQualityChecks} exit criteria & quality checklist items verified.
            </p>
          </div>
        </div>
        <div className="w-24 h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${readinessPercent}%` }}
          />
        </div>
      </div>

      {/* Exit Criteria Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          1. Governance Exit Criteria
        </h4>

        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          {localExitCriteria.length === 0 ? (
            <p className="p-4 text-xs text-slate-500 italic text-center">No exit criteria added yet.</p>
          ) : (
            localExitCriteria.map((criterion) => (
              <div
                key={criterion.id}
                className="flex items-center justify-between p-3.5 px-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <label className="flex items-center gap-3 cursor-pointer min-w-0 flex-1">
                  <input
                    type="checkbox"
                    checked={criterion.isMet}
                    onChange={(e) => handleToggleCriterionOptimistic(criterion.id, e.target.checked)}
                    disabled={!hasEditAccess}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-500 focus:ring-emerald-500 bg-white dark:bg-slate-950 cursor-pointer"
                  />
                  <span
                    className={`text-xs font-semibold ${
                      criterion.isMet ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {criterion.criterionText}
                  </span>
                </label>

                {hasEditAccess && (
                  <button
                    type="button"
                    onClick={() => handleDeleteCriterionOptimistic(criterion.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {hasEditAccess && (
          <form onSubmit={handleAddExitCriterionSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={newCriterion}
              onChange={(e) => setNewCriterion(e.target.value)}
              disabled={addingCriterion}
              placeholder="Add mandatory exit criterion (e.g. All QA regression tests passed 100%)..."
              className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={addingCriterion || !newCriterion.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer shrink-0 disabled:opacity-50 shadow-sm"
            >
              {addingCriterion ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <span>Add Criterion</span>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Technical Readiness Items Section */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <ListTodo className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          2. Technical Operations & Deployment Checklist
        </h4>

        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          {localReadinessItems.length === 0 ? (
            <p className="p-4 text-xs text-slate-500 italic text-center">No technical readiness items added yet.</p>
          ) : (
            localReadinessItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 px-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <label className="flex items-center gap-3 cursor-pointer min-w-0 flex-1">
                  <input
                    type="checkbox"
                    checked={item.isChecked}
                    onChange={(e) => handleToggleReadinessOptimistic(item.id, e.target.checked)}
                    disabled={!hasEditAccess}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-emerald-500 focus:ring-emerald-500 bg-white dark:bg-slate-950 cursor-pointer"
                  />
                  <span
                    className={`text-xs font-semibold ${
                      item.isChecked ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span className="text-purple-600 dark:text-purple-400 font-bold mr-1.5 font-mono text-[10px]">
                      [{item.category}]
                    </span>
                    {item.itemText}
                  </span>
                </label>

                {hasEditAccess && (
                  <button
                    type="button"
                    onClick={() => handleDeleteReadinessOptimistic(item.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {hasEditAccess && (
          <form onSubmit={handleAddReadinessItemSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={newReadiness}
              onChange={(e) => setNewReadiness(e.target.value)}
              disabled={addingReadiness}
              placeholder="Add deployment checklist item (e.g. Run production DB migrations)..."
              className="flex-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={addingReadiness || !newReadiness.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all cursor-pointer shrink-0 disabled:opacity-50 shadow-sm"
            >
              {addingReadiness ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <span>Add Checklist Item</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

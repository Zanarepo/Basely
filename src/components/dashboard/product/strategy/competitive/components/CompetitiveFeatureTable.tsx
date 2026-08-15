import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { CompetitorFeature } from '../constants/types'

interface CompetitiveFeatureTableProps {
  features: CompetitorFeature[]
  competitorAName: string
  setCompetitorAName: (val: string) => void
  competitorBName: string
  setCompetitorBName: (val: string) => void
  hasEditAccess: boolean
  onAddFeature: () => void
  onDeleteFeature: (id: string) => void
  onUpdateFeature: (updated: CompetitorFeature[]) => void
  setIsDirty: (dirty: boolean) => void
}

export function CompetitiveFeatureTable({
  features,
  competitorAName,
  setCompetitorAName,
  competitorBName,
  setCompetitorBName,
  hasEditAccess,
  onAddFeature,
  onDeleteFeature,
  onUpdateFeature,
  setIsDirty,
}: CompetitiveFeatureTableProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Feature Parity & Competitive Benchmarking Matrix
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Evaluate feature depth and market differentiators across key market alternatives.
          </p>
        </div>

        {hasEditAccess && (
          <button
            type="button"
            style={{ cursor: 'pointer' }}
            onClick={onAddFeature}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-300 font-bold text-xs hover:bg-violet-500/20 border border-violet-500/30 transition-all cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4 text-violet-500" />
            <span>Add Feature Dimension</span>
          </button>
        )}
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
              <th className="py-3 px-4 min-w-[220px]">Feature Dimension</th>
              <th className="py-3 px-4 min-w-[140px] text-violet-600 dark:text-violet-400 font-black">
                🚀 Your Product
              </th>
              <th className="py-3 px-4 min-w-[140px]">
                <input
                  type="text"
                  value={competitorAName}
                  onChange={(e) => {
                    setCompetitorAName(e.target.value)
                    setIsDirty(true)
                  }}
                  className="bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-violet-500"
                />
              </th>
              <th className="py-3 px-4 min-w-[140px]">
                <input
                  type="text"
                  value={competitorBName}
                  onChange={(e) => {
                    setCompetitorBName(e.target.value)
                    setIsDirty(true)
                  }}
                  className="bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-violet-500"
                />
              </th>
              <th className="py-3 px-4 min-w-[240px]">Notes & Market Insights</th>
              {hasEditAccess && <th className="py-3 px-4 w-12 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {features.map((feat) => (
              <tr key={feat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                {/* Feature Name */}
                <td className="py-3 px-4">
                  <input
                    type="text"
                    value={feat.featureName}
                    onChange={(e) => {
                      const next = features.map((f) => (f.id === feat.id ? { ...f, featureName: e.target.value } : f))
                      onUpdateFeature(next)
                      setIsDirty(true)
                    }}
                    className="w-full bg-transparent font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-b focus:border-violet-500"
                  />
                </td>

                {/* Our Product Selector */}
                <td className="py-3 px-4">
                  <select
                    value={feat.ourProduct}
                    onChange={(e) => {
                      const next = features.map((f) => (f.id === feat.id ? { ...f, ourProduct: e.target.value as any } : f))
                      onUpdateFeature(next)
                      setIsDirty(true)
                    }}
                    className="bg-transparent text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="moat">✨ Moat (Proprietary)</option>
                    <option value="leading">✅ Leading</option>
                    <option value="partial">⚠️ Partial</option>
                    <option value="gap">❌ Gap</option>
                  </select>
                </td>

                {/* Competitor A */}
                <td className="py-3 px-4">
                  <select
                    value={feat.competitorA}
                    onChange={(e) => {
                      const next = features.map((f) => (f.id === feat.id ? { ...f, competitorA: e.target.value as any } : f))
                      onUpdateFeature(next)
                      setIsDirty(true)
                    }}
                    className="bg-transparent text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="leading">✅ Leading</option>
                    <option value="partial">⚠️ Partial</option>
                    <option value="gap">❌ Gap</option>
                  </select>
                </td>

                {/* Competitor B */}
                <td className="py-3 px-4">
                  <select
                    value={feat.competitorB}
                    onChange={(e) => {
                      const next = features.map((f) => (f.id === feat.id ? { ...f, competitorB: e.target.value as any } : f))
                      onUpdateFeature(next)
                      setIsDirty(true)
                    }}
                    className="bg-transparent text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="leading">✅ Leading</option>
                    <option value="partial">⚠️ Partial</option>
                    <option value="gap">❌ Gap</option>
                  </select>
                </td>

                {/* Notes */}
                <td className="py-3 px-4">
                  <input
                    type="text"
                    value={feat.notes || ''}
                    onChange={(e) => {
                      const next = features.map((f) => (f.id === feat.id ? { ...f, notes: e.target.value } : f))
                      onUpdateFeature(next)
                      setIsDirty(true)
                    }}
                    placeholder="Add strategic insight..."
                    className="w-full bg-transparent text-slate-600 dark:text-slate-400 focus:outline-none focus:border-b focus:border-violet-500"
                  />
                </td>

                {/* Actions */}
                {hasEditAccess && (
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      style={{ cursor: 'pointer' }}
                      onClick={() => onDeleteFeature(feat.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Delete feature row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

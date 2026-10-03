import React, { useState } from 'react'
import { Plus, Trash2, Sparkles, Loader2, Edit2, ShieldAlert, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { CompetitorFeature } from '../constants/types'
import { CompetitiveFeatureModal } from './CompetitiveFeatureModal'

const getStatusLabel = (val: string) => {
  switch (val) {
    case 'moat': return <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400"><ShieldAlert className="w-3.5 h-3.5" /> Moat (Proprietary)</span>
    case 'leading': return <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Leading</span>
    case 'partial': return <span className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400"><AlertTriangle className="w-3.5 h-3.5" /> Partial</span>
    case 'gap': return <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400"><XCircle className="w-3.5 h-3.5" /> Gap</span>
    default: return val
  }
}

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
  onAutoGenerate?: () => void
  generating?: boolean
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
  onAutoGenerate,
  generating = false,
}: CompetitiveFeatureTableProps) {
  const [modalFeature, setModalFeature] = useState<CompetitorFeature | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenModal = (feat?: CompetitorFeature) => {
    setModalFeature(feat || null)
    setIsModalOpen(true)
  }

  const handleSaveModal = (savedFeat: CompetitorFeature) => {
    setIsModalOpen(false)
    if (modalFeature) {
      const next = features.map(f => f.id === savedFeat.id ? savedFeat : f)
      onUpdateFeature(next)
    } else {
      const next = [...features, savedFeat]
      onUpdateFeature(next)
    }
    setIsDirty(true)
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Competitive Benchmarking Matrix
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Evaluate feature depth and market differentiators across alternatives.
          </p>
        </div>

        {hasEditAccess && (
          <div className="flex items-center gap-3">
            {onAutoGenerate && (
              <button
                type="button"
                style={{ cursor: generating ? 'not-allowed' : 'pointer' }}
                onClick={onAutoGenerate}
                disabled={generating}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs hover:from-violet-500 hover:to-indigo-500 transition-all shadow-md whitespace-nowrap"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                ) : (
                  <Sparkles className="w-4 h-4 shrink-0" />
                )}
                <span>{generating ? 'Generating...' : 'Auto-Generate via AI'}</span>
              </button>
            )}
            
            <button
              type="button"
              style={{ cursor: 'pointer' }}
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-300 font-bold text-xs hover:bg-violet-500/20 border border-violet-500/30 transition-all cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 text-violet-500 shrink-0" />
              <span className="hidden sm:inline">Add Feature</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        )}
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
              <th className="py-3 px-4 min-w-[180px]">Feature Dimension</th>
              <th className="py-3 px-4 min-w-[120px] text-violet-600 dark:text-violet-400 font-black">
                Your Product
              </th>
              <th className="py-3 px-4 min-w-[120px]">
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
              <th className="py-3 px-4 min-w-[120px]">
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
              <th className="py-3 px-4 min-w-[180px]">Notes & Market Insights</th>
              {hasEditAccess && <th className="py-3 px-4 w-16 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {features.map((feat) => (
              <tr key={feat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors group">
                <td className="py-3 px-4 text-slate-900 dark:text-slate-100 font-bold">
                  {feat.featureName}
                </td>
                <td className="py-3 px-4 text-xs font-bold text-slate-800 dark:text-slate-200">
                  {getStatusLabel(feat.ourProduct)}
                </td>
                <td className="py-3 px-4 text-xs text-slate-700 dark:text-slate-300">
                  {getStatusLabel(feat.competitorA)}
                </td>
                <td className="py-3 px-4 text-xs text-slate-700 dark:text-slate-300">
                  {getStatusLabel(feat.competitorB)}
                </td>
                <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400 max-w-[200px] truncate" title={feat.notes}>
                  {feat.notes || '-'}
                </td>
                {hasEditAccess && (
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleOpenModal(feat)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-500/10 transition-colors"
                        title="Edit feature row"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        style={{ cursor: 'pointer' }}
                        onClick={() => onDeleteFeature(feat.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                        title="Delete feature row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <CompetitiveFeatureModal
          feature={modalFeature || undefined}
          onClose={() => setIsModalOpen(false)}
          onSaved={handleSaveModal}
        />
      )}
    </div>
  )
}

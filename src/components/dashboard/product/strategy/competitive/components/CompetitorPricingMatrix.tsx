import React, { useState } from 'react'
import { Plus, Trash2, Edit2, DollarSign } from 'lucide-react'
import { CompetitorPricingItem } from '../constants/types'

function renderTextWithLinks(text: string) {
  if (!text) return '-'
  
  // Regex to match markdown links: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  const parts = []
  let lastIndex = 0
  let match

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index))
    }
    parts.push(
      <a 
        key={match.index} 
        href={match[2]} 
        target="_blank" 
        rel="noopener noreferrer"
        className="underline font-bold hover:text-opacity-80 transition-opacity"
      >
        {match[1]}
      </a>
    )
    lastIndex = linkRegex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return <>{parts.length > 0 ? parts : text}</>
}

interface CompetitorPricingMatrixProps {
  pricing: CompetitorPricingItem[]
  competitorAName: string
  competitorBName: string
  hasEditAccess: boolean
  onUpdate: (updated: CompetitorPricingItem[]) => void
  setIsDirty: (dirty: boolean) => void
}

export function CompetitorPricingMatrix({
  pricing,
  competitorAName,
  competitorBName,
  hasEditAccess,
  onUpdate,
  setIsDirty,
}: CompetitorPricingMatrixProps) {
  const [modalItem, setModalItem] = useState<CompetitorPricingItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Local state for modal form
  const [dimensionName, setDimensionName] = useState('')
  const [ourProduct, setOurProduct] = useState('')
  const [competitorA, setCompetitorA] = useState('')
  const [competitorB, setCompetitorB] = useState('')

  const handleOpenModal = (item?: CompetitorPricingItem) => {
    if (item) {
      setModalItem(item)
      setDimensionName(item.dimensionName)
      setOurProduct(item.ourProduct)
      setCompetitorA(item.competitorA)
      setCompetitorB(item.competitorB)
    } else {
      setModalItem(null)
      setDimensionName('')
      setOurProduct('')
      setCompetitorA('')
      setCompetitorB('')
    }
    setIsModalOpen(true)
  }

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault()
    setIsModalOpen(false)
    const newItem: CompetitorPricingItem = {
      id: modalItem?.id || `p_${Date.now()}`,
      dimensionName,
      ourProduct,
      competitorA,
      competitorB,
    }
    if (modalItem) {
      onUpdate(pricing.map(p => p.id === newItem.id ? newItem : p))
    } else {
      onUpdate([...pricing, newItem])
    }
    setIsDirty(true)
  }

  const handleDelete = (id: string) => {
    onUpdate(pricing.filter(p => p.id !== id))
    setIsDirty(true)
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Competitive Pricing Matrix
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Compare business models, pricing tiers, and discounting strategies.
          </p>
        </div>

        {hasEditAccess && (
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-300 font-bold text-xs hover:bg-violet-500/20 border border-violet-500/30 transition-all cursor-pointer shadow-2xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-violet-500 shrink-0" />
            <span>Add Dimension</span>
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
              <th className="py-3 px-4 min-w-[180px]">Pricing Dimension</th>
              <th className="py-3 px-4 min-w-[120px] text-violet-600 dark:text-violet-400 font-black">
                Your Product
              </th>
              <th className="py-3 px-4 min-w-[120px]">{competitorAName}</th>
              <th className="py-3 px-4 min-w-[120px]">{competitorBName}</th>
              {hasEditAccess && <th className="py-3 px-4 w-16 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
            {pricing.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors group">
                <td className="py-3 px-4 text-slate-900 dark:text-slate-100 font-bold">
                  {item.dimensionName}
                </td>
                <td className="py-3 px-4 text-emerald-700 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/10 [&_a]:text-emerald-600 [&_a:hover]:underline [&_a]:font-bold">
                  {renderTextWithLinks(item.ourProduct)}
                </td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-300 [&_a]:text-violet-500 [&_a:hover]:underline [&_a]:font-bold">
                  {renderTextWithLinks(item.competitorA)}
                </td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-300 [&_a]:text-violet-500 [&_a:hover]:underline [&_a]:font-bold">
                  {renderTextWithLinks(item.competitorB)}
                </td>
                {hasEditAccess && (
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenModal(item)}
                        className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer"
                        title="Edit Dimension"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors cursor-pointer"
                        title="Delete Dimension"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-sm animate-fade-in pointer-events-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-slide-up">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {modalItem ? 'Edit Pricing Dimension' : 'Add Pricing Dimension'}
                </h3>
                <p className="text-[10px] text-slate-500">Configure pricing comparison across the market</p>
              </div>
            </div>

            <form onSubmit={handleSaveModal} className="p-4 sm:p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Dimension Name</label>
                <input
                  type="text"
                  required
                  value={dimensionName}
                  onChange={e => setDimensionName(e.target.value)}
                  placeholder="e.g. Starting Price, Contract Term"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider">Your Product</label>
                <input
                  type="text"
                  value={ourProduct}
                  onChange={e => setOurProduct(e.target.value)}
                  placeholder="e.g. $49/mo"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider truncate">{competitorAName}</label>
                  <input
                    type="text"
                    value={competitorA}
                    onChange={e => setCompetitorA(e.target.value)}
                    placeholder="e.g. $99/mo"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider truncate">{competitorBName}</label>
                  <input
                    type="text"
                    value={competitorB}
                    onChange={e => setCompetitorB(e.target.value)}
                    placeholder="e.g. Enterprise Custom"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors shadow-md cursor-pointer"
                >
                  Save Dimension
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

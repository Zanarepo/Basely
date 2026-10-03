'use client'

import React, { useState, useEffect } from 'react'
import { X, Save, ShieldAlert, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'
import { CompetitorFeature } from '../constants/types'

interface CompetitiveFeatureModalProps {
  feature?: CompetitorFeature
  onClose: () => void
  onSaved: (feature: CompetitorFeature) => void
}

const statusOptions = [
  { value: 'moat', label: 'Moat (Proprietary)', icon: <ShieldAlert className="w-4 h-4 text-blue-500" /> },
  { value: 'leading', label: 'Leading', icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> },
  { value: 'partial', label: 'Partial', icon: <AlertTriangle className="w-4 h-4 text-orange-500" /> },
  { value: 'gap', label: 'Gap', icon: <XCircle className="w-4 h-4 text-rose-500" /> }
]

export function CompetitiveFeatureModal({ feature, onClose, onSaved }: CompetitiveFeatureModalProps) {
  const [featureName, setFeatureName] = useState('')
  const [ourProduct, setOurProduct] = useState<'moat'|'leading'|'partial'|'gap'>('leading')
  const [competitorA, setCompetitorA] = useState<'moat'|'leading'|'partial'|'gap'>('partial')
  const [competitorB, setCompetitorB] = useState<'moat'|'leading'|'partial'|'gap'>('gap')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (feature) {
      setFeatureName(feature.featureName)
      setOurProduct(feature.ourProduct)
      setCompetitorA(feature.competitorA)
      setCompetitorB(feature.competitorB)
      setNotes(feature.notes || '')
    }
  }, [feature])

  const handleSave = () => {
    if (!featureName.trim()) return

    onSaved({
      id: feature?.id || `f_${Date.now()}`,
      featureName: featureName.trim(),
      ourProduct,
      competitorA,
      competitorB,
      notes: notes.trim(),
    })
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-app-bg w-full max-w-lg rounded-2xl shadow-xl flex flex-col border border-app-border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-app-border shrink-0 bg-app-card">
          <h2 className="font-bold text-app-fg text-lg">{feature ? 'Edit Feature' : 'New Feature'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-app-hover rounded-lg text-app-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-bold text-app-fg uppercase tracking-wider mb-1.5">Feature Name</label>
            <input
              type="text"
              value={featureName}
              onChange={(e) => setFeatureName(e.target.value)}
              placeholder="e.g. Real-Time Analytics"
              className="w-full px-3 py-2 bg-app-surface border border-app-border rounded-xl text-sm text-app-fg focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-app-fg uppercase tracking-wider mb-1.5">Your Product</label>
              <EnterpriseSelect
                value={ourProduct}
                onChange={setOurProduct}
                options={statusOptions}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-app-fg uppercase tracking-wider mb-1.5">Competitor A</label>
              <EnterpriseSelect
                value={competitorA}
                onChange={setCompetitorA}
                options={statusOptions}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-app-fg uppercase tracking-wider mb-1.5">Competitor B</label>
              <EnterpriseSelect
                value={competitorB}
                onChange={setCompetitorB}
                options={statusOptions}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-app-fg uppercase tracking-wider mb-1.5">Notes & Insights</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add market context or specific details..."
              rows={3}
              className="w-full px-3 py-2 bg-app-surface border border-app-border rounded-xl text-sm text-app-fg focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>
        </div>

        <div className="p-4 border-t border-app-border shrink-0 bg-app-card flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-app-fg bg-app-surface border border-app-border hover:bg-app-hover rounded-xl transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={!featureName.trim()} className="px-5 py-2 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-xl flex items-center gap-2 transition-all">
            <Save className="w-4 h-4" />
            Save Feature
          </button>
        </div>
      </div>
    </div>
  )
}

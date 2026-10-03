import React from 'react'
import { Sparkles, X, AlertTriangle, ShieldAlert, GitBranch, Loader2, Check } from 'lucide-react'
import { PredictedRaidEntry } from '@/lib/raid/ai-raid-actions'

interface AiRaidCopilotModalProps {
  isOpen: boolean
  isPredicting: boolean
  isSaving: boolean
  predictions: PredictedRaidEntry[]
  selectedIndices: Set<number>
  onClose: () => void
  onToggleSelection: (index: number) => void
  onCommit: () => void
}

export function AiRaidCopilotModal({
  isOpen,
  isPredicting,
  isSaving,
  predictions,
  selectedIndices,
  onClose,
  onToggleSelection,
  onCommit
}: AiRaidCopilotModalProps) {
  if (!isOpen) return null

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'risk':
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 uppercase tracking-wider">🛡️ Risk</span>
      case 'assumption':
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 uppercase tracking-wider">💡 Assumption</span>
      case 'issue':
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/25 uppercase tracking-wider">🔥 Issue</span>
      case 'dependency':
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 uppercase tracking-wider">🧩 Dependency</span>
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-3xl bg-app-surface border border-app-border rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-app-border bg-violet-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-app-fg text-lg leading-tight">Predictive Praz-AI Analysis</h3>
              <p className="text-xs text-app-muted">Scanning schedule slippage, budget burns, and dependencies.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={isPredicting || isSaving}
            className="p-2 hover:bg-app-input rounded-xl text-app-muted hover:text-app-fg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-app-bg/30">
          {isPredicting ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-4" />
              <h4 className="font-bold text-app-fg mb-1">Praz-AI is analyzing project pulse...</h4>
              <p className="text-sm text-app-muted max-w-md">
                Checking Gantt baseline completion rates, WBS cost allocations, and upstream dependencies to predict future bottlenecks.
              </p>
            </div>
          ) : predictions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Check className="w-10 h-10 text-emerald-500 mb-4" />
              <h4 className="font-bold text-app-fg mb-1">Project is Healthy</h4>
              <p className="text-sm text-app-muted">
                Praz-AI found no immediate predictive risks, bottlenecks, or critical slippages.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-app-fg font-medium mb-2">
                Praz-AI identified {predictions.length} potential bottlenecks. Select the ones to commit to the active RAID log.
              </p>
              
              <div className="grid grid-cols-1 gap-3">
                {predictions.map((pred, idx) => {
                  const isSelected = selectedIndices.has(idx)
                  return (
                    <div 
                      key={idx}
                      onClick={() => onToggleSelection(idx)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex gap-4 ${
                        isSelected 
                          ? 'bg-violet-500/5 border-violet-500/30 shadow-sm' 
                          : 'bg-app-surface border-app-border hover:border-violet-500/30'
                      }`}
                    >
                      {/* Checkbox */}
                      <div className="pt-1 shrink-0">
                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                          isSelected ? 'bg-violet-600 border-violet-600' : 'bg-app-input border-app-border'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          {getCategoryBadge(pred.category)}
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${
                            pred.priority === 'critical' ? 'text-red-400' :
                            pred.priority === 'high' ? 'text-amber-400' :
                            pred.priority === 'medium' ? 'text-violet-400' : 'text-slate-400'
                          }`}>
                            {pred.priority} Priority
                          </span>
                        </div>
                        <h4 className="font-bold text-app-fg text-sm mb-1">{pred.title}</h4>
                        <p className="text-xs text-app-muted mb-3 leading-relaxed">
                          {pred.description}
                        </p>
                        
                        {pred.mitigation_plan && (
                          <div className="bg-app-input/50 p-3 rounded-lg border border-app-border">
                            <span className="text-[10px] font-bold text-app-muted uppercase mb-1 block">Suggested Mitigation</span>
                            <p className="text-xs text-app-fg">{pred.mitigation_plan}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-app-border bg-app-surface flex items-center justify-between">
          <div className="text-sm font-medium text-app-muted">
            {!isPredicting && predictions.length > 0 && (
              <span>{selectedIndices.size} of {predictions.length} selected</span>
            )}
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-app-fg hover:bg-app-input transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onCommit}
              disabled={isPredicting || isSaving || selectedIndices.size === 0}
              className="px-5 py-2.5 rounded-xl font-bold text-sm bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <>Add Selected to RAID Log</>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

import React from 'react'
import { X, Layers, AlertCircle } from 'lucide-react'

interface SprintBacklogModalProps {
  isOpen: boolean
  onClose: () => void
  sprintName?: string
  items: { id: string; title: string; code?: string; type: string; isMilestone?: boolean }[]
}

export function SprintBacklogModal({ isOpen, onClose, sprintName, items }: SprintBacklogModalProps) {
  if (!isOpen) return null

  const displayItems = items.filter(i => !i.isMilestone && i.type === 'wbs_element')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-app-surface w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-app-border animate-in slide-in-from-bottom-8 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-app-border bg-app-card">
          <div>
            <h2 className="text-xl font-bold text-app-fg">Sprint Backlog</h2>
            <p className="text-sm text-app-muted mt-1">{sprintName || 'Active Sprint'}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-app-muted hover:text-app-fg hover:bg-app-hover rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {displayItems.length === 0 ? (
            <div className="text-center p-8 bg-app-card border border-app-border border-dashed rounded-2xl">
              <AlertCircle className="w-8 h-8 text-app-muted mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-app-fg">No Items Committed</h3>
              <p className="text-xs text-app-muted mt-1">This sprint is currently empty.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayItems.map(item => (
                <div key={item.id} className="flex items-start gap-3 p-3 bg-app-card border border-app-border rounded-xl">
                  <div className="mt-0.5 p-1.5 bg-violet-50 dark:bg-violet-500/10 rounded-lg shrink-0">
                    <Layers className="w-4 h-4 text-violet-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-app-fg">{item.title}</h4>
                    {item.code && <p className="text-[11px] text-app-muted mt-0.5 uppercase tracking-wide">{item.code}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-app-border bg-app-card flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-app-hover text-app-fg text-sm font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

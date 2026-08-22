'use client'

import React from 'react'
import { X, FileText, Plus, ShieldAlert, Sparkles } from 'lucide-react'

interface LogRiskChoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectManual: () => void
  onSelectImport: () => void
  onSelectScan: () => void
}

export function LogRiskChoiceModal({
  isOpen,
  onClose,
  onSelectManual,
  onSelectImport,
  onSelectScan
}: LogRiskChoiceModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-app-surface w-full max-w-4xl rounded-2xl shadow-xl flex flex-col border border-app-border overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-6 border-b border-app-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-app-fg">Log a New Risk</h2>
              <p className="text-sm text-app-muted">How would you like to add a risk to the database?</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-app-muted cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => {
              onSelectManual()
              onClose()
            }}
            className="group flex flex-col p-6 rounded-2xl border-2 border-app-border hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-500/5 transition-all text-left cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 group-hover:bg-violet-100 dark:group-hover:bg-violet-500/20 flex items-center justify-center mb-4 transition-colors">
              <Plus className="w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-app-fg mb-2">Manual Entry</h3>
            <p className="text-sm text-app-muted">Create a new risk from scratch by filling out the probability, impact, and mitigation form.</p>
          </button>

          <button
            onClick={() => {
              onSelectImport()
              onClose()
            }}
            className="group flex flex-col p-6 rounded-2xl border-2 border-app-border hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-500/5 transition-all text-left relative overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 right-0 bg-violet-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl tracking-wider uppercase">
              Praz-AI
            </div>
            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 group-hover:bg-violet-100 dark:group-hover:bg-violet-500/20 flex items-center justify-center mb-4 transition-colors">
              <FileText className="w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-app-fg mb-2">Import from Document</h3>
            <p className="text-sm text-app-muted">Select and sync risks that were automatically identified in your Project Suite Risk Register.</p>
          </button>

          <button
            onClick={() => {
              onSelectScan()
              onClose()
            }}
            className="group flex flex-col p-6 rounded-2xl border-2 border-app-border hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-500/5 transition-all text-left relative overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 right-0 bg-violet-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl tracking-wider uppercase">
              Praz-AI
            </div>
            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 group-hover:bg-violet-100 dark:group-hover:bg-violet-500/20 flex items-center justify-center mb-4 transition-colors">
              <Sparkles className="w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-app-fg mb-2">Scan Execution Data</h3>
            <p className="text-sm text-app-muted">Identify new risks on the fly by scanning your live PRD, Backlog, and WBS for bottlenecks.</p>
          </button>
        </div>
        
      </div>
    </div>
  )
}

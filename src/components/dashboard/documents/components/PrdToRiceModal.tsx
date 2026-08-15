'use client'

import React from 'react'
import {
  Sparkles,
  Rocket,
  X,
  CheckCircle2,
  TrendingUp,
  Zap,
  Target,
  Clock,
  ArrowRight,
} from 'lucide-react'
import { GeneratedRiceItem } from '@/lib/documents/prd-to-rice-actions'

interface PrdToRiceModalProps {
  isOpen: boolean
  onClose: () => void
  items: GeneratedRiceItem[]
  projectId: string
}

export default function PrdToRiceModal({
  isOpen,
  onClose,
  items,
  projectId,
}: PrdToRiceModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full p-6 space-y-5 max-h-[85vh] overflow-y-auto ring-1 ring-black/5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Praz-AI: Generated RICE Backlog
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  {items.length} Items Created
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Praz-AI extracted features from your PRD and automatically saved them to your project backlog with RICE scores.
              </p>
            </div>
          </div>
          <button
            type="button"
            style={{ cursor: 'pointer' }}
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Backlog Items List */}
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-violet-500/40 transition-all space-y-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-violet-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {item.title}
                  </h3>
                </div>
                
                {/* RICE Score Badge */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-black shadow-md shadow-violet-500/20 shrink-0">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>RICE: {item.riceScore || 0}</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pl-8">
                {item.description}
              </p>

              {/* RICE Parameter Metrics Grid */}
              <div className="pl-8 pt-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <Rocket className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Reach:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200 ml-auto">{item.reach.toLocaleString()}</span>
                </div>

                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Impact:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200 ml-auto">{item.impact}x</span>
                </div>

                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <Target className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Conf:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200 ml-auto">{item.confidence}%</span>
                </div>

                <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <Clock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Effort:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200 ml-auto">{item.effort} wks</span>
                </div>
              </div>

              {/* Tags Line */}
              <div className="pl-8 flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20">
                  MoSCoW: {item.moscow_status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Saved to RICE Prioritization Matrix table</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              style={{ cursor: 'pointer' }}
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs transition-all shadow-md shadow-violet-500/20 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

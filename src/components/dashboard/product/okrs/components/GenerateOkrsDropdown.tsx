import React, { useState, useRef, useEffect } from 'react'
import { Sparkles, Loader2, ChevronDown, FileText, Briefcase } from 'lucide-react'

interface GenerateOkrsDropdownProps {
  isGenerating: boolean
  onGenerate: (source: 'strategy' | 'project') => void
  disabled?: boolean
}

export function GenerateOkrsDropdown({ isGenerating, onGenerate, disabled }: GenerateOkrsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isGenerating || disabled}
        style={{ cursor: isGenerating || disabled ? 'not-allowed' : 'pointer' }}
        className="px-4 py-2.5 rounded-xl bg-violet-100 hover:bg-violet-200 dark:bg-violet-900/30 dark:hover:bg-violet-900/50 text-violet-700 dark:text-violet-400 font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all border border-violet-200 dark:border-violet-800 disabled:opacity-50"
      >
        {isGenerating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        {isGenerating ? 'Synthesizing OKRs...' : 'Auto-Generate'}
        <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
      </button>

      {isOpen && !isGenerating && !disabled && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60 mb-1">
            Select Source Document
          </div>
          
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              onGenerate('strategy')
            }}
            className="w-full text-left px-3 py-2.5 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Product Strategy</span>
              <span className="text-[10px] text-slate-500 truncate">Vision, Pillars & Bets</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              onGenerate('project')
            }}
            className="w-full text-left px-3 py-2.5 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Project Charter / Scope</span>
              <span className="text-[10px] text-slate-500 truncate">Deliverables & Objectives</span>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}

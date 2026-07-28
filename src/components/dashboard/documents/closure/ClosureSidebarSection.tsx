'use client'

import React from 'react'
import { FileCheck2, Lightbulb, ArrowRightLeft, History, ShieldCheck } from 'lucide-react'
import { SidebarAccordion } from '../SidebarAccordion'
import { ClosureDocType } from './ClosureDocumentsRouter'

export interface ClosureSidebarSectionProps {
  activeTab: string
  onSelect: (docType: ClosureDocType) => void
}

export function ClosureSidebarSection({ activeTab, onSelect }: ClosureSidebarSectionProps) {
  const items: Array<{ key: ClosureDocType; label: string; icon: React.ReactNode }> = [
    { key: 'closure_report', label: 'Closure Report', icon: <FileCheck2 className="w-4 h-4 text-orange-400" /> },
    { key: 'lessons_learned', label: 'Lessons Learned', icon: <Lightbulb className="w-4 h-4 text-purple-400" /> },
    { key: 'handover_document', label: 'Final Handover', icon: <ArrowRightLeft className="w-4 h-4 text-sky-400" /> },
    { key: 'post_implementation_review', label: 'PIR & ROI Review', icon: <History className="w-4 h-4 text-indigo-400" /> },
    { key: 'signoff_board', label: 'Closure Sign-offs', icon: <ShieldCheck className="w-4 h-4 text-emerald-400" /> }
  ]

  return (
    <SidebarAccordion title="Project Closure Suite">
      <div className="flex flex-col gap-1">
        {items.map((item) => {
          const isActive = activeTab === item.key
          return (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              className={`cursor-pointer w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-xs sm:text-sm font-semibold ${
                isActive
                  ? 'bg-indigo-500/10 text-app-fg shadow-sm border border-indigo-500/20 font-bold'
                  : 'text-app-muted hover:text-app-fg hover:bg-app-hover border border-transparent'
              }`}
            >
              <div className="shrink-0">{item.icon}</div>
              <span className="truncate">{item.label}</span>
            </button>
          )
        })}
      </div>
    </SidebarAccordion>
  )
}

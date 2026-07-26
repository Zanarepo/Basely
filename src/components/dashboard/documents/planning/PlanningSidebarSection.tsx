'use client'

import React from 'react'
import { FileText, Users, ShieldCheck, ShoppingCart } from 'lucide-react'

interface PlanningSidebarSectionProps {
  activeTab: string
  onSelect: (docType: string) => void
}

export function PlanningSidebarSection({ activeTab, onSelect }: PlanningSidebarSectionProps) {
  return (
    <>
      <div className="text-xs font-bold text-app-muted uppercase tracking-wider mt-6 mb-2 pl-2">
        Planning
      </div>

      <button 
        onClick={() => onSelect('scope_statement')}
        className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
          activeTab === 'scope_statement'
            ? 'bg-indigo-500/10 text-indigo-500 shadow-sm border border-indigo-500/20'
            : 'text-app-muted hover:text-app-fg hover:bg-app-hover border border-transparent'
        }`}
      >
        <FileText className="w-4 h-4" />
        Scope Statement
      </button>

      <button 
        onClick={() => onSelect('communication_plan')}
        className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
          activeTab === 'communication_plan'
            ? 'bg-indigo-500/10 text-indigo-500 shadow-sm border border-indigo-500/20'
            : 'text-app-muted hover:text-app-fg hover:bg-app-hover border border-transparent'
        }`}
      >
        <Users className="w-4 h-4" />
        Communication Plan
      </button>

      <button 
        onClick={() => onSelect('quality_management_plan')}
        className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
          activeTab === 'quality_management_plan'
            ? 'bg-indigo-500/10 text-indigo-500 shadow-sm border border-indigo-500/20'
            : 'text-app-muted hover:text-app-fg hover:bg-app-hover border border-transparent'
        }`}
      >
        <ShieldCheck className="w-4 h-4" />
        Quality Management Plan
      </button>

      <button 
        onClick={() => onSelect('procurement_plan')}
        className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
          activeTab === 'procurement_plan'
            ? 'bg-indigo-500/10 text-indigo-500 shadow-sm border border-indigo-500/20'
            : 'text-app-muted hover:text-app-fg hover:bg-app-hover border border-transparent'
        }`}
      >
        <ShoppingCart className="w-4 h-4" />
        Procurement Plan
      </button>
    </>
  )
}

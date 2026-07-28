'use client'

import React from 'react'
import { FileText, Users, ShieldCheck, ShoppingCart, Calendar, DollarSign, GitPullRequest } from 'lucide-react'
import { SidebarAccordion } from '../SidebarAccordion'

interface PlanningSidebarSectionProps {
  activeTab: string
  onSelect: (docType: string) => void
}

export function PlanningSidebarSection({ activeTab, onSelect }: PlanningSidebarSectionProps) {
  return (
    <SidebarAccordion title="Planning">
      <button 
        onClick={() => onSelect('scope_statement')}
        className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
          activeTab === 'scope_statement'
            ? 'bg-indigo-500/10 text-indigo-500 shadow-sm border border-indigo-500/20'
            : 'text-app-muted hover:text-app-fg hover:bg-app-hover border border-transparent'
        }`}
      >
        <FileText className="w-4 h-4 text-blue-400" />
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
        <Users className="w-4 h-4 text-emerald-400" />
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
        <ShieldCheck className="w-4 h-4 text-purple-400" />
        Quality Management Plan
      </button>

      <button 
        onClick={() => onSelect('procurement_plan')}
        style={{ cursor: 'pointer' }}
        className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
          activeTab === 'procurement_plan'
            ? 'bg-indigo-500/10 text-indigo-500 shadow-sm border border-indigo-500/20'
            : 'text-app-muted hover:text-app-fg hover:bg-app-hover border border-transparent'
        }`}
      >
        <ShoppingCart className="w-4 h-4 text-amber-400" />
        Procurement Plan
      </button>

      <button 
        onClick={() => onSelect('schedule_document')}
        style={{ cursor: 'pointer' }}
        className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
          activeTab === 'schedule_document'
            ? 'bg-indigo-500/10 text-indigo-500 shadow-sm border border-indigo-500/20'
            : 'text-app-muted hover:text-app-fg hover:bg-app-hover border border-transparent'
        }`}
      >
        <Calendar className="w-4 h-4 text-rose-400" />
        Schedule Document
      </button>

      <button 
        onClick={() => onSelect('budget_baseline')}
        style={{ cursor: 'pointer' }}
        className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
          activeTab === 'budget_baseline'
            ? 'bg-indigo-500/10 text-indigo-500 shadow-sm border border-indigo-500/20'
            : 'text-app-muted hover:text-app-fg hover:bg-app-hover border border-transparent'
        }`}
      >
        <DollarSign className="w-4 h-4 text-green-400" />
        Budget Baseline
      </button>

      <button 
        onClick={() => onSelect('change_management_plan')}
        style={{ cursor: 'pointer' }}
        className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
          activeTab === 'change_management_plan'
            ? 'bg-indigo-500/10 text-indigo-500 shadow-sm border border-indigo-500/20'
            : 'text-app-muted hover:text-app-fg hover:bg-app-hover border border-transparent'
        }`}
      >
        <GitPullRequest className="w-4 h-4 text-orange-400" />
        Change Management Plan
      </button>
    </SidebarAccordion>
  )
}

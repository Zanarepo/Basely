'use client'

import React from 'react'
import { Compass, Users, FileText, BarChart3, Target, TrendingUp, Layers, Activity, Lightbulb, ClipboardList, Map } from 'lucide-react'
import { SidebarAccordion } from '../SidebarAccordion'

export type ProductDocType = 
  | 'product_strategy_document' 
  | 'market_research_report' 
  | 'competitive_benchmarking_matrix'
  | 'strategy_canvas_workspace'
  | 'personas_workspace'
  | 'north_star_kpis_workspace'
  | 'okrs_workspace'
  | 'okr_kpi_performance_report'
  | 'voc_discovery_workspace'
  | 'prioritization_workspace'
  | 'roadmap_workspace'
  | 'product_requirements_document'

export interface ProductSidebarSectionProps {
  activeTab: string
  onSelect: (docType: string) => void
}

export function ProductSidebarSection({ activeTab, onSelect }: ProductSidebarSectionProps) {
  const items = [
    { key: 'strategy_canvas_workspace', label: 'Strategy Canvas Studio', icon: <Compass className="w-4 h-4 text-indigo-500" /> },
    { key: 'personas_workspace', label: 'Personas & JTBD Roster', icon: <Users className="w-4 h-4 text-indigo-500" /> },
    { key: 'north_star_kpis_workspace', label: 'North Star KPI Engine', icon: <TrendingUp className="w-4 h-4 text-indigo-500" /> },
    { key: 'okrs_workspace', label: 'OKR Performance Tree', icon: <Layers className="w-4 h-4 text-indigo-500" /> },
    { key: 'voc_discovery_workspace', label: 'VoC Discovery Inbox', icon: <Lightbulb className="w-4 h-4 text-amber-500" /> },
    { key: 'prioritization_workspace', label: 'RICE Prioritization Matrix', icon: <BarChart3 className="w-4 h-4 text-rose-500" /> },
    { key: 'roadmap_workspace', label: 'Outcome Roadmap', icon: <Map className="w-4 h-4 text-indigo-500" /> },
    { key: 'product_strategy_document', label: 'Product Strategy Doc', icon: <FileText className="w-4 h-4 text-violet-500" /> },
    { key: 'market_research_report', label: 'Market Research Report', icon: <BarChart3 className="w-4 h-4 text-emerald-500" /> },
    { key: 'competitive_benchmarking_matrix', label: 'Competitive Matrix', icon: <Target className="w-4 h-4 text-purple-500" /> },
    { key: 'okr_kpi_performance_report', label: 'OKR & KPI Report Doc', icon: <Activity className="w-4 h-4 text-indigo-500" /> },
    { key: 'product_requirements_document', label: 'Product Requirements Doc', icon: <ClipboardList className="w-4 h-4 text-violet-500" /> }
  ]

  return (
    <SidebarAccordion title="Product Management Suite">
      <div className="flex flex-col gap-1">
        {items.map((item) => {
          const isActive = activeTab === item.key
          return (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              style={{ cursor: 'pointer' }}
              className={`relative cursor-pointer w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-xs sm:text-sm font-medium ${
                isActive
                  ? 'bg-indigo-50/80 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 shadow-sm border border-indigo-100 dark:border-indigo-500/20 font-bold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-indigo-500 before:rounded-r-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <div className={`shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                {item.icon}
              </div>
              <span className="truncate tracking-tight">{item.label}</span>
            </button>
          )
        })}
      </div>
    </SidebarAccordion>
  )
}

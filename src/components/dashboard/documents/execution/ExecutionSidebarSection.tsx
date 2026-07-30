'use client'

import { BookOpen, FileEdit, CheckSquare } from 'lucide-react'
import { SidebarAccordion } from '../SidebarAccordion'
import React from 'react'

export type ExecutionDocType = 'meeting_minutes' | 'change_requests' | 'deliverables' | 'deployment_report' | 'test_summary_report'

interface ExecutionSidebarSectionProps {
  activeTab: string
  onSelect: (docType: ExecutionDocType) => void
  hasEditAccess?: boolean
  isManager?: boolean
  methodology?: string
}

export function ExecutionSidebarSection({ activeTab, onSelect, hasEditAccess, isManager, methodology }: ExecutionSidebarSectionProps) {
  const canSeeDeliverables = hasEditAccess || isManager;
  const isWaterfall = methodology === 'Waterfall'

  return (
    <SidebarAccordion title="Execution">
      <button 
        onClick={() => onSelect('meeting_minutes')}
        className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
          activeTab === 'meeting_minutes'
            ? 'bg-indigo-500/10 text-indigo-500 shadow-sm border border-indigo-500/20'
            : 'text-app-muted hover:text-app-fg hover:bg-app-hover border border-transparent'
        }`}
      >
        <BookOpen className="w-4 h-4 text-blue-400" />
        Meeting Minutes
      </button>

      <button 
        onClick={() => onSelect('change_requests')}
        className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold mt-1 ${
          activeTab === 'change_requests'
            ? 'bg-indigo-500/10 text-indigo-500 shadow-sm border border-indigo-500/20'
            : 'text-app-muted hover:text-app-fg hover:bg-app-hover border border-transparent'
        }`}
      >
        <FileEdit className="w-4 h-4 text-indigo-400" />
        Change Requests
      </button>

      <button 
        onClick={() => onSelect('deployment_report')}
        className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold mt-1 ${
          activeTab === 'deployment_report'
            ? 'bg-indigo-500/10 text-indigo-500 shadow-sm border border-indigo-500/20'
            : 'text-app-muted hover:text-app-fg hover:bg-app-hover border border-transparent'
        }`}
      >
        <FileEdit className="w-4 h-4 text-cyan-400" />
        {isWaterfall ? 'Implementation Report' : 'Deployment Report'}
      </button>

      <button 
        onClick={() => onSelect('test_summary_report')}
        className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold mt-1 ${
          activeTab === 'test_summary_report'
            ? 'bg-indigo-500/10 text-indigo-500 shadow-sm border border-indigo-500/20'
            : 'text-app-muted hover:text-app-fg hover:bg-app-hover border border-transparent'
        }`}
      >
        <CheckSquare className="w-4 h-4 text-orange-400" />
        {isWaterfall ? 'Phase Testing Report' : 'Test Summary Report'}
      </button>

      {canSeeDeliverables && (
        <button 
          onClick={() => onSelect('deliverables')}
          className={`cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-semibold mt-1 ${
            activeTab === 'deliverables'
              ? 'bg-indigo-500/10 text-indigo-500 shadow-sm border border-indigo-500/20'
              : 'text-app-muted hover:text-app-fg hover:bg-app-hover border border-transparent'
          }`}
        >
          <CheckSquare className="w-4 h-4 text-emerald-400" />
          Deliverable Sign-offs
        </button>
      )}
    </SidebarAccordion>
  )
}

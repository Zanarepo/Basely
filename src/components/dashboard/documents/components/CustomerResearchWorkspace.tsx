'use client'

import React, { useState } from 'react'
import { FileText, Search } from 'lucide-react'
import ProjectDocument from '@/components/dashboard/documents/ProjectDocument'
import { DiscoveryInbox } from '@/components/dashboard/product/discovery/DiscoveryInbox'

interface Props {
  projectId: string
  projectContext: any
  hasEditAccess: boolean
  onShowToast: (type: 'success' | 'error', msg: string) => void
}

export function CustomerResearchWorkspace({ projectId, projectContext, hasEditAccess, onShowToast }: Props) {
  const [activeTab, setActiveTab] = useState<'strategy' | 'insights'>('strategy')

  return (
    <div className="flex-1 flex flex-col h-full bg-app-surface">
      {/* Workspace Header with Tabs */}
      <div className="flex-none border-b border-app-border px-6 pt-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-app-fg">Customer Research</h2>
            <p className="text-xs text-app-muted">Plan your research strategy and document Voice of Customer insights.</p>
          </div>
        </div>

        <div className="flex items-center mt-4">
          <div className="inline-flex items-center gap-1 p-1 bg-white dark:bg-slate-900 border border-app-border rounded-xl">
            <button
              onClick={() => setActiveTab('strategy')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg cursor-pointer transition-colors ${
                activeTab === 'strategy' 
                  ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300' 
                  : 'text-app-muted hover:text-app-fg hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              Research Strategy (21 Steps)
            </button>
            
            <button
              onClick={() => setActiveTab('insights')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg cursor-pointer transition-colors ${
                activeTab === 'insights' 
                  ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300' 
                  : 'text-app-muted hover:text-app-fg hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              <Search className="w-4 h-4" />
              Discovery Insights & VoC
            </button>
          </div>
        </div>
      </div>


      {/* Workspace Body */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'strategy' ? (
          <ProjectDocument 
            projectId={projectId} 
            documentType="customer_research_strategy"
            projectContext={projectContext}
            hasEditAccess={hasEditAccess}
            onShowToast={onShowToast}
          />
        ) : (
          <DiscoveryInbox 
            projectId={projectId}
            organizationId={projectContext?.organization_id || 'default_org'}
            hasEditAccess={hasEditAccess}
          />
        )}
      </div>
    </div>
  )
}

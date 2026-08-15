'use client'

import React, { useState } from 'react'
import { Route, Sparkles, Brain } from 'lucide-react'
import { PmDiscoveryWorkflowGuide } from '../../product/discovery/PmDiscoveryWorkflowGuide'
import { AiAutomationWorkflowGuide } from './AiAutomationWorkflowGuide'

interface WorkflowsDrawerProps {
  onClose?: () => void
}

export default function WorkflowsDrawer({ onClose }: WorkflowsDrawerProps) {
  const [activeTab, setActiveTab] = useState<'discovery' | 'automation'>('automation')

  return (
    <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-app-border space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-app-border pb-3">
        <div className="flex items-center gap-2 text-app-fg font-extrabold text-sm">
          <Route className="w-4 h-4 text-violet-500" />
          <span>PM Workflow Playbooks</span>
        </div>
        
        <div className="flex items-center gap-1 bg-app-surface p-1 rounded-xl border border-app-border">
          <button
            onClick={() => setActiveTab('automation')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'automation'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-app-muted hover:text-app-fg hover:bg-app-hover'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Automation Chain
          </button>
          <button
            onClick={() => setActiveTab('discovery')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'discovery'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-app-muted hover:text-app-fg hover:bg-app-hover'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            Product Discovery
          </button>
        </div>
      </div>

      <div className="pt-2">
        {activeTab === 'automation' && <AiAutomationWorkflowGuide />}
        {activeTab === 'discovery' && <PmDiscoveryWorkflowGuide />}
      </div>
    </div>
  )
}

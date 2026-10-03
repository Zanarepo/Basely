'use client'

import React, { useState } from 'react'
import { NorthStarDashboard } from './NorthStarDashboard'
import { OkrDashboard } from './OkrDashboard'
import ProjectDocument from '../../documents/ProjectDocument'
import { Compass, BarChart3, Target, Activity } from 'lucide-react'
import { ToastContainer, type ToastMessage } from '@/components/dashboard/Toast'

interface StrategicOutcomesHubProps {
  projectId: string
  organizationId: string
  projectContext: any
  hasEditAccess: boolean
}

type TabType = 'north_star' | 'okrs' | 'performance_reports'

export function StrategicOutcomesHub({
  projectId,
  organizationId,
  projectContext,
  hasEditAccess,
}: StrategicOutcomesHubProps) {
  const [activeTab, setActiveTab] = useState<TabType>('north_star')
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const handleShowToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToasts(prev => [...prev, { id: Math.random().toString(36).substring(2, 9), type, message }])
  }

  return (
    <div className="flex flex-col h-full space-y-6 relative">
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(t => t.filter(x => x.id !== id))} />
      {/* Header Banner */}
      <div className="bg-violet-50/50 dark:bg-violet-950/20 rounded-[2rem] p-6 lg:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-violet-100 dark:border-violet-900/50">
        <div className="flex items-start md:items-center gap-5 w-full">
          <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center shrink-0 shadow-sm">
            <Target className="w-7 h-7 text-white" />
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2">
              <h2 className="text-[13px] font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                STRATEGIC OUTCOMES HUB
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-bold uppercase tracking-widest">
                PRAZ-AI MODULE
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-3xl">
              Unified dashboard for your North Star KPIs, OKR performance, and strategic reports. Link outcomes directly back to your product strategy and roadmap.
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center justify-start overflow-x-auto w-full pb-2">
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-xl shadow-sm shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('north_star')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'north_star'
                ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Compass className="w-4 h-4" />
            North Star Metrics
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('okrs')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'okrs'
                ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Objectives & Key Results
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('performance_reports')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'performance_reports'
                ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-4 h-4" />
            Performance Reports
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0">
        {activeTab === 'north_star' && (
          <NorthStarDashboard
            projectId={projectId}
            organizationId={organizationId}
            hasEditAccess={hasEditAccess}
          />
        )}
        
        {activeTab === 'okrs' && (
          <OkrDashboard
            projectId={projectId}
            organizationId={organizationId}
            hasEditAccess={hasEditAccess}
          />
        )}

        {activeTab === 'performance_reports' && (
          <div className="bg-app-surface border border-app-border rounded-2xl shadow-sm h-full">
            <ProjectDocument
              documentType="okr_kpi_performance_report"
              projectId={projectId}
              projectContext={projectContext}
              hasEditAccess={hasEditAccess}
              onShowToast={handleShowToast}
            />
          </div>
        )}
      </div>
    </div>
  )
}

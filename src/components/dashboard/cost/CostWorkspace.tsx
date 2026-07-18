'use client'

import { useState } from 'react'
import { Loader2, DollarSign, Activity, FileDigit } from 'lucide-react'
import { useCostData } from './useCostData'
import CostEstimationView from './CostEstimationView'
import ResourceRatesManager from './ResourceRatesManager'
import TimePhasingView from './TimePhasingView'
import BaselineManager from './BaselineManager'

type CostWorkspaceProps = {
  projectId: string
  hasEditAccess: boolean
}

type CostViewType = 'estimation' | 'resources' | 'timephasing' | 'baselines'

export default function CostWorkspace({ projectId, hasEditAccess }: CostWorkspaceProps) {
  const [currentView, setCurrentView] = useState<CostViewType>('estimation')
  const { loading, error, wbsCostData, baselines, resourceRates, contingencyAmount, contingencyType, projectCurrency, globalOverhead, refresh } = useCostData(projectId)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-app-subtle">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
        <p>Loading budget and cost data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-2xl text-red-600 dark:text-red-400">
        <h3 className="font-semibold mb-2">Error loading cost data</h3>
        <p className="text-sm">{error}</p>
        <button onClick={refresh} className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/20 rounded-lg text-sm font-semibold hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors">
          Retry
        </button>
      </div>
    )
  }

  // Calculate totals
  const totalBudget = wbsCostData.reduce((sum, item) => sum + (item.costAccount?.budgeted_total || 0), 0)
  const overheadAmount = totalBudget * (globalOverhead / 100)
  
  // Calculate final contingency value based on type
  const calculatedContingency = contingencyType === 'percentage' 
    ? (totalBudget + overheadAmount) * (contingencyAmount / 100)
    : contingencyAmount

  const totalWithContingency = totalBudget + overheadAmount + calculatedContingency

  return (
    <div className="flex flex-col gap-6">
      {/* Cost Toolbar & Summary Header */}
      <div className="bg-app-surface border border-app-border rounded-3xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        
        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-app-muted-surface p-1 rounded-xl">
          <button
            onClick={() => setCurrentView('estimation')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              currentView === 'estimation'
                ? 'bg-app-surface text-indigo-500 shadow-sm'
                : 'text-app-muted hover:text-app-fg hover:bg-app-hover'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Estimations
          </button>
          <button
            onClick={() => setCurrentView('resources')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              currentView === 'resources'
                ? 'bg-app-surface text-indigo-500 shadow-sm'
                : 'text-app-muted hover:text-app-fg hover:bg-app-hover'
            }`}
          >
            <Activity className="w-4 h-4" />
            Resources
          </button>
          <button
            onClick={() => setCurrentView('timephasing')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              currentView === 'timephasing'
                ? 'bg-app-surface text-indigo-500 shadow-sm'
                : 'text-app-muted hover:text-app-fg hover:bg-app-hover'
            }`}
          >
            <Activity className="w-4 h-4" />
            Time-Phased (S-Curve)
          </button>
          <button
            onClick={() => setCurrentView('baselines')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              currentView === 'baselines'
                ? 'bg-app-surface text-indigo-500 shadow-sm'
                : 'text-app-muted hover:text-app-fg hover:bg-app-hover'
            }`}
          >
            <FileDigit className="w-4 h-4" />
            Baselines
          </button>
        </div>

        {/* Project Roll-up Summary */}
        <div className="flex items-center gap-6 px-2">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-app-muted uppercase tracking-wider">Total WP Budget</span>
            <span className="text-lg font-bold text-app-fg">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: projectCurrency }).format(totalBudget)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-app-muted uppercase tracking-wider">Overhead ({globalOverhead}%)</span>
            <span className="text-lg font-bold text-indigo-400 dark:text-indigo-300">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: projectCurrency }).format(overheadAmount)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-app-muted uppercase tracking-wider">Contingency {contingencyType === 'percentage' && `(${contingencyAmount}%)`}</span>
            <span className="text-lg font-bold text-amber-600 dark:text-amber-500">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: projectCurrency }).format(calculatedContingency)}
            </span>
          </div>
          <div className="w-px h-8 bg-app-border mx-2 hidden xl:block"></div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">Project Total</span>
            <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: projectCurrency }).format(totalWithContingency)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="min-h-[500px]">
        {currentView === 'estimation' && (
          <CostEstimationView 
            projectId={projectId} 
            wbsCostData={wbsCostData} 
            resourceRates={resourceRates}
            projectCurrency={projectCurrency}
            globalOverhead={globalOverhead}
            hasEditAccess={hasEditAccess}
            onDataChange={refresh}
          />
        )}
        {currentView === 'resources' && (
          <ResourceRatesManager 
            projectId={projectId} 
            resourceRates={resourceRates} 
            projectCurrency={projectCurrency}
            globalOverhead={globalOverhead}
            contingencyAmount={contingencyAmount}
            contingencyType={contingencyType}
            hasEditAccess={hasEditAccess}
            onDataChange={refresh}
          />
        )}
        {currentView === 'timephasing' && (
          <TimePhasingView 
            projectId={projectId} 
            wbsCostData={wbsCostData} 
            projectCurrency={projectCurrency}
            hasEditAccess={hasEditAccess}
            onDataChange={refresh}
          />
        )}
        {currentView === 'baselines' && (
          <BaselineManager 
            projectId={projectId} 
            baselines={baselines} 
            projectCurrency={projectCurrency}
            hasEditAccess={hasEditAccess}
            onDataChange={refresh}
          />
        )}
      </div>
    </div>
  )
}

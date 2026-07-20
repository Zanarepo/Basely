'use client'

import { useState } from 'react'
import { Loader2, DollarSign, Activity, FileDigit } from 'lucide-react'
import { useCostData } from './useCostData'
import { CurrencyDisplay } from '@/components/CurrencyDisplay'
import CostEstimationView from './CostEstimationView'
import ResourceRatesManager from './ResourceRatesManager'
import TimePhasingView from './TimePhasingView'
import BaselineManager from './BaselineManager'
import ActualsView from './ActualsView'

type CostWorkspaceProps = {
  projectId: string
  hasEditAccess: boolean
}

type CostViewType = 'estimation' | 'resources' | 'timephasing' | 'baselines' | 'actuals'

export default function CostWorkspace({ projectId, hasEditAccess }: CostWorkspaceProps) {
  const [currentView, setCurrentView] = useState<CostViewType>('estimation')
  const { loading, error, wbsCostData, baselines, resourceRates, contingencyAmount, contingencyType, allocatedContingency, projectCurrency, globalOverhead, refresh } = useCostData(projectId)

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

  // Calculate actual costs
  const totalActual = wbsCostData.reduce((sum, item) => {
    return sum + (item.actualCosts?.reduce((a, c) => a + c.amount, 0) || 0)
  }, 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Project Roll-up Summary */}
      <div className="bg-app-surface border border-app-border rounded-3xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-6 md:gap-10 w-full">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-app-muted uppercase tracking-wider mb-1">Total WP Budget</span>
            <span className="text-2xl font-bold text-app-fg">
              <CurrencyDisplay amount={totalBudget} currency={projectCurrency} compactThreshold={1000} />
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-app-muted uppercase tracking-wider mb-1">Overhead ({globalOverhead}%)</span>
            <span className="text-2xl font-bold text-indigo-400 dark:text-indigo-300">
              <CurrencyDisplay amount={overheadAmount} currency={projectCurrency} compactThreshold={1000} />
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-app-muted uppercase tracking-wider mb-1 flex items-center gap-2">
              Contingency {contingencyType === 'percentage' && `(${contingencyAmount}%)`}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-500">
                <CurrencyDisplay amount={calculatedContingency} currency={projectCurrency} compactThreshold={1000} />
              </span>
            </div>
            {calculatedContingency > 0 && (
              <div className="mt-2 flex flex-col gap-1 text-xs">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-app-muted">Allocated to Risks:</span>
                  <span className="font-semibold text-red-500"><CurrencyDisplay amount={allocatedContingency} currency={projectCurrency} compactThreshold={1000} /></span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-app-muted">Uncommitted Reserve:</span>
                  <span className={`font-semibold ${calculatedContingency - allocatedContingency < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    <CurrencyDisplay amount={calculatedContingency - allocatedContingency} currency={projectCurrency} compactThreshold={1000} />
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="w-full h-px md:w-px md:h-16 bg-app-border mx-0 md:mx-2 block"></div>
          <div className="flex flex-col w-full md:w-auto">
            <span className="text-sm font-bold text-indigo-500 uppercase tracking-wider mb-1">Project Budget</span>
            <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              <CurrencyDisplay amount={totalWithContingency} currency={projectCurrency} compactThreshold={1000} />
            </span>
          </div>
          <div className="flex flex-col w-full md:w-auto ml-auto">
            <span className="text-sm font-bold text-emerald-500 uppercase tracking-wider mb-1">Actual to Date</span>
            <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              <CurrencyDisplay amount={totalActual} currency={projectCurrency} compactThreshold={1000} />
            </span>
          </div>
        </div>
      </div>

      {/* View Switcher */}
      <div className="flex items-center gap-2 bg-app-surface border border-app-border p-2 rounded-2xl overflow-x-auto whitespace-nowrap no-scrollbar w-full shadow-sm">
        <button
          onClick={() => setCurrentView('estimation')}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            currentView === 'estimation'
              ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-app-muted hover:text-app-fg hover:bg-app-hover'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Estimations
        </button>
        <button
          onClick={() => setCurrentView('resources')}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            currentView === 'resources'
              ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-app-muted hover:text-app-fg hover:bg-app-hover'
          }`}
        >
          <Activity className="w-4 h-4" />
          Resources
        </button>
        <button
          onClick={() => setCurrentView('timephasing')}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            currentView === 'timephasing'
              ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-app-muted hover:text-app-fg hover:bg-app-hover'
          }`}
        >
          <Activity className="w-4 h-4" />
          Time-Phased (S-Curve)
        </button>
        <button
          onClick={() => setCurrentView('baselines')}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            currentView === 'baselines'
              ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-app-muted hover:text-app-fg hover:bg-app-hover'
          }`}
        >
          <FileDigit className="w-4 h-4" />
          Baselines
        </button>
        <button
          onClick={() => setCurrentView('actuals')}
          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            currentView === 'actuals'
              ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-app-muted hover:text-app-fg hover:bg-app-hover'
          }`}
        >
          <FileDigit className="w-4 h-4" />
          Actuals
        </button>
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
        {currentView === 'actuals' && (
          <ActualsView
            projectId={projectId}
            wbsCostData={wbsCostData}
            projectCurrency={projectCurrency}
            hasEditAccess={hasEditAccess}
            onDataChange={refresh}
          />
        )}
      </div>
    </div>
  )
}

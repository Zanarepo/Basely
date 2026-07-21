import { Percent, Save, X, Edit2 } from 'lucide-react'
import { CurrencyDisplay } from '@/components/CurrencyDisplay'

interface ResourceSettingsProps {
  hasEditAccess: boolean
  globalOverhead: number
  contingencyAmount: number
  contingencyType: 'flat' | 'percentage'
  projectCurrency: string
  activeSettingsTab: 'overhead' | 'contingency'
  setActiveSettingsTab: (tab: 'overhead' | 'contingency') => void
  isEditingOverhead: boolean
  setIsEditingOverhead: (val: boolean) => void
  overheadVal: string
  setOverheadVal: (val: string) => void
  isEditingContingency: boolean
  setIsEditingContingency: (val: boolean) => void
  contingencyVal: string
  setContingencyVal: (val: string) => void
  selectedContingencyType: 'flat' | 'percentage'
  setSelectedContingencyType: (type: 'flat' | 'percentage') => void
  handleSaveOverhead: () => void
  handleSaveContingency: () => void
}

export function ResourceSettings({
  hasEditAccess,
  globalOverhead,
  contingencyAmount,
  contingencyType,
  projectCurrency,
  activeSettingsTab,
  setActiveSettingsTab,
  isEditingOverhead,
  setIsEditingOverhead,
  overheadVal,
  setOverheadVal,
  isEditingContingency,
  setIsEditingContingency,
  contingencyVal,
  setContingencyVal,
  selectedContingencyType,
  setSelectedContingencyType,
  handleSaveOverhead,
  handleSaveContingency
}: ResourceSettingsProps) {
  return (
    <div className="bg-app-surface border border-app-border rounded-xl shadow-sm overflow-hidden">
      {/* Tab Header */}
      <div className="flex items-center gap-6 border-b border-app-border px-6 pt-4 bg-app-bg/50">
        <button 
          onClick={() => setActiveSettingsTab('overhead')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${activeSettingsTab === 'overhead' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-app-muted hover:text-app-fg'}`}
        >
          Global Overhead
        </button>
        <button 
          onClick={() => setActiveSettingsTab('contingency')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${activeSettingsTab === 'contingency' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-app-muted hover:text-app-fg'}`}
        >
          Project Contingency
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeSettingsTab === 'overhead' && (
          <div className="flex items-center justify-between group">
            <div>
              <h3 className="text-lg font-semibold text-app-fg">Global Project Overhead</h3>
              <p className="text-sm text-app-muted">Applied on top of direct costs (labor + material) during roll-up.</p>
            </div>
            {hasEditAccess && (
              <div>
                {isEditingOverhead ? (
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="number"
                        value={overheadVal}
                        onChange={e => setOverheadVal(e.target.value)}
                        className="w-24 px-3 py-1.5 bg-app-bg border border-app-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 pr-8 text-app-fg"
                      />
                      <Percent className="w-3 h-3 text-app-muted absolute right-3 top-2.5" />
                    </div>
                    <button onClick={handleSaveOverhead} className="p-1.5 text-green-500 hover:bg-green-500/10 rounded-lg">
                      <Save className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setIsEditingOverhead(false); setOverheadVal(globalOverhead.toString()) }} className="p-1.5 text-app-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-app-fg">{globalOverhead}%</span>
                    <button onClick={() => setIsEditingOverhead(true)} className="p-1.5 text-app-muted hover:text-indigo-400 hover:bg-app-hover rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeSettingsTab === 'contingency' && (
          <div className="flex items-center justify-between group">
            <div>
              <h3 className="text-lg font-semibold text-app-fg">Project Contingency</h3>
              <p className="text-sm text-app-muted">A reserve pool added to the final project total for unforeseen risks.</p>
            </div>
            {hasEditAccess && (
              <div>
                {isEditingContingency ? (
                  <div className="flex items-center gap-3">
                    <div className="flex bg-app-bg border border-app-border rounded-lg p-0.5">
                      <button
                        onClick={() => setSelectedContingencyType('flat')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${selectedContingencyType === 'flat' ? 'bg-app-surface shadow-sm text-app-fg' : 'text-app-muted hover:text-app-fg'}`}
                      >
                        Flat Amount
                      </button>
                      <button
                        onClick={() => setSelectedContingencyType('percentage')}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${selectedContingencyType === 'percentage' ? 'bg-app-surface shadow-sm text-app-fg' : 'text-app-muted hover:text-app-fg'}`}
                      >
                        Percentage
                      </button>
                    </div>
                    <div className="relative flex items-center">
                      {selectedContingencyType === 'flat' ? (
                        <span className="absolute left-3 text-app-muted font-medium">{projectCurrency === 'USD' ? '$' : projectCurrency === 'EUR' ? '€' : projectCurrency}</span>
                      ) : (
                        <Percent className="w-3 h-3 text-app-muted absolute right-3 top-2.5" />
                      )}
                      <input
                        type="number"
                        value={contingencyVal}
                        onChange={e => setContingencyVal(e.target.value)}
                        className={`w-32 py-1.5 bg-app-bg border border-app-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-app-fg ${selectedContingencyType === 'flat' ? 'pl-8 pr-3' : 'pl-3 pr-8'}`}
                      />
                    </div>
                    <button onClick={handleSaveContingency} className="p-1.5 text-green-500 hover:bg-green-500/10 rounded-lg">
                      <Save className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setIsEditingContingency(false); setContingencyVal(contingencyAmount?.toString() || '0'); setSelectedContingencyType(contingencyType || 'flat'); }} className="p-1.5 text-app-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-app-fg">
                      {contingencyType === 'percentage' 
                        ? `${contingencyAmount}%` 
                        : <CurrencyDisplay amount={contingencyAmount || 0} currency={projectCurrency} compactThreshold={1000} />}
                    </span>
                    <button onClick={() => setIsEditingContingency(true)} className="p-1.5 text-app-muted hover:text-indigo-400 hover:bg-app-hover rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

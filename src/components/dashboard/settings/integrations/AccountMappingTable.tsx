'use client'

import React from 'react'
import { UseAccountMappingReturn } from './hooks/useAccountMapping'
import { Search, Save, Sparkles, Layers, Tag } from 'lucide-react'

interface AccountMappingTableProps {
  mappingState: UseAccountMappingReturn
  selectedConnectorType?: string
  onSelectConnectorType?: (type: string) => void
  onNavigateToSync?: () => void
  showToast?: (type: 'success' | 'error' | 'info', message: string) => void
}

export const AccountMappingTable: React.FC<AccountMappingTableProps> = ({
  mappingState,
  selectedConnectorType = 'quickbooks',
  onSelectConnectorType,
  showToast
}) => {
  const {
    filteredAccounts,
    wbsElements,
    mappings,
    loading,
    saving,
    filterText,
    categoryFilter,
    setFilterText,
    setCategoryFilter,
    updateMapping,
    autoMapSuggestions,
    saveMappings,
    stats
  } = mappingState

  const connectors = [
    { id: 'quickbooks', name: 'QuickBooks Online' },
    { id: 'netsuite', name: 'NetSuite Cloud ERP' },
    { id: 'sap', name: 'SAP S/4HANA' },
    { id: 'xero', name: 'Xero Accounting Suite' }
  ]

  const handleSave = async () => {
    const res = await saveMappings()
    if (showToast) {
      if (res) {
        showToast('success', 'Account mappings saved successfully!')
      } else {
        showToast('error', 'Failed to save account mappings.')
      }
    }
  }

  const handleAutoMap = () => {
    autoMapSuggestions()
    if (showToast) {
      showToast('info', 'Auto-map suggestions applied to compatible accounts')
    }
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-app-muted animate-pulse flex flex-col items-center justify-center space-y-3 bg-app-surface rounded-2xl border border-app-border">
        <Layers className="h-8 w-8 text-indigo-500 animate-bounce" />
        <p className="text-sm font-bold text-app-fg">Loading General Ledger Account Schemas & WBS Packages...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Simple & Easy Schema Switcher Tabs */}
      {onSelectConnectorType && (
        <div className="flex items-center gap-2 border-b border-app-border pb-4 overflow-x-auto scrollbar-none">
          {connectors.map(conn => {
            const active = selectedConnectorType === conn.id
            return (
              <button
                key={conn.id}
                onClick={() => onSelectConnectorType(conn.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'bg-app-surface text-app-muted hover:bg-app-hover hover:text-app-fg border border-app-border'
                }`}
              >
                <span>{conn.name}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* KPI Stats Bar: Simple, uncluttered, no truncation */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-app-surface p-4 rounded-xl border border-app-border shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-app-muted">Total Accounts</span>
          <span className="text-2xl font-extrabold text-app-fg mt-2">{stats.total}</span>
        </div>
        <div className="bg-app-surface p-4 rounded-xl border border-app-border shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400">Mapped to WBS</span>
          <span className="text-2xl font-extrabold text-emerald-500 dark:text-emerald-400 mt-2">{stats.mapped}</span>
        </div>
        <div className="bg-app-surface p-4 rounded-xl border border-app-border shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-amber-500 dark:text-amber-400">Unmapped Accounts</span>
          <span className="text-2xl font-extrabold text-amber-500 dark:text-amber-400 mt-2">{stats.unmapped}</span>
        </div>
        <div className="bg-app-surface p-4 rounded-xl border border-app-border shadow-xs flex flex-col justify-between">
          <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400">Mapping Ratio</span>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-2xl font-extrabold text-indigo-500 dark:text-indigo-400">{stats.completionRatio}%</span>
            <div className="flex-1 h-2 bg-app-bg rounded-full overflow-hidden border border-app-border">
              <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${stats.completionRatio}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Controls Bar */}
      <div className="bg-app-surface p-4 rounded-xl border border-app-border shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 min-w-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-app-muted" />
            <input
              type="text"
              placeholder="Search accounts..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-app-border rounded-lg bg-app-bg text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm border border-app-border rounded-lg bg-app-surface text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer max-w-xs hover:border-indigo-500/50 transition-colors"
          >
            <option value="ALL">All Categories</option>
            <option value="Cost of Goods Sold">Cost of Goods Sold (COGS)</option>
            <option value="Expense">Standard Expenses</option>
            <option value="Other Expense">Other Expenses</option>
          </select>
        </div>

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap justify-end">
          <button
            onClick={handleAutoMap}
            disabled={saving}
            className="px-4 py-2 rounded-lg border border-purple-200 dark:border-purple-800/60 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-50 hover:scale-[1.02]"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            Auto-Map Suggestions
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap cursor-pointer hover:scale-[1.02]"
          >
            <Save className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
            {saving ? 'Saving...' : 'Save Mappings'}
          </button>
        </div>
      </div>

      {/* Responsive View: Desktop & Tablet Table */}
      <div className="hidden md:block bg-app-surface rounded-xl border border-app-border shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-app-bg border-b border-app-border text-app-muted font-bold uppercase tracking-wider text-2xs">
              <th className="py-3 px-4 w-24">Code</th>
              <th className="py-3 px-4">Account Name</th>
              <th className="py-3 px-4 w-40">Category</th>
              <th className="py-3 px-4">Target WBS Work Package</th>
              <th className="py-3 px-4 w-28 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border text-app-fg">
            {filteredAccounts.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-app-muted font-medium">
                  No general ledger accounts match your current filters.
                </td>
              </tr>
            ) : (
              filteredAccounts.map((acc) => {
                const mapItem = mappings[acc.id]
                const isMapped = !!mapItem
                return (
                  <tr key={acc.id} className="hover:bg-app-hover transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-app-fg">
                      {acc.code}
                    </td>
                    <td className="py-3.5 px-4 font-medium">
                      <div className="text-app-fg font-bold">{acc.name}</div>
                      <div className="text-2xs text-app-muted mt-0.5">{acc.category}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-2xs font-bold ${
                        acc.type === 'Cost of Goods Sold' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20' :
                        acc.type === 'Expense' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20' :
                        'bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20'
                      }`}>
                        <Tag className="w-2.5 h-2.5 mr-1" />
                        {acc.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={mapItem?.wbsElementId || ''}
                        onChange={(e) => updateMapping(acc.id, e.target.value || null)}
                        className="w-full px-3 py-2 border border-app-border rounded-lg bg-app-bg text-app-fg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-medium hover:border-indigo-500/50 transition-colors"
                      >
                        <option value="">-- Unassigned (Select WBS Work Package) --</option>
                        {wbsElements.map((wbs) => (
                          <option key={wbs.id} value={wbs.id}>
                            [{wbs.projectName}] {wbs.code} - {wbs.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {isMapped ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-2xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-2xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Unmapped
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Responsive View: Mobile & Small iPad Stacked Cards */}
      <div className="md:hidden space-y-3">
        {filteredAccounts.length === 0 ? (
          <div className="bg-app-surface p-8 text-center rounded-xl border border-app-border text-app-muted">
            No general ledger accounts match your current filters.
          </div>
        ) : (
          filteredAccounts.map((acc) => {
            const mapItem = mappings[acc.id]
            const isMapped = !!mapItem
            return (
              <div
                key={acc.id}
                className="bg-app-surface p-4 rounded-xl border border-app-border shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold bg-app-bg px-2 py-0.5 rounded text-app-fg border border-app-border">
                        {acc.code}
                      </span>
                      <span className="font-bold text-app-fg text-sm">
                        {acc.name}
                      </span>
                    </div>
                    <span className="inline-block mt-1 text-2xs text-app-muted">
                      Category: {acc.category} • Type: {acc.type}
                    </span>
                  </div>

                  {isMapped ? (
                    <span className="px-2 py-0.5 rounded text-2xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Ready
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-2xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      Unmapped
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-app-border">
                  <label className="block text-2xs uppercase tracking-wider text-app-muted font-semibold mb-1">
                    Assign Project WBS Work Package:
                  </label>
                  <select
                    value={mapItem?.wbsElementId || ''}
                    onChange={(e) => updateMapping(acc.id, e.target.value || null)}
                    className="w-full px-3 py-2 border border-app-border rounded-lg bg-app-bg text-app-fg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
                  >
                    <option value="">-- Unassigned (Select WBS Work Package) --</option>
                    {wbsElements.map((wbs) => (
                      <option key={wbs.id} value={wbs.id}>
                        [{wbs.projectName}] {wbs.code} - {wbs.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

'use client'

import React from 'react'
import { UseSyncLogsReturn } from './hooks/useSyncLogs'
import { AlertTriangle, CheckCircle2, RefreshCw, FileText, ExternalLink, ShieldAlert } from 'lucide-react'

interface SyncStatusDashboardProps {
  logsState: UseSyncLogsReturn
  onNavigateToMapping: () => void
}

export const SyncStatusDashboard: React.FC<SyncStatusDashboardProps> = ({ logsState, onNavigateToMapping }) => {
  const {
    loading,
    error,
    selectedLog,
    filterStatus,
    setFilterStatus,
    setSelectedLog,
    filteredLogs,
    fetchLogs,
    kpiSummary
  } = logsState

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500 animate-pulse flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
        <p className="text-sm font-medium">Querying synchronization history & diagnostic audit logs...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* KPI Overview Widget: Responsive 4-Column / 2-Column Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-800 p-3.5 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs flex flex-col justify-between min-w-0">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">Total Sync Cycles</span>
          <span className="text-2xl font-black text-gray-900 dark:text-white mt-1.5">{kpiSummary.totalSyncs}</span>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3.5 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs flex flex-col justify-between min-w-0">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 truncate">Records Ingested</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5">{kpiSummary.totalRecordsSynced}</span>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3.5 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs flex flex-col justify-between min-w-0">
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 truncate">Exceptions</span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1.5">{kpiSummary.totalErrors}</span>
        </div>
        <div className="bg-white dark:bg-gray-800 p-3.5 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs flex flex-col justify-between min-w-0">
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 truncate">Success Rate</span>
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1.5">{kpiSummary.successRate}%</span>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs sm:text-sm">
          {error}
        </div>
      )}

      {/* Main Content Area: Master-Detail Layout (Stacked on iPad/Mobile, Side-by-side on large Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left/Top Column: Log Selection & Filters (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs overflow-hidden">
          <div className="p-3.5 sm:p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/60 dark:bg-gray-900/50">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-xs sm:text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Sync Execution Log
            </h3>
            <button
              onClick={() => fetchLogs()}
              className="p-1 rounded text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition"
              title="Refresh log history"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Status Tabs Filter */}
          <div className="p-2.5 bg-gray-100/50 dark:bg-gray-800/80 border-b border-gray-200/60 dark:border-gray-700 flex items-center gap-1 overflow-x-auto">
            {(['all', 'success', 'partial_failure', 'failure'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-md text-2xs font-bold transition whitespace-nowrap ${
                  filterStatus === st 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-700'
                }`}
              >
                {st === 'all' ? 'All Executions' : st.toUpperCase().replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Log List */}
          <div className="divide-y divide-gray-100 dark:divide-gray-700/60 max-h-[500px] overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs font-medium">
                No synchronization records recorded yet. Run a manual sync in the Connectors tab to generate audit telemetry!
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isSelected = selectedLog?.id === log.id
                return (
                  <button
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`w-full text-left p-3.5 sm:p-4 transition-colors duration-150 flex items-start justify-between gap-3 ${
                      isSelected 
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-l-4 border-blue-600' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {log.sync_status === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        )}
                        <span className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                          {log.sync_status.toUpperCase().replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-2xs text-gray-500 dark:text-gray-400">
                        Executed: {new Date(log.completed_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right text-2xs space-y-0.5">
                      <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                        +{log.success_count} success
                      </div>
                      {log.error_count > 0 && (
                        <div className="font-semibold text-amber-600 dark:text-amber-400">
                          {log.error_count} flagged
                        </div>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right/Bottom Column: Per-Record Diagnostic Details (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/60 dark:bg-gray-900/50">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-xs sm:text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              Per-Record Error Diagnostic Inspector
            </h3>
            {selectedLog && selectedLog.error_count > 0 && (
              <button
                onClick={onNavigateToMapping}
                className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-2xs transition flex items-center gap-1 shadow-2xs"
              >
                Resolve Mappings <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            {!selectedLog ? (
              <div className="p-12 text-center text-gray-400 text-xs font-medium">
                Select an execution log on the left to inspect detailed transaction-level diagnostic traces and root cause analysis.
              </div>
            ) : selectedLog.error_count === 0 ? (
              <div className="p-8 text-center bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-200 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-base">All Transactions Synced Cleanly</h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                  During this sync run, all {selectedLog.total_records} fetched accounting expenses matched verified WBS work packages and ingested without duplication.
                </p>
              </div>
            ) : (
              /* Diagnostic Table of Errors (Adjoining Open Question #4 & Section 3.4 requirement) */
              <div className="space-y-4">
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 rounded-xl text-xs sm:text-sm text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Partial Ingestion Protection Triggered:</span>
                    <p className="text-xs opacity-90 mt-0.5 leading-relaxed">
                      To safeguard project financials against unverified attribution, {selectedLog.error_count} transaction(s) below were safely intercepted and excluded from actuals totals.
                    </p>
                  </div>
                </div>

                {/* Per-Record List (Stacked mobile cards / structured rows) */}
                <div className="space-y-3">
                  {selectedLog.error_details?.map((err, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40 space-y-2.5 text-xs sm:text-sm"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-200/60 dark:border-gray-700/60">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-2xs font-bold px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                            Ref: {err.externalRecordId}
                          </span>
                          <span className="font-bold text-gray-900 dark:text-white">
                            {err.accountName} ({err.accountCode})
                          </span>
                        </div>

                        <span className="font-mono font-black text-amber-600 dark:text-amber-400 self-start sm:self-auto">
                          ${err.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                        </span>
                      </div>

                      <div className="flex items-start gap-2 text-xs text-red-700 dark:text-red-400 font-medium">
                        <span className="px-1.5 py-0.5 rounded text-2xs font-bold uppercase bg-red-100 dark:bg-red-900/60 text-red-800 dark:text-red-200 flex-shrink-0">
                          {err.reason || 'Rejection'}
                        </span>
                        <span>{err.errorMessage}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

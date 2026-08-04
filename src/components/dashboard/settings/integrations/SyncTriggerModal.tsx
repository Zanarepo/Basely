'use client'

import React, { useState } from 'react'
import { ErpConfig } from '@/lib/erp/actions'
import { X, RefreshCw, Calendar, History, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { SyncExecutionResult } from '@/lib/erp/adapters/types'

interface SyncTriggerModalProps {
  isOpen: boolean
  config: ErpConfig | null
  isSyncing: boolean
  syncResult: SyncExecutionResult | null
  onClose: () => void
  onExecuteSync: (configId: string, options: { backfill?: boolean; startDate?: string }) => void
  onViewDiagnostics: () => void
}

export const SyncTriggerModal: React.FC<SyncTriggerModalProps> = ({
  isOpen,
  config,
  isSyncing,
  syncResult,
  onClose,
  onExecuteSync,
  onViewDiagnostics
}) => {
  const [enableBackfill, setEnableBackfill] = useState<boolean>(false)
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  )

  if (!isOpen || !config) return null

  const handleSyncSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onExecuteSync(config.id, {
      backfill: enableBackfill,
      startDate: enableBackfill ? startDate : undefined
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-fadeIn">
      {/* Responsive Dialog: Max width adapts on mobile vs tablet/desktop */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col sm:my-8 animate-scaleUp">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/80">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
              <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-snug">
                Run Manual Synchronization
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Target: {config.connector_type.toUpperCase()} Connector
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSyncing}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Configuration Form or Result Display */}
        <div className="p-5 sm:p-6 space-y-5 text-sm">
          {!syncResult ? (
            <form id="sync-form" onSubmit={handleSyncSubmit} className="space-y-5">
              <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-xs sm:text-sm text-blue-900 dark:text-blue-200">
                <p className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Automated Financial Ledger Ingestion
                </p>
                <p className="mt-1 text-gray-600 dark:text-gray-300 leading-relaxed">
                  Transactions will be verified against mapped WBS work packages and securely recorded as verified actual costs with automatic transaction deduplication and complete audit logging.
                </p>
              </div>

              {/* Historical Backfill Toggle (Open Question #3 Resolution) */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={enableBackfill}
                    onChange={(e) => setEnableBackfill(e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                      <History className="w-4 h-4 text-amber-500" />
                      Enable Historical Backfill
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      By default, sync operates incrementally on recent un-synced expenses. Toggle to explicitly import past project actuals from an earlier date.
                    </p>
                  </div>
                </label>

                {enableBackfill && (
                  <div className="pl-7 pt-2 border-t border-gray-100 dark:border-gray-700/50 flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-500" />
                      Backfill Start Date:
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </form>
          ) : (
            /* Execution Summary View */
            <div className="space-y-4 animate-fadeIn">
              <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                syncResult.status === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200' 
                  : syncResult.status === 'partial_failure'
                  ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200'
                  : 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/40 dark:border-red-800 dark:text-red-200'
              }`}>
                {syncResult.status === 'success' ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                ) : (
                  <ShieldAlert className="w-8 h-8 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                )}
                <div>
                  <h4 className="font-bold text-base">
                    Sync Execution {syncResult.status.toUpperCase().replace('_', ' ')}
                  </h4>
                  <p className="text-xs opacity-90 mt-0.5">
                    Completed in {(syncResult.durationMs / 1000).toFixed(2)}s • {syncResult.totalRecords} external record(s) processed
                  </p>
                </div>
              </div>

              {/* KPI Breakdown Grid */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-gray-50 dark:bg-gray-900/60 p-3 rounded-xl border border-gray-200/60 dark:border-gray-700">
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {syncResult.successCount}
                  </div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Successfully Ingested</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/60 p-3 rounded-xl border border-gray-200/60 dark:border-gray-700">
                  <div className={`text-2xl font-black ${syncResult.errorCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600'}`}>
                    {syncResult.errorCount}
                  </div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Failed / Unmapped</div>
                </div>
              </div>

              {syncResult.errorCount > 0 && (
                <div className="p-3.5 bg-gray-50 dark:bg-gray-900/80 rounded-xl border border-gray-200 dark:border-gray-700 text-xs space-y-1">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">
                    Why did some records fail?
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Transactions belonging to unmapped accounting categories (or failing strict WBS validation) are flagged safely without polluting cost accounts. An admin notification alert has been dispatched automatically.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          {!syncResult ? (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isSyncing}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium text-xs sm:text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="sync-form"
                disabled={isSyncing}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer hover:scale-[1.02]"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Executing Ingestion...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Start Ingestion
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              {syncResult.errorCount > 0 && (
                <button
                  onClick={onViewDiagnostics}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02]"
                >
                  <ShieldAlert className="w-4 h-4" />
                  Inspect Per-Record Failures
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs sm:text-sm transition cursor-pointer hover:scale-[1.02]"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

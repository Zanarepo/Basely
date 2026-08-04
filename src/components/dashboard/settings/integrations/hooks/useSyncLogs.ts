'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { SyncLogRecord, getErpSyncLogs } from '@/lib/erp/actions'

export interface UseSyncLogsReturn {
  logs: SyncLogRecord[]
  loading: boolean
  error: string | null
  selectedLog: SyncLogRecord | null
  filterStatus: 'all' | 'failure' | 'partial_failure' | 'success'
  setFilterStatus: (status: 'all' | 'failure' | 'partial_failure' | 'success') => void
  setSelectedLog: (log: SyncLogRecord | null) => void
  fetchLogs: () => Promise<void>
  filteredLogs: SyncLogRecord[]
  kpiSummary: {
    totalSyncs: number
    successRate: number
    totalRecordsSynced: number
    totalErrors: number
  }
}

export function useSyncLogs(organizationId: string): UseSyncLogsReturn {
  const [logs, setLogs] = useState<SyncLogRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLog, setSelectedLog] = useState<SyncLogRecord | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'failure' | 'partial_failure' | 'success'>('all')

  const fetchLogs = useCallback(async () => {
    if (!organizationId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await getErpSyncLogs(organizationId, 50)
      setLogs(data)
      // Autoselect latest log if errors present for immediate diagnosis
      if (data.length > 0 && !selectedLog) {
        const problemLog = data.find(l => l.error_count > 0)
        if (problemLog) setSelectedLog(problemLog)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sync diagnostic logs')
    } finally {
      setLoading(false)
    }
  }, [organizationId, selectedLog])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const filteredLogs = useMemo(() => {
    if (filterStatus === 'all') return logs
    return logs.filter(l => l.sync_status === filterStatus)
  }, [logs, filterStatus])

  const kpiSummary = useMemo(() => {
    const totalSyncs = logs.length
    let totalRecordsSynced = 0
    let totalErrors = 0
    let successfulSyncs = 0

    logs.forEach(log => {
      totalRecordsSynced += log.success_count
      totalErrors += log.error_count
      if (log.sync_status === 'success') successfulSyncs++
    })

    const successRate = totalSyncs > 0 ? Math.round((successfulSyncs / totalSyncs) * 100) : 100
    return { totalSyncs, successRate, totalRecordsSynced, totalErrors }
  }, [logs])

  return {
    logs,
    loading,
    error,
    selectedLog,
    filterStatus,
    setFilterStatus,
    setSelectedLog,
    fetchLogs,
    filteredLogs,
    kpiSummary
  }
}

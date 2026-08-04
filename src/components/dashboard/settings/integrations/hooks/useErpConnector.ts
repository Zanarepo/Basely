'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { 
  ErpConfig, 
  getErpConfigurations, 
  upsertErpConnector, 
  testErpConnectionAction, 
  triggerErpSyncAction,
  updateConnectorAuthAction
} from '@/lib/erp/actions'
import { AuthStatus, SyncExecutionResult } from '@/lib/erp/adapters/types'

export interface UseErpConnectorReturn {
  configs: ErpConfig[]
  loading: boolean
  error: string | null
  activeConfig: ErpConfig | undefined
  isPending: boolean
  testingConfigId: string | null
  syncingConfigId: string | null
  testResult: { id: string; status: AuthStatus } | null
  lastSyncResult: { id: string; result: SyncExecutionResult } | null
  fetchConfigs: () => Promise<void>
  toggleConnector: (connectorType: string, enabled: boolean) => Promise<boolean>
  toggleAutoSync: (connectorType: string, autoSync: boolean) => Promise<boolean>
  testConnection: (configId: string, overrideAuthConfig?: Record<string, unknown>) => Promise<AuthStatus>
  runSync: (configId: string, options?: { backfill?: boolean; startDate?: string }) => Promise<SyncExecutionResult | null>
  updateAuthConfig: (configId: string, authConfig: Record<string, unknown>) => Promise<boolean>
  clearResults: () => void
}

export function useErpConnector(organizationId: string, defaultType = 'quickbooks'): UseErpConnectorReturn {
  const [configs, setConfigs] = useState<ErpConfig[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [testingConfigId, setTestingConfigId] = useState<string | null>(null)
  const [syncingConfigId, setSyncingConfigId] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ id: string; status: AuthStatus } | null>(null)
  const [lastSyncResult, setLastSyncResult] = useState<{ id: string; result: SyncExecutionResult } | null>(null)
  const [isPending, startTransition] = useTransition()

  const fetchConfigs = useCallback(async () => {
    if (!organizationId) return
    setLoading(true)
    setError(null)
    try {
      const data = await getErpConfigurations(organizationId)
      setConfigs(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ERP configurations')
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    fetchConfigs()
  }, [fetchConfigs])

  const activeConfig = configs.find(c => c.connector_type === defaultType) || configs[0]

  const toggleConnector = async (connectorType: string, enabled: boolean): Promise<boolean> => {
    return new Promise(resolve => {
      startTransition(async () => {
        setError(null)
        const res = await upsertErpConnector(organizationId, connectorType, { enabled })
        if (res.success && res.data) {
          await fetchConfigs()
          resolve(true)
        } else {
          setError(res.error || 'Failed to update connector status')
          resolve(false)
        }
      })
    })
  }

  const toggleAutoSync = async (connectorType: string, autoSync: boolean): Promise<boolean> => {
    return new Promise(resolve => {
      startTransition(async () => {
        setError(null)
        const res = await upsertErpConnector(organizationId, connectorType, { auto_sync: autoSync })
        if (res.success) {
          await fetchConfigs()
          resolve(true)
        } else {
          setError(res.error || 'Failed to update auto-sync setting')
          resolve(false)
        }
      })
    })
  }

  const updateAuthConfig = async (configId: string, authConfig: Record<string, unknown>): Promise<boolean> => {
    const res = await updateConnectorAuthAction(configId, authConfig)
    if (res.success) {
      setTestResult({ id: configId, status: { connected: true, accountName: (authConfig.companyName as string) || 'Verified Connection' } })
      await fetchConfigs()
      return true
    } else {
      const errorMsg = res.error || 'Failed to verify and save connection settings'
      setError(errorMsg)
      setTestResult({ id: configId, status: { connected: false, error: errorMsg } })
      await fetchConfigs()
      return false
    }
  }

  const testConnection = async (configId: string, overrideAuthConfig?: Record<string, unknown>): Promise<AuthStatus> => {
    setTestingConfigId(configId)
    setTestResult(null)
    try {
      const res = await testErpConnectionAction(configId, overrideAuthConfig)
      setTestResult({ id: configId, status: res })
      await fetchConfigs()
      return res
    } finally {
      setTestingConfigId(null)
    }
  }

  const runSync = async (configId: string, options?: { backfill?: boolean; startDate?: string }): Promise<SyncExecutionResult | null> => {
    setSyncingConfigId(configId)
    setLastSyncResult(null)
    setError(null)
    try {
      const res = await triggerErpSyncAction(configId, options)
      if (res.success && res.result) {
        setLastSyncResult({ id: configId, result: res.result })
        await fetchConfigs()
        return res.result
      } else {
        setError(res.error || 'Sync execution failed')
        return null
      }
    } finally {
      setSyncingConfigId(null)
    }
  }

  const clearResults = useCallback(() => {
    setTestResult(null)
    setLastSyncResult(null)
    setError(null)
  }, [])

  return {
    configs,
    loading,
    error,
    activeConfig,
    isPending,
    testingConfigId,
    syncingConfigId,
    testResult,
    lastSyncResult,
    fetchConfigs,
    toggleConnector,
    toggleAutoSync,
    testConnection,
    runSync,
    updateAuthConfig,
    clearResults
  }
}


'use client'

import React, { useState, useEffect } from 'react'
import { useWorkspace } from '@/components/dashboard/WorkspaceContext'
import { ToastContainer, type ToastMessage } from '@/components/dashboard/Toast'
import { useErpConnector } from './hooks/useErpConnector'
import { useAccountMapping } from './hooks/useAccountMapping'
import { useSyncLogs } from './hooks/useSyncLogs'
import { ConnectorCard } from './ConnectorCard'
import { AccountMappingTable } from './AccountMappingTable'
import { SyncStatusDashboard } from './SyncStatusDashboard'
import { SyncTriggerModal } from './SyncTriggerModal'
import { ErpConfig, upsertErpConnector } from '@/lib/erp/actions'
import { Layers, Activity, ShieldAlert, Plug, Sliders } from 'lucide-react'

export function ErpIntegrationContainer() {
  const { activeWorkspace } = useWorkspace()
  const organizationId = activeWorkspace?.id || ''
  const userRole = activeWorkspace?.role || ''

  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [mappingConnectorType, setMappingConnectorType] = useState<string>('quickbooks')
  const connectorState = useErpConnector(organizationId, 'quickbooks')
  const { activeConfig } = connectorState
  const mappingConfig = connectorState.configs.find(c => c.connector_type === mappingConnectorType) || activeConfig
  const mappingState = useAccountMapping(mappingConfig, organizationId)
  const logsState = useSyncLogs(organizationId)

  const [activeTab, setActiveTab] = useState<'connectors' | 'mapping' | 'diagnostics'>('connectors')
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [modalConfig, setModalConfig] = useState<ErpConfig | null>(null)

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, type, message }])
  }

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  // Ensure all ERP connector configurations exist in DB when admin opens the panel
  useEffect(() => {
    if (organizationId && !connectorState.loading) {
      const existingTypes = new Set(connectorState.configs.map(c => c.connector_type))
      const allTypes = ['quickbooks', 'netsuite', 'sap', 'xero']
      const missingTypes = allTypes.filter(t => !existingTypes.has(t))
      
      if (missingTypes.length > 0) {
        Promise.all(
          missingTypes.map(t => upsertErpConnector(organizationId, t, { enabled: false, auto_sync: false }))
        ).then(() => {
          connectorState.fetchConfigs()
        })
      }
    }
  }, [organizationId, connectorState.configs, connectorState.loading, connectorState])

  const handleUpdateAuth = async (connectorType: string, auth: Record<string, unknown>): Promise<boolean> => {
    const conf = connectorState.configs.find(c => c.connector_type === connectorType)
    let success = false
    if (!conf) {
      const res = await upsertErpConnector(organizationId, connectorType, { enabled: true, auto_sync: false, auth_config: auth })
      await connectorState.fetchConfigs()
      success = res.success
    } else {
      success = await connectorState.updateAuthConfig(conf.id, auth)
    }
    if (success) {
      showToast('success', 'Configuration and credentials saved successfully!')
    } else {
      showToast('error', 'Failed to save configuration details.')
    }
    return success
  }

  if (userRole !== 'Admin' && userRole !== 'Owner') {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl space-y-3">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Organization Admin Privileges Required</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 max-w-lg mx-auto">
          ERP and accounting integration configurations contain sensitive financial mapping schemas and organization credentials. Only Organization Admins or Owners can view and modify these settings.
        </p>
      </div>
    )
  }

  const handleOpenSyncModal = (config: ErpConfig) => {
    setModalConfig(config)
    connectorState.clearResults()
    setIsModalOpen(true)
  }

  const handleExecuteSync = async (configId: string, options: { backfill?: boolean; startDate?: string }) => {
    await connectorState.runSync(configId, options)
    await logsState.fetchLogs()
    showToast('info', 'Sync ingestion process executed')
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setModalConfig(null)
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-fadeIn text-gray-900 dark:text-white relative">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-md shadow-indigo-500/20 flex-shrink-0">
            <Layers className="w-6 h-6 animate-pulse-slow" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-app-fg">
              Enterprise Integration Architecture
            </h1>
            <p className="text-xs sm:text-sm text-app-muted font-medium mt-1">
              Unified enterprise cost accounting connectors for automated actual cost ingestion into project WBS elements.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex overflow-x-auto pb-2 border-b border-gray-200 dark:border-gray-800 gap-2 sm:gap-6 text-sm font-bold scrollbar-none">
        <button
          onClick={() => setActiveTab('connectors')}
          className={`flex items-center gap-2 py-2.5 px-3 rounded-t-xl transition-all relative whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/60 ${
            activeTab === 'connectors'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          <Plug className={`w-4 h-4 ${activeTab === 'connectors' ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
          <span>Systems & Connectors</span>
          {activeTab === 'connectors' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-fadeIn" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('mapping')}
          className={`flex items-center gap-2 py-2.5 px-3 rounded-t-xl transition-all relative whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/60 ${
            activeTab === 'mapping'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          <Sliders className={`w-4 h-4 ${activeTab === 'mapping' ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
          <span>Account to WBS Mapping</span>
          <span className="px-1.5 py-0.5 rounded-full text-2xs font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 border border-amber-200/50 dark:border-amber-700/50">
            {mappingState.stats.unmapped}
          </span>
          {activeTab === 'mapping' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-fadeIn" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`flex items-center gap-2 py-2.5 px-3 rounded-t-xl transition-all relative whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/60 ${
            activeTab === 'diagnostics'
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          <Activity className={`w-4 h-4 ${activeTab === 'diagnostics' ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
          <span>Sync Telemetry & Logs</span>
          {activeTab === 'diagnostics' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-fadeIn" />
          )}
        </button>
        
        <div className="flex-1 text-right items-center justify-end pr-2 font-mono text-2xs text-gray-400 hidden sm:flex">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping mr-2" />
          Sync Engine Online
        </div>
      </div>

      {/* Tab 1: Connectors List & Configuration */}
      {activeTab === 'connectors' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl divide-y divide-gray-100 dark:divide-gray-800/80 shadow-2xs overflow-hidden">
            <ConnectorCard
              id="quickbooks"
              name="QuickBooks Online (QBO)"
              description="Sync subcontractor labor, materials, and expense accounts to project WBS packages."
              iconColor="bg-emerald-600"
              config={connectorState.configs.find(c => c.connector_type === 'quickbooks') || connectorState.activeConfig}
              isPending={connectorState.isPending}
              testingId={connectorState.testingConfigId}
              syncingId={connectorState.syncingConfigId}
              testResult={connectorState.testResult}
              showToast={showToast}
              onToggleConnect={(val) => {
                connectorState.toggleConnector('quickbooks', val)
                showToast('info', val ? 'QuickBooks connector enabled' : 'QuickBooks connector disabled')
              }}
              onToggleAutoSync={(val) => {
                connectorState.toggleAutoSync('quickbooks', val)
                showToast('info', val ? 'Auto-sync cron enabled for QuickBooks' : 'Auto-sync disabled')
              }}
              onTestConnection={(id, auth) => {
                connectorState.testConnection(id, auth)
              }}
              onOpenSyncModal={handleOpenSyncModal}
              onSelectMappingTab={() => {
                setMappingConnectorType('quickbooks')
                setActiveTab('mapping')
              }}
              onUpdateAuth={(auth) => handleUpdateAuth('quickbooks', auth)}
            />

            <ConnectorCard
              id="netsuite"
              name="NetSuite Cloud ERP"
              description="Connect SuiteScript general ledger and project accounting suites via REST SuiteTalk."
              iconColor="bg-blue-600"
              config={connectorState.configs.find(c => c.connector_type === 'netsuite')}
              isPending={connectorState.isPending}
              testingId={connectorState.testingConfigId}
              syncingId={connectorState.syncingConfigId}
              testResult={connectorState.testResult}
              showToast={showToast}
              onToggleConnect={(val) => {
                connectorState.toggleConnector('netsuite', val)
                showToast('info', val ? 'NetSuite connector enabled' : 'NetSuite connector disabled')
              }}
              onToggleAutoSync={(val) => {
                connectorState.toggleAutoSync('netsuite', val)
                showToast('info', val ? 'Auto-sync cron enabled for NetSuite' : 'Auto-sync disabled')
              }}
              onTestConnection={(id, auth) => {
                connectorState.testConnection(id, auth)
              }}
              onOpenSyncModal={handleOpenSyncModal}
              onSelectMappingTab={() => {
                setMappingConnectorType('netsuite')
                setActiveTab('mapping')
              }}
              onUpdateAuth={(auth) => handleUpdateAuth('netsuite', auth)}
            />

            <ConnectorCard
              id="sap"
              name="SAP S/4HANA Financials"
              description="Ingest cost centers and WBS internal enterprise accounting orders via OData REST API."
              iconColor="bg-indigo-700"
              config={connectorState.configs.find(c => c.connector_type === 'sap')}
              isPending={connectorState.isPending}
              testingId={connectorState.testingConfigId}
              syncingId={connectorState.syncingConfigId}
              testResult={connectorState.testResult}
              showToast={showToast}
              onToggleConnect={(val) => {
                connectorState.toggleConnector('sap', val)
                showToast('info', val ? 'SAP connector enabled' : 'SAP connector disabled')
              }}
              onToggleAutoSync={(val) => {
                connectorState.toggleAutoSync('sap', val)
                showToast('info', val ? 'Auto-sync cron enabled for SAP' : 'Auto-sync disabled')
              }}
              onTestConnection={(id, auth) => {
                connectorState.testConnection(id, auth)
              }}
              onOpenSyncModal={handleOpenSyncModal}
              onSelectMappingTab={() => {
                setMappingConnectorType('sap')
                setActiveTab('mapping')
              }}
              onUpdateAuth={(auth) => handleUpdateAuth('sap', auth)}
            />

            <ConnectorCard
              id="xero"
              name="Xero Cloud Accounting"
              description="Map Xero cost account line items and expense claims directly into actuals."
              iconColor="bg-cyan-600"
              config={connectorState.configs.find(c => c.connector_type === 'xero')}
              isPending={connectorState.isPending}
              testingId={connectorState.testingConfigId}
              syncingId={connectorState.syncingConfigId}
              testResult={connectorState.testResult}
              showToast={showToast}
              onToggleConnect={(val) => {
                connectorState.toggleConnector('xero', val)
                showToast('info', val ? 'Xero connector enabled' : 'Xero connector disabled')
              }}
              onToggleAutoSync={(val) => {
                connectorState.toggleAutoSync('xero', val)
                showToast('info', val ? 'Auto-sync cron enabled for Xero' : 'Auto-sync disabled')
              }}
              onTestConnection={(id, auth) => {
                connectorState.testConnection(id, auth)
              }}
              onOpenSyncModal={handleOpenSyncModal}
              onSelectMappingTab={() => {
                setMappingConnectorType('xero')
                setActiveTab('mapping')
              }}
              onUpdateAuth={(auth) => handleUpdateAuth('xero', auth)}
            />
          </div>
        </div>
      )}

      {/* Tab 2: Chart of Accounts to WBS Mapping */}
      {activeTab === 'mapping' && (
        <AccountMappingTable
          mappingState={mappingState}
          selectedConnectorType={mappingConnectorType}
          onSelectConnectorType={(type) => setMappingConnectorType(type)}
          onNavigateToSync={() => setActiveTab('connectors')}
          showToast={showToast}
        />
      )}

      {/* Tab 3: Sync Diagnostics & Telemetry Log */}
      {activeTab === 'diagnostics' && (
        <SyncStatusDashboard
          logsState={logsState}
          onNavigateToMapping={() => setActiveTab('mapping')}
        />
      )}

      {/* Manual Sync Trigger Dialog */}
      <SyncTriggerModal
        isOpen={isModalOpen}
        config={modalConfig}
        isSyncing={!!connectorState.syncingConfigId}
        syncResult={connectorState.lastSyncResult ? connectorState.lastSyncResult.result : null}
        onClose={handleCloseModal}
        onExecuteSync={handleExecuteSync}
        onViewDiagnostics={() => {
          handleCloseModal()
          setActiveTab('diagnostics')
        }}
      />
    </div>
  )
}


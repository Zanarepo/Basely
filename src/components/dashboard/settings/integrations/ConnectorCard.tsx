'use client'

import React, { useState, useEffect } from 'react'
import { ErpConfig } from '@/lib/erp/actions'
import { CheckCircle2, AlertCircle, RefreshCw, Zap, Activity, ShieldCheck, Database, Key, Sparkles, Settings, Server, Lock } from 'lucide-react'
import { AuthStatus } from '@/lib/erp/adapters/types'

interface ConnectorCardProps {
  id: string
  name: string
  description: string
  iconColor: string
  badgeText?: string
  config: ErpConfig | undefined
  isPending: boolean
  testingId: string | null
  syncingId: string | null
  testResult: { id: string; status: AuthStatus } | null
  onToggleConnect: (enabled: boolean) => void
  onToggleAutoSync: (enabled: boolean) => void
  onTestConnection: (id: string, overrideAuth?: Record<string, unknown>) => void
  onOpenSyncModal: (config: ErpConfig) => void
  onSelectMappingTab: () => void
  onUpdateAuth?: (authConfig: Record<string, unknown>) => Promise<boolean>
  showToast?: (type: 'success' | 'error' | 'info', message: string) => void
}

export const ConnectorCard: React.FC<ConnectorCardProps> = ({
  id,
  name,
  description,
  iconColor,
  config,
  isPending,
  testingId,
  syncingId,
  testResult,
  onToggleConnect,
  onToggleAutoSync,
  onTestConnection,
  onOpenSyncModal,
  onUpdateAuth,
  showToast
}) => {
  const [showConfigDrawer, setShowConfigDrawer] = useState(false)
  const [isSavingAuth, setIsSavingAuth] = useState(false)

  // Auth fields from existing configuration
  const auth = (config?.auth_config as Record<string, unknown>) || {}
  const isLiveMode = Boolean(auth.liveMode)
  const [liveModeToggle, setLiveModeToggle] = useState<boolean>(isLiveMode)
  const [clientId, setClientId] = useState<string>((auth.clientId as string) || (auth.tenantId as string) || (auth.realmId as string) || '')
  const [clientSecret, setClientSecret] = useState<string>((auth.clientSecret as string) || (auth.token as string) || '')
  const [apiEndpoint, setApiEndpoint] = useState<string>((auth.apiEndpoint as string) || '')

  // Synchronize state when database fetch finishes loading after page refresh
  useEffect(() => {
    if (config?.auth_config) {
      const dbAuth = config.auth_config as Record<string, unknown>
      setLiveModeToggle(Boolean(dbAuth.liveMode))
      setClientId((dbAuth.clientId as string) || (dbAuth.tenantId as string) || (dbAuth.realmId as string) || '')
      setClientSecret((dbAuth.clientSecret as string) || (dbAuth.token as string) || '')
      setApiEndpoint((dbAuth.apiEndpoint as string) || '')
    }
  }, [config?.updated_at, config?.auth_config])

  const isConnected = config?.enabled && config?.connection_status === 'connected'
  const hasAuthError = config?.enabled && config?.connection_status === 'error'
  const isTesting = testingId === config?.id
  const isSyncing = syncingId === config?.id
  const companyName = (auth.companyName as string) || 'Connected Workspace'

  const handleSaveAuth = async () => {
    if (!onUpdateAuth) return
    setIsSavingAuth(true)
    try {
      const updatedAuth: Record<string, unknown> = {
        ...auth,
        liveMode: liveModeToggle,
        realmId: id === 'quickbooks' ? clientId : auth.realmId,
        tenantId: id === 'xero' ? clientId : auth.tenantId,
        clientId,
        clientSecret,
        token: clientSecret,
        apiEndpoint,
        companyName: liveModeToggle ? `${name} (Live API)` : `${name} (Simulated Demo)`
      }
      await onUpdateAuth(updatedAuth)
      if (!config || !config.enabled) {
        onToggleConnect(true)
      }
      setShowConfigDrawer(false)
    } finally {
      setIsSavingAuth(false)
    }
  }

  return (
    <div className="transition-colors bg-white dark:bg-gray-900 hover:bg-gray-50/40 dark:hover:bg-gray-800/30">
      {/* Main Enterprise Row */}
      <div className="p-4 sm:px-5 flex items-center justify-between gap-4">
        {/* Left: Connector Icon, Title, Status & Tags */}
        <div className="flex items-start sm:items-center space-x-3 sm:space-x-3.5 min-w-0 flex-1">
          <div className={`w-10 h-10 rounded-lg text-white ${iconColor} shadow-2xs flex-shrink-0 flex items-center justify-center`}>
            <Database className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {name}
              </h3>

              {/* Status Pill */}
              {isConnected ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-100/80 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
                  Connected
                </span>
              ) : hasAuthError ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-bold bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300">
                  <AlertCircle className="w-3 h-3 mr-1 text-red-600 animate-pulse" />
                  Failed
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  Inactive
                </span>
              )}

              {/* Mode Badge */}
              {config?.enabled && (
                isLiveMode ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800">
                    Live API
                  </span>
                ) : (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800">
                    Simulated Demo
                  </span>
                )
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
              {description}
            </p>
            {isConnected && config && (
              <div className="flex items-center flex-wrap gap-2 mt-1.5 text-2xs text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-medium text-gray-700 dark:text-gray-300">
                  Realm: <span className="font-bold">{companyName}</span>
                </span>
                {config.last_synced_at && (
                  <>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <span>Last sync: {new Date(config.last_synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Inline Controls & Action Button Group */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {!config?.enabled ? (
            <button
              onClick={() => setShowConfigDrawer(!showConfigDrawer)}
              className="px-3.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/80 text-gray-700 dark:text-gray-300 text-xs font-semibold transition shadow-2xs whitespace-nowrap cursor-pointer hover:scale-[1.02]"
            >
              Configure
            </button>
          ) : (
            <>
              {/* Test Connection Button */}
              <button
                onClick={() => {
                  onTestConnection(config.id)
                  showToast?.('info', 'Verifying connection credentials and endpoint accessibility...')
                }}
                disabled={isTesting || isPending}
                className="px-2.5 py-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/80 text-gray-700 dark:text-gray-300 text-xs font-semibold transition flex items-center gap-1 shadow-2xs disabled:opacity-50 whitespace-nowrap cursor-pointer hover:scale-[1.02]"
                title="Verify connection credentials"
              >
                <Activity className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-indigo-500' : 'text-emerald-600'}`} />
                <span>{isTesting ? 'Testing...' : 'Test'}</span>
              </button>

              {/* Sync Now Button */}
              <button
                onClick={() => onOpenSyncModal(config)}
                disabled={isSyncing || isPending}
                className="px-3 py-1 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold shadow-2xs transition-all flex items-center gap-1 disabled:opacity-50 whitespace-nowrap cursor-pointer hover:scale-[1.02]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>

              {/* Configure Gear Icon */}
              <button
                onClick={() => setShowConfigDrawer(!showConfigDrawer)}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer hover:scale-[1.05] ${
                  showConfigDrawer 
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400' 
                    : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 shadow-2xs'
                }`}
                title="Configure API Credentials & Modes"
              >
                <Settings className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Inline Test Result Message Banner */}
      {testResult && testResult.id === config?.id && (
        <div className={`px-5 py-2 border-t text-xs flex items-center justify-between gap-3 transition-colors ${
          testResult.status.connected ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200' : 'bg-red-50/80 dark:bg-red-950/40 border-red-200 dark:border-red-800/60 text-red-900 dark:text-red-200'
        }`}>
          <div className="flex items-center gap-2 font-medium truncate">
            {testResult.status.connected ? <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />}
            <span className="font-bold">
              {testResult.status.connected ? 'Connection verification succeeded!' : 'Connection test failed:'}
            </span>
            <span className="truncate">
              {testResult.status.connected ? `Realm verified: ${testResult.status.accountName || companyName}` : testResult.status.error}
            </span>
          </div>
          <button onClick={() => setShowConfigDrawer(true)} className="text-xs font-bold underline whitespace-nowrap opacity-90 hover:opacity-100 cursor-pointer">
            Configure Credentials
          </button>
        </div>
      )}

      {/* Expandable Configuration Panel */}
      {showConfigDrawer && config && (
        <div className="bg-gray-50 dark:bg-gray-800/60 border-t border-gray-200 dark:border-gray-800 p-4 sm:px-5 animate-fadeIn space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700/60 pb-2.5">
            <div className="flex items-center gap-2 font-bold text-gray-800 dark:text-gray-200 text-xs sm:text-sm">
              <Key className="w-4 h-4 text-indigo-500" />
              <span>{name} — Connectivity Setup</span>
            </div>
            <div className="flex items-center gap-4">
              {/* Enable Switch inside settings */}
              <label className="flex items-center gap-1.5 cursor-pointer select-none font-semibold text-gray-700 dark:text-gray-300">
                <span className="text-xs">Enabled</span>
                <input
                  type="checkbox"
                  checked={!!config.enabled}
                  disabled={isPending}
                  onChange={(e) => onToggleConnect(e.target.checked)}
                  className="h-4 w-4 text-indigo-500 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                />
              </label>

              {isConnected && (
                <label className="flex items-center gap-1.5 cursor-pointer select-none font-semibold text-gray-600 dark:text-gray-300 border-l border-gray-200 dark:border-gray-700 pl-3">
                  <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                  <span className="text-xs">Auto-Sync Cron</span>
                  <input
                    type="checkbox"
                    checked={!!config.auto_sync}
                    disabled={isPending}
                    onChange={(e) => onToggleAutoSync(e.target.checked)}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded cursor-pointer"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Mode Selector Pill Toggle */}
          <div className="grid grid-cols-2 gap-2 max-w-md font-medium">
            <button
              type="button"
              onClick={() => setLiveModeToggle(false)}
              className={`py-1.5 px-3 rounded-lg border flex items-center justify-center gap-1.5 text-xs transition cursor-pointer ${
                !liveModeToggle
                  ? 'bg-purple-600 text-white border-purple-600 font-bold shadow-2xs'
                  : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Simulated Demo Option
            </button>

            <button
              type="button"
              onClick={() => setLiveModeToggle(true)}
              className={`py-1.5 px-3 rounded-lg border flex items-center justify-center gap-1.5 text-xs transition cursor-pointer ${
                liveModeToggle
                  ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-2xs'
                  : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Live OAuth 2.0 / REST API
            </button>
          </div>

          {/* Mode Descriptions & Credentials Form */}
          {!liveModeToggle ? (
            <p className="text-xs text-purple-900 dark:text-purple-200 bg-purple-50/80 dark:bg-purple-950/40 p-3 rounded-lg border border-purple-200/80 dark:border-purple-900/60 leading-normal">
              <strong>Simulated Demo Mode Active:</strong> Execute test synchronizations, populate general ledgers, and verify mapping rules instantly without external API tokens or third-party OAuth approvals.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="sm:col-span-2">
                <p className="text-xs text-emerald-900 dark:text-emerald-200 bg-emerald-50/80 dark:bg-emerald-950/40 p-3 rounded-lg border border-emerald-200/80 dark:border-emerald-900/60 leading-normal">
                  <strong>Live Production Mode:</strong> Enter your live or sandbox OAuth credentials below to authorize automated general ledger fetches directly from Intuit, NetSuite, or SAP servers.
                </p>
              </div>
              
              <div>
                <label className="block text-2xs font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wider">
                  {id === 'quickbooks' ? 'Intuit Realm ID / Company ID' : id === 'xero' ? 'Xero Tenant UUID' : 'Client / Account ID'}
                </label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder={id === 'quickbooks' ? 'e.g. 9130353457198270' : 'Enter account identifier'}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs font-mono focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wider">
                  OAuth Access Token / Client Secret
                </label>
                <input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="eyJhbGciOiJSUzI1NiIs..."
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs font-mono focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {(id === 'netsuite' || id === 'sap') && (
                <div className="sm:col-span-2">
                  <label className="block text-2xs font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wider flex items-center gap-1">
                    <Server className="w-3 h-3 text-indigo-500" /> Custom Gateway URL / API Endpoint Host
                  </label>
                  <input
                    type="text"
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                    placeholder={id === 'sap' ? 'https://gateway.sap-s4hana.com' : 'https://12345.suitetalk.api.netsuite.com'}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs font-mono focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* Drawer Actions Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700/60">
            <button
              type="button"
              onClick={() => {
                const draftAuth: Record<string, unknown> = {
                  ...auth,
                  liveMode: liveModeToggle,
                  realmId: id === 'quickbooks' ? clientId : auth.realmId,
                  tenantId: id === 'xero' ? clientId : auth.tenantId,
                  clientId,
                  clientSecret,
                  token: clientSecret,
                  apiEndpoint,
                  companyName: liveModeToggle ? `${name} (Live API)` : `${name} (Simulated Demo)`
                }
                onTestConnection(config.id, draftAuth)
                showToast?.('info', 'Verifying connection credentials and endpoint accessibility...')
              }}
              disabled={isTesting || isPending}
              className="px-3.5 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer hover:scale-[1.02]"
            >
              <Activity className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing Credentials...' : '⚡ Test Credentials'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowConfigDrawer(false)}
                className="px-3.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium transition text-xs cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveAuth}
                disabled={isSavingAuth || isPending}
                className="px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-bold shadow-2xs text-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer hover:scale-[1.02]"
              >
                {isSavingAuth && <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                <span>Save Configuration</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

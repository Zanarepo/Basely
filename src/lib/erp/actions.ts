'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getErpAdapter } from './adapters'
import { ExternalAccount, AuthStatus, SyncExecutionResult } from './adapters/types'
import { executeErpSync } from './sync-engine'
import { revalidatePath } from 'next/cache'

export interface ErpConfig {
  id: string
  organization_id: string
  connector_type: 'quickbooks' | 'netsuite' | 'xero' | 'sap' | string
  account_mapping: Record<string, { wbsElementId: string; wbsName: string; projectId: string; projectName?: string }>
  enabled: boolean
  auto_sync: boolean
  connection_status: 'disconnected' | 'connected' | 'error'
  last_synced_at: string | null
  last_sync_status: 'success' | 'failure' | 'partial_failure' | null
  auth_config: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface SyncLogRecord {
  id: string
  organization_id: string
  configuration_id: string
  sync_status: 'success' | 'failure' | 'partial_failure'
  total_records: number
  success_count: number
  error_count: number
  error_details: Array<{
    externalRecordId: string
    accountCode: string
    accountName: string
    amount: number
    date: string
    errorMessage: string
    reason: string
  }>
  started_at: string
  completed_at: string
}

export async function getErpConfigurations(organizationId: string): Promise<ErpConfig[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('erp_connector_configurations')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching ERP configs:', error)
    return []
  }
  return (data || []) as ErpConfig[]
}

export async function upsertErpConnector(
  organizationId: string,
  connectorType: string,
  payload: { enabled?: boolean; auto_sync?: boolean; auth_config?: Record<string, unknown> }
): Promise<{ success: boolean; data?: ErpConfig; error?: string }> {
  const supabase = await createClient()

  // Ensure user is signed in and check role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // Check if configuration already exists for this org & type
  const { data: existing } = await supabase
    .from('erp_connector_configurations')
    .select('id, auth_config')
    .eq('organization_id', organizationId)
    .eq('connector_type', connectorType)
    .maybeSingle()

  let result: ErpConfig | null = null

  if (existing) {
    const updateData: Record<string, unknown> = {
      ...payload,
      auth_config: payload.auth_config
        ? { ...(existing.auth_config as Record<string, unknown>), ...payload.auth_config }
        : existing.auth_config,
      updated_at: new Date().toISOString()
    }
    if (payload.enabled !== undefined) {
      updateData.connection_status = payload.enabled ? 'connected' : 'disconnected'
    }

    const { data: updated, error } = await supabase
      .from('erp_connector_configurations')
      .update(updateData)
      .eq('id', existing.id)
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    result = updated as ErpConfig
  } else {
    const { data: inserted, error } = await supabase
      .from('erp_connector_configurations')
      .insert({
        organization_id: organizationId,
        connector_type: connectorType,
        enabled: payload.enabled ?? false,
        auto_sync: payload.auto_sync ?? false,
        auth_config: payload.auth_config ?? { realmId: '9130353457198270', companyName: `Connected ${connectorType.toUpperCase()} Ledger`, liveMode: false },
        connection_status: (payload.enabled ?? false) ? 'connected' : 'disconnected'
      })
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    result = inserted as ErpConfig
  }

  revalidatePath('/dashboard/settings/integrations')
  return { success: true, data: result }
}

export async function testErpConnectionAction(configId: string, overrideAuthConfig?: Record<string, unknown>): Promise<AuthStatus> {
  const supabase = await createClient()
  const { data: config } = await supabase
    .from('erp_connector_configurations')
    .select('connector_type, auth_config')
    .eq('id', configId)
    .single()

  if (!config) {
    return { connected: false, error: 'Configuration not found' }
  }

  const adapter = getErpAdapter(config.connector_type)
  const authConfigToTest = overrideAuthConfig || (config.auth_config as Record<string, unknown>)
  const res = await adapter.authenticate(authConfigToTest)
  
  await supabase
    .from('erp_connector_configurations')
    .update({ 
      connection_status: res.connected ? 'connected' : 'error', 
      updated_at: new Date().toISOString(),
      ...(overrideAuthConfig && res.connected ? { auth_config: overrideAuthConfig } : {})
    })
    .eq('id', configId)

  return res
}

export async function getExternalChartOfAccounts(configId: string): Promise<ExternalAccount[]> {
  const supabase = await createClient()
  const { data: config } = await supabase
    .from('erp_connector_configurations')
    .select('connector_type, auth_config')
    .eq('id', configId)
    .single()

  if (!config) return []
  const adapter = getErpAdapter(config.connector_type)
  return await adapter.getChartOfAccounts(config.auth_config as Record<string, unknown>)
}

export async function getOrgWbsElements(organizationId: string): Promise<Array<{
  id: string
  name: string
  code: string
  project_id: string
  projectName: string
}>> {
  const supabase = await createClient()
  
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('organization_id', organizationId)

  if (!projects || projects.length === 0) return []

  const projectMap: Record<string, string> = {}
  projects.forEach(p => { projectMap[p.id] = p.name })
  const projectIds = projects.map(p => p.id)

  const { data: elements, error } = await supabase
    .from('wbs_elements')
    .select('id, name, code, project_id')
    .in('project_id', projectIds)
    .order('code', { ascending: true })

  if (error || !elements) return []

  return elements.map(el => ({
    id: el.id,
    name: el.name,
    code: el.code || 'WBS',
    project_id: el.project_id,
    projectName: projectMap[el.project_id] || 'Unknown Project'
  }))
}

export async function saveAccountMappingAction(
  configId: string,
  accountMapping: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('erp_connector_configurations')
    .update({ account_mapping: accountMapping, updated_at: new Date().toISOString() })
    .eq('id', configId)

  if (error) return { success: false, error: error.message }
  revalidatePath('/dashboard/settings/integrations')
  return { success: true }
}

export async function triggerErpSyncAction(
  configId: string,
  options?: { backfill?: boolean; startDate?: string }
): Promise<{ success: boolean; result?: SyncExecutionResult; error?: string }> {
  try {
    const res = await executeErpSync(configId, options)
    revalidatePath('/dashboard/settings/integrations')
    return { success: true, result: res }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown exception occurred during sync'
    console.error('Trigger sync error:', err)
    return { success: false, error: msg }
  }
}

export async function getErpSyncLogs(organizationId: string, limit = 25): Promise<SyncLogRecord[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('erp_sync_logs')
    .select('*')
    .eq('organization_id', organizationId)
    .order('completed_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching sync logs:', error)
    return []
  }
  return (data || []) as SyncLogRecord[]
}

export async function updateConnectorAuthAction(
  configId: string,
  authConfig: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  const { data: config } = await supabase
    .from('erp_connector_configurations')
    .select('connector_type')
    .eq('id', configId)
    .single()

  let connectionStatus = 'connected'
  let authError: string | undefined = undefined

  if (config) {
    const adapter = getErpAdapter(config.connector_type)
    const testResult = await adapter.authenticate(authConfig)
    if (!testResult.connected) {
      connectionStatus = 'error'
      authError = testResult.error || 'Authentication verification failed'
    }
  }

  const { error } = await supabase
    .from('erp_connector_configurations')
    .update({ 
      auth_config: authConfig, 
      connection_status: connectionStatus,
      updated_at: new Date().toISOString() 
    })
    .eq('id', configId)

  if (error) return { success: false, error: error.message }
  if (authError) {
    revalidatePath('/dashboard/settings/integrations')
    return { success: false, error: authError }
  }
  revalidatePath('/dashboard/settings/integrations')
  return { success: true }
}


import { createAdminClient } from '@/utils/supabase/admin'
import { getErpAdapter, ErpAdapter, SyncExecutionResult, SyncErrorDetail } from './adapters'
import { dispatchNotification } from '@/lib/notifications/actions'
import { NextRequest } from 'next/server'
import { POST as actualCostsHandler } from '@/app/api/v1/projects/[projectId]/actual-costs/route'

export async function executeErpSync(
  configId: string, 
  options?: { backfill?: boolean; startDate?: string }
): Promise<SyncExecutionResult> {
  const startTime = Date.now()
  const supabase = createAdminClient()

  // 1. Fetch ERP configuration
  const { data: config, error: configErr } = await supabase
    .from('erp_connector_configurations')
    .select('*')
    .eq('id', configId)
    .single()

  if (configErr || !config) {
    throw new Error(`ERP Configuration not found: ${configErr?.message || 'Unknown ID'}`)
  }

  // 2. Select Adapter dynamically
  const adapter: ErpAdapter = getErpAdapter(config.connector_type)

  // 3. Authenticate and Fetch Transactions
  const auth = await adapter.authenticate(config.auth_config || {})
  if (!auth.connected) {
    throw new Error(`Failed to authenticate with external ERP: ${auth.error || 'Authentication denied'}`)
  }

  const transactions = await adapter.fetchTransactions(config.auth_config || {}, options)

  const errorDetails: SyncErrorDetail[] = []
  let successCount = 0

  // 4. Cache map of WBS element ID -> Project ID to reduce DB lookups
  const wbsProjectMap: Record<string, string> = {}

  // 5. Ingest each transaction via Sprint 27 Public API endpoint
  for (const txn of transactions) {
    const mapping = (config.account_mapping as Record<string, unknown>)?.[txn.accountId]
    
    // Check if external cost account has been mapped by admin
    if (!mapping) {
      errorDetails.push({
        externalRecordId: txn.id,
        accountCode: txn.accountId,
        accountName: txn.accountName,
        amount: txn.amount,
        date: txn.date,
        errorMessage: `Unmapped accounting category: "${txn.accountName}" (${txn.accountId}). Assign a WBS work package in Account Mapping.`,
        reason: 'unmapped_account'
      })
      continue
    }

    let wbsElementId: string | null = null
    let projectId: string | null = null

    if (typeof mapping === 'string') {
      wbsElementId = mapping
    } else if (typeof mapping === 'object' && mapping !== null) {
      wbsElementId = (mapping as { wbsElementId: string }).wbsElementId
      projectId = (mapping as { projectId?: string }).projectId || null
    }

    if (!wbsElementId) {
      errorDetails.push({
        externalRecordId: txn.id,
        accountCode: txn.accountId,
        accountName: txn.accountName,
        amount: txn.amount,
        date: txn.date,
        errorMessage: `Invalid WBS assignment for category "${txn.accountName}".`,
        reason: 'unmapped_account'
      })
      continue
    }

    // Lookup projectId if missing from mapping object
    if (!projectId) {
      if (wbsProjectMap[wbsElementId]) {
        projectId = wbsProjectMap[wbsElementId]
      } else {
        const { data: wbsData } = await supabase
          .from('wbs_elements')
          .select('project_id')
          .eq('id', wbsElementId)
          .single()

        if (wbsData?.project_id) {
          const validProjectId = String(wbsData.project_id)
          projectId = validProjectId
          wbsProjectMap[wbsElementId] = validProjectId
        } else {
          errorDetails.push({
            externalRecordId: txn.id,
            accountCode: txn.accountId,
            accountName: txn.accountName,
            amount: txn.amount,
            date: txn.date,
            errorMessage: `Target WBS element (${wbsElementId}) no longer exists in any active project.`,
            reason: 'unmapped_account'
          })
          continue
        }
      }
    }

    if (!projectId) {
      errorDetails.push({
        externalRecordId: txn.id,
        accountCode: txn.accountId,
        accountName: txn.accountName,
        amount: txn.amount,
        date: txn.date,
        errorMessage: `Unable to resolve valid project ID for target WBS element (${wbsElementId}).`,
        reason: 'unmapped_account'
      })
      continue
    }

    // Construct request payload matching Sprint 27 Public API contract
    const payload = {
      wbs_element_id: wbsElementId,
      amount: txn.amount,
      currency: txn.currency || 'USD',
      date: txn.date,
      description: `[${txn.vendor || adapter.name}] ${txn.description} (Ref: ${txn.id})`,
      external_record_id: txn.id
    }

    try {
      // Invoke Sprint 27 route directly via in-memory NextRequest to avoid loopback network failure
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const reqUrl = `${baseUrl}/api/v1/projects/${projectId}/actual-costs`
      
      const req = new NextRequest(reqUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer erp-system-sync-token',
          'X-ERP-Internal-Org': config.organization_id
        },
        body: JSON.stringify(payload)
      })

      const response = await actualCostsHandler(req, { params: Promise.resolve({ projectId: projectId as string }) })
      const status = response.status

      if (status === 201 || status === 200 || status === 409) {
        // 201 Created, 200 Already Synced, 409 Idempotency Conflict -> record as success/handled
        successCount++
      } else {
        const errData = await response.json().catch(() => ({ error: 'Unknown response format' }))
        errorDetails.push({
          externalRecordId: txn.id,
          accountCode: txn.accountId,
          accountName: txn.accountName,
          amount: txn.amount,
          date: txn.date,
          errorMessage: `API Ingestion Rejected (${status}): ${errData.error || 'Request failed'}`,
          reason: 'api_rejection'
        })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Execution exception'
      errorDetails.push({
        externalRecordId: txn.id,
        accountCode: txn.accountId,
        accountName: txn.accountName,
        amount: txn.amount,
        date: txn.date,
        errorMessage: `Sync pipeline exception: ${msg}`,
        reason: 'network_error'
      })
    }
  }

  // 6. Determine overall sync execution status
  const errorCount = errorDetails.length
  const totalRecords = transactions.length
  let finalStatus: 'success' | 'failure' | 'partial_failure' = 'success'

  if (errorCount > 0 && successCount === 0) {
    finalStatus = 'failure'
  } else if (errorCount > 0 && successCount > 0) {
    finalStatus = 'partial_failure'
  }

  const durationMs = Date.now() - startTime

  // 7. Persist execution results to erp_sync_logs table
  await supabase
    .from('erp_sync_logs')
    .insert({
      organization_id: config.organization_id,
      configuration_id: configId,
      sync_status: finalStatus,
      total_records: totalRecords,
      success_count: successCount,
      error_count: errorCount,
      error_details: errorDetails
    })

  // 8. Update connector status
  await supabase
    .from('erp_connector_configurations')
    .update({
      last_synced_at: new Date().toISOString(),
      last_sync_status: finalStatus,
      connection_status: 'connected',
      updated_at: new Date().toISOString()
    })
    .eq('id', configId)

  // 9. Dispatch Admin Notification on sync failures (Task 4.2)
  if (finalStatus !== 'success') {
    try {
      const { data: admins } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', config.organization_id)
        .eq('role', 'Admin')

      if (admins && admins.length > 0) {
        for (const adm of admins) {
          await dispatchNotification({
            userId: adm.user_id,
            triggerType: 'erp_sync_failure',
            referenceEntityType: 'erp_connector_configurations',
            referenceEntityId: configId,
            contentSummary: `ERP Sync ${finalStatus === 'partial_failure' ? 'Partial Failure' : 'Failed'} for ${config.connector_type.toUpperCase()}: ${errorCount} record(s) required attention or mapping.`,
            emailContext: {
              subject: `[Basely Alert] ERP Sync ${finalStatus === 'partial_failure' ? 'Partial Failure' : 'Failure'} (${errorCount} errors)`,
              title: `ERP Connector Sync Report: ${errorCount} Transaction(s) Failed`,
              message: `The synchronization with ${config.connector_type} resulted in ${errorCount} unmapped or rejected transaction records. Please review per-record error diagnostics in the Integrations dashboard and update your account-to-WBS mappings.`,
              actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings/integrations`
            }
          })
        }
      }
    } catch (notifErr) {
      console.error('Error dispatching ERP sync failure notifications:', notifErr)
    }
  }

  return {
    status: finalStatus,
    totalRecords,
    successCount,
    errorCount,
    details: errorDetails,
    durationMs
  }
}

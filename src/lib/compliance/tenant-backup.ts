import { createAdminClient } from '@/utils/supabase/admin'
import { compileOrganizationDataExport } from './export-service'

export async function executeTenantBackup(organizationId: string) {
  const supabase = createAdminClient()

  try {
    // 1. Verify premium/enterprise requirement (Task 4.4)
    const { data: sub } = await supabase
      .from('organization_subscriptions')
      .select('tier_id')
      .eq('organization_id', organizationId)
      .single()

    if (!sub || !['premium', 'enterprise'].includes(sub.tier_id)) {
      return {
        success: false,
        error: 'Per-tenant backup is restricted to Premium and Enterprise tiers.'
      }
    }

    // 2. Reuse the export-service data extraction pipeline
    const exportResult = await compileOrganizationDataExport(organizationId)
    
    if (!exportResult.success) {
      throw new Error(exportResult.error)
    }

    // 3. Serialize and upload to isolated bucket
    const fileContent = JSON.stringify({
      metadata: {
        organizationId,
        timestamp: new Date().toISOString(),
        checklist: exportResult.checklist
      },
      data: exportResult.data
    }, null, 2)

    const fileName = `tenant_${organizationId}_backup_${new Date().getTime()}.json`

    const { error: uploadError } = await supabase
      .storage
      .from('tenant_backups')
      .upload(fileName, fileContent, {
        contentType: 'application/json',
        upsert: false
      })

    if (uploadError) throw new Error(uploadError.message)

    return {
      success: true,
      fileName
    }
  } catch (error: any) {
    console.error('Tenant backup failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

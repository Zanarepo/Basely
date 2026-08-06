import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    // Basic protection (in production, use Vercel cron secret or similar)
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const after = oneWeekAgo.toISOString()

    // 1. Fetch Audit Logs
    const { data: auditLogs } = await supabase
      .from('backoffice_audit_logs')
      .select('*')
      .gte('created_at', after)

    // 2. Fetch Approval Requests
    const { data: approvals } = await supabase
      .from('approval_requests')
      .select('*')
      .gte('created_at', after)

    // 3. Fetch SSO Configs
    const { data: ssoConfigs } = await supabase
      .from('sso_configurations')
      .select('*')
      .gte('created_at', after)

    const evidencePackage = {
      generatedAt: new Date().toISOString(),
      period: {
        from: after,
        to: new Date().toISOString()
      },
      evidence: {
        auditLogs: auditLogs || [],
        approvals: approvals || [],
        ssoConfigurations: ssoConfigs || []
      }
    }

    const fileContent = JSON.stringify(evidencePackage, null, 2)
    const fileName = `soc2_evidence_${new Date().toISOString().split('T')[0]}.json`

    const { error: uploadError } = await supabase
      .storage
      .from('soc2_compliance_evidence')
      .upload(fileName, fileContent, {
        contentType: 'application/json',
        upsert: true
      })

    if (uploadError) throw new Error(uploadError.message)

    return NextResponse.json({ success: true, fileName })
  } catch (error: any) {
    console.error('SOC 2 Evidence Generation failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

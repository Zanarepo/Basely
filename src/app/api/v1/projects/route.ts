import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiRequest, requireEntityScope, requireFeatureGate } from '@/lib/api-auth/middleware'
import { createAdminClient } from '@/utils/supabase/admin'

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateApiRequest()
    if (auth instanceof Response) return auth

    const scopeCheck = requireEntityScope(auth, 'projects')
    if (scopeCheck) return scopeCheck

    const gateCheck = await requireFeatureGate(auth.organizationId, 'foundation.workspace')
    if (gateCheck) return gateCheck

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('organization_id', auth.organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database query error on projects:', error)
      return NextResponse.json({ error: error.message || 'Failed to fetch projects' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error('API /v1/projects error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


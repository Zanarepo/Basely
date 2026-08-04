import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiRequest, requireEntityScope, requireFeatureGate } from '@/lib/api-auth/middleware'
import { createAdminClient } from '@/utils/supabase/admin'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const auth = await authenticateApiRequest()
    if (auth instanceof Response) return auth

    const scopeCheck = requireEntityScope(auth, 'activities')
    if (scopeCheck) return scopeCheck

    const gateCheck = await requireFeatureGate(auth.organizationId, 'reporting.analytics')
    if (gateCheck) return gateCheck

    const supabase = createAdminClient()
    
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('organization_id', auth.organizationId)
      .single()
      
    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('project_id', projectId)
      .order('start_date', { ascending: true })

    if (error) {
      console.error('Database query error on activities:', error)
      return NextResponse.json({ error: error.message || 'Failed to fetch activities' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error('API /v1/projects/[id]/activities error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

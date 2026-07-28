import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiRequest, requireEntityScope } from '@/lib/api-auth/middleware'
import { createAdminClient } from '@/utils/supabase/admin'

export async function GET(
  req: NextRequest,
  { params }: any
) {
  try {
    const { projectId } = await params
    const auth = await authenticateApiRequest()
    if (auth instanceof Response) return auth

    const scopeCheck = requireEntityScope(auth, 'wbs')
    if (scopeCheck) return scopeCheck

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
      .from('wbs_elements')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Database query error on wbs_elements:', error)
      return NextResponse.json({ error: error.message || 'Failed to fetch WBS elements' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    console.error('API /v1/projects/[id]/wbs error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

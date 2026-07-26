import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiRequest, requireEntityScope, requireWriteScope } from '@/lib/api-auth/middleware'
import { createAdminClient } from '@/utils/supabase/admin'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const auth = await authenticateApiRequest()
    if (auth instanceof Response) return auth

    const scopeCheck = requireEntityScope(auth, 'actual_costs')
    if (scopeCheck) return scopeCheck
    
    const writeCheck = requireWriteScope(auth)
    if (writeCheck) return writeCheck

    const body = await req.json()
    const { activity_id, amount, date, description, resource_id } = body

    if (!activity_id || amount === undefined || !date) {
      return NextResponse.json({ error: 'Missing required fields: activity_id, amount, date' }, { status: 400 })
    }

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

    // Insert actual cost
    const { data, error } = await supabase
      .from('actual_costs')
      .insert({
        project_id: projectId,
        activity_id,
        amount,
        date,
        description: description || null,
        resource_id: resource_id || null,
        recorded_by_user_id: auth.keyId // Logging the API Key ID as the recorder
      })
      .select('id, amount, date, description')
      .single()

    if (error) {
      console.error('Insert actual cost error:', error)
      return NextResponse.json({ error: 'Failed to record actual cost' }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    console.error('API /v1/projects/[id]/actual-costs error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

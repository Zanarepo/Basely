import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiRequest, requireEntityScope, requireWriteScope, requireFeatureGate } from '@/lib/api-auth/middleware'
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

    const gateCheck = await requireFeatureGate(auth.organizationId, 'cost.actuals_tracking')
    if (gateCheck) return gateCheck

    const body = await req.json()
    const { wbs_element_id, activity_id, resource_rate_id, amount, currency, date, description, external_record_id } = body

    if (!wbs_element_id || amount === undefined || !date) {
      return NextResponse.json({ error: 'Missing required fields: wbs_element_id, amount, date' }, { status: 400 })
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

    // Verify WBS element exists and belongs to this project (Sprint 7 & 28 non-negotiable attribution rule)
    const { data: wbsElement, error: wbsError } = await supabase
      .from('wbs_elements')
      .select('id, project_id')
      .eq('id', wbs_element_id)
      .eq('project_id', projectId)
      .single()

    if (wbsError || !wbsElement) {
      return NextResponse.json({ error: 'WBS element not found in project or attribution mismatch' }, { status: 400 })
    }

    // Idempotency check: if external_record_id is supplied, check if record already exists
    if (external_record_id) {
      const { data: existing } = await supabase
        .from('actual_costs')
        .select('id, amount, date, description, external_record_id')
        .eq('external_record_id', external_record_id)
        .maybeSingle()

      if (existing) {
        return NextResponse.json({ data: existing, status: 'already_synced' }, { status: 200 })
      }
    }

    // Insert actual cost with source = 'api'
    const { data, error } = await supabase
      .from('actual_costs')
      .insert({
        wbs_element_id,
        activity_id: activity_id || null,
        resource_rate_id: resource_rate_id || null,
        amount,
        currency: currency || 'USD',
        date,
        description: description || null,
        source: 'api',
        external_record_id: external_record_id || null
      })
      .select('id, amount, date, description, external_record_id')
      .single()

    if (error) {
      if (error.code === '23505' || error.message?.includes('external_record_id')) {
        return NextResponse.json({ error: 'Duplicate external record ID (idempotency conflict)' }, { status: 409 })
      }
      console.error('Insert actual cost error:', error)
      return NextResponse.json({ error: 'Failed to record actual cost: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    console.error('API /v1/projects/[id]/actual-costs error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

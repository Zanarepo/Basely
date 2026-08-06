import { requireStaffWriteAccess } from '@/lib/backoffice/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const staff = await requireStaffWriteAccess()
    
    // Only superadmins can schedule deletions
    if (staff.role !== 'superadmin') {
      return NextResponse.json({ error: 'Only superadmins can schedule data deletion.' }, { status: 403 })
    }

    const { organizationId } = await req.json()
    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 30 days from now
    const gracePeriodEnd = new Date()
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 30)

    const { error } = await supabase.from('deletion_requests').insert({
      organization_id: organizationId,
      requested_by: staff.id,
      grace_period_ends_at: gracePeriodEnd.toISOString(),
      status: 'pending'
    })

    if (error) throw new Error(error.message)

    // Log the action
    await supabase.from('backoffice_audit_logs').insert({
      staff_id: staff.id,
      action: 'SCHEDULE_DELETION',
      target_resource: `organization:${organizationId}`,
      details: { grace_period_ends_at: gracePeriodEnd.toISOString() }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

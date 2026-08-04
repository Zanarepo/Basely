'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { getStaffSession, requireSuperadmin } from '@/lib/backoffice/auth'
import { revalidatePath } from 'next/cache'

export async function assignAccountManager(organizationId: string, targetStaffId: string, isPrimary: boolean) {
  try {
    await requireSuperadmin()

    const supabase = createAdminClient()
    
    // Check if staff is valid
    const { data: staff, error: staffError } = await supabase.from('internal_staff').select('role').eq('id', targetStaffId).single()
    if (staffError || !staff) throw new Error('Invalid staff selected')
    
    if (staff.role !== 'account_manager' && staff.role !== 'superadmin') {
      throw new Error('Staff member is not eligible to be an account manager')
    }

    const { error } = await supabase.from('account_assignments').insert({
      organization_id: organizationId,
      staff_id: targetStaffId,
      is_primary: isPrimary
    })

    if (error) {
      if (error.code === '23505') throw new Error('Staff member is already assigned to this account')
      throw error
    }

    revalidatePath(`/backoffice/tenants/${organizationId}`)
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err.message || 'Failed to assign staff' }
  }
}

export async function logHealthNote(organizationId: string, status: string, notes: string) {
  try {
    const staff = await getStaffSession()
    if (!staff) throw new Error('Not authorized')
    
    const supabase = createAdminClient()

    // Must be internal staff
    const { data: staffRecord, error: staffError } = await supabase.from('internal_staff').select('id').eq('auth_user_id', staff.id).single()
    if (staffError || !staffRecord) throw new Error('Not authorized')

    const { error } = await supabase.from('tenant_health_notes').insert({
      organization_id: organizationId,
      staff_id: staffRecord.id,
      health_status: status,
      notes
    })

    if (error) throw error

    revalidatePath(`/backoffice/tenants/${organizationId}`)
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err.message || 'Failed to log note' }
  }
}

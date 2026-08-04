import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export type StaffRole = 'superadmin' | 'support_senior' | 'support_junior' | 'account_manager' | 'support_admin'

export interface StaffSession {
  id: string
  auth_user_id: string
  email: string
  role: StaffRole
}

export async function getStaffSession(): Promise<StaffSession | null> {
  const supabase = await createClient()
  
  // 1. Get current authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return null

  // 2. Check if they are in the internal_staff table
  const { data: staff, error: staffError } = await supabase
    .from('internal_staff')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  if (staffError || !staff) return null

  return staff as StaffSession
}

export async function requireSuperadmin(): Promise<StaffSession> {
  const staff = await getStaffSession()
  if (!staff || staff.role !== 'superadmin') {
    throw new Error('Unauthorized: Superadmin access required')
  }
  return staff
}

// Support Write check: superadmin and support_senior can write. junior is read-only.
export async function requireStaffWriteAccess(): Promise<StaffSession> {
  const staff = await getStaffSession()
  if (!staff || staff.role === 'support_junior') {
    throw new Error('Unauthorized: Write access denied for this staff role')
  }
  return staff
}

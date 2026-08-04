'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export type StaffRoleClient = 'superadmin' | 'support_senior' | 'support_junior' | null

/**
 * Client-side hook to check if the currently logged-in user
 * also exists in the internal_staff table (i.e., is a platform admin).
 * Returns the staff role if they are, or null if they are not.
 */
export function usePlatformStaff() {
  const [staffRole, setStaffRole] = useState<StaffRoleClient>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function check() {
      try {
        const supabase = createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          console.log('[PlatformStaff] No authenticated user')
          setLoading(false)
          return
        }

        console.log('[PlatformStaff] Checking staff status for:', user.id)

        const { data: staff, error: staffError } = await supabase
          .from('internal_staff')
          .select('role')
          .eq('auth_user_id', user.id)
          .single()

        if (staffError) {
          // PGRST116 = no rows found, which is expected for non-staff users
          if (staffError.code !== 'PGRST116') {
            console.error('[PlatformStaff] Query error:', staffError.message, '| Code:', staffError.code, '| Details:', staffError.details, '| Hint:', staffError.hint)
          } else {
            console.log('[PlatformStaff] User is not in internal_staff')
          }
        }

        if (staff) {
          console.log('[PlatformStaff] Staff detected! Role:', staff.role)
          setStaffRole(staff.role as StaffRoleClient)
        }
      } catch (e) {
        console.error('[PlatformStaff] Unexpected error:', e)
      } finally {
        setLoading(false)
      }
    }

    check()
  }, [])

  return { staffRole, isPlatformStaff: staffRole !== null, loading }
}

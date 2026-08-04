import { getStaffSession, requireSuperadmin } from '@/lib/backoffice/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    // Only superadmins can promote users
    await requireSuperadmin()

    const { email, role } = await req.json()

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required.' }, { status: 400 })
    }

    const validRoles = ['superadmin', 'support_senior', 'support_junior']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role.' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 1. Look up the user in profiles by email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ 
        error: `No existing account found for "${email}". The user must have a registered account first.` 
      }, { status: 404 })
    }

    // 2. Check if they are already in internal_staff
    const { data: existing } = await supabase
      .from('internal_staff')
      .select('id, role')
      .eq('auth_user_id', profile.id)
      .single()

    if (existing) {
      // Update role if different
      if (existing.role !== role) {
        await supabase
          .from('internal_staff')
          .update({ role, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
        
        return NextResponse.json({ message: `${email} role updated to ${role}.` })
      }
      return NextResponse.json({ message: `${email} is already platform staff with role "${role}".` })
    }

    // 3. Insert into internal_staff
    const { error: insertError } = await supabase
      .from('internal_staff')
      .insert({
        auth_user_id: profile.id,
        email: profile.email,
        role,
      })

    if (insertError) {
      return NextResponse.json({ error: 'Failed to promote user: ' + insertError.message }, { status: 500 })
    }

    return NextResponse.json({ message: `${email} has been promoted to ${role}. They can now access the backoffice.` })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }
}

'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { getStaffSession, requireSuperadmin } from '@/lib/backoffice/auth'
import { revalidatePath } from 'next/cache'
import { sendDirectEmail } from '@/lib/notifications/actions'

export async function inviteInternalStaff(email: string, role: string, mode: 'link' | 'email') {
  try {
    await getStaffSession()
    await requireSuperadmin()

    const supabase = createAdminClient()

    // Check if the user already exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    const linkType = profile ? 'magiclink' : 'invite'

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const authClient = await createClient()
    const { data, error } = await authClient.rpc('create_internal_invitation', {
      p_email: email,
      p_role: role
    })

    if (error) throw error

    const payload = data as {
      token?: string
      expires_at?: string
    } | null

    if (!payload?.token || !payload?.expires_at) {
      throw new Error('Could not generate invitation link')
    }

    const inviteUrl = `${baseUrl}/backoffice/invite?token=${encodeURIComponent(payload.token)}&email=${encodeURIComponent(email)}`

    if (mode === 'email') {
      await sendDirectEmail(email, {
        subject: 'You have been invited to join the Back Office',
        title: 'Back Office Invitation',
        message: `You have been invited to join the platform as a ${role}. Click the link below to accept your invitation and set up your account.`,
        actionUrl: inviteUrl
      })
    }

    revalidatePath('/backoffice/staff')
    
    return { ok: true, url: inviteUrl, emailSent: mode === 'email', inviteeEmail: email }
  } catch (err: any) {
    return { ok: false, error: err.message || 'Failed to invite staff' }
  }
}

export async function updateStaffRole(id: string, newRole: string) {
  try {
    await requireSuperadmin()
    const supabase = createAdminClient()
    
    const { error } = await supabase
      .from('internal_staff')
      .update({ role: newRole })
      .eq('id', id)
      
    if (error) throw error
    revalidatePath('/backoffice/staff')
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err.message || 'Failed to update role' }
  }
}

export async function deleteStaffMember(id: string) {
  try {
    await requireSuperadmin()
    const supabase = createAdminClient()
    
    // Get the auth_user_id first
    const { data: staffData } = await supabase
      .from('internal_staff')
      .select('auth_user_id')
      .eq('id', id)
      .single()
      
    if (staffData?.auth_user_id) {
      // Delete the user from auth entirely
      await supabase.auth.admin.deleteUser(staffData.auth_user_id)
    }

    // internal_staff row should be deleted via cascade or directly
    const { error } = await supabase
      .from('internal_staff')
      .delete()
      .eq('id', id)

    if (error) throw error
    
    revalidatePath('/backoffice/staff')
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err.message || 'Failed to delete staff member' }
  }
}

export async function createStaffAccount(email: string, password: string) {
  try {
    const supabase = createAdminClient()
    
    // Check if the user already exists in auth.users
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (!existingUser) {
      // Create user with email pre-confirmed so Supabase doesn't send the default confirmation email
      const { error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })
      if (error) throw error
    } else {
      // If they exist, maybe just update their password so they can log in?
      // Or we can just let it fail and tell them to login. Let's just return success 
      // if we're simulating a successful signup or let it throw if needed.
      const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
        password: password
      })
      if (error) throw error
    }

    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err.message || 'Failed to create staff account' }
  }
}

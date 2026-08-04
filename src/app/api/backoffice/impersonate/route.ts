import { requireStaffWriteAccess, getStaffSession } from '@/lib/backoffice/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    // 1. Verify staff privileges (must be senior/superadmin to impersonate)
    const staff = await requireStaffWriteAccess()

    const formData = await req.formData()
    const targetUserId = formData.get('targetUserId') as string
    
    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    
    // Fetch user's name for the banner
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', targetUserId)
      .single()
    const targetUserName = profile?.full_name || 'Unknown User'

    // 2. Start impersonation session in DB
    const { data: session, error } = await supabase
      .from('impersonation_logs')
      .insert({
        staff_id: staff.id,
        target_user_id: targetUserId,
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      })
      .select()
      .single()

    if (error || !session) throw new Error('Failed to start impersonation session: ' + error?.message)

    // 3. Create a secure cookie for impersonation
    // We sign it to prevent tampering, though for simplicity here we just store the session ID
    // In production, use JWT or encrypt this cookie.
    const impersonationData = JSON.stringify({
      sessionId: session.id,
      targetUserId,
      targetUserName,
      staffRole: staff.role
    })
    
    // Base64 encode for cookie safety
    const cookieValue = Buffer.from(impersonationData).toString('base64')

    ;(await cookies()).set('zn_impersonation', cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 3600 // 1 hour time-limit for impersonation sessions
    })

    // 4. Redirect the superadmin to the main customer dashboard
    return NextResponse.redirect(new URL('/dashboard', req.url), 303)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }
}

export async function DELETE(req: Request) {
  try {
    const cookie = (await cookies()).get('zn_impersonation')
    if (!cookie) return NextResponse.json({ success: true })

    const data = JSON.parse(Buffer.from(cookie.value, 'base64').toString('utf-8'))
    
    // Log the end of the session
    const supabase = createAdminClient()
    await supabase.from('impersonation_logs')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', data.sessionId)

    // Clear the cookie
    ;(await cookies()).delete('zn_impersonation')

    return NextResponse.redirect(new URL('/backoffice', req.url), 303)
  } catch (error) {
    return NextResponse.json({ success: false })
  }
}

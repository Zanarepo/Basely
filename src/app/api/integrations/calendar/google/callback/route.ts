import { NextResponse } from 'next/server'
import { getGoogleOAuthClient } from '@/lib/integrations/calendar-logic'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  const state = url.searchParams.get('state') // This will be the projectId
  
  const returnUrl = state ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/projects/${state}` : `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`

  if (error) {
    console.error('Google OAuth error:', error)
    return NextResponse.redirect(`${returnUrl}?error=calendar_connection_failed`)
  }

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/integrations?error=calendar_connection_failed`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`)
  }

  try {
    const oauth2Client = getGoogleOAuthClient()
    const { tokens } = await oauth2Client.getToken(code)

    if (tokens.access_token) {
      // Upsert the connection for this user
      const { error: upsertError } = await supabase
        .from('calendar_connections')
        .upsert({
          user_id: user.id,
          provider: 'google',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null, // Might be null if not the first consent
          expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, provider' })

      if (upsertError) {
        console.error('Failed to save connection:', upsertError)
        throw new Error('Database Error')
      }
    }

    return NextResponse.redirect(`${returnUrl}?success=true`)
  } catch (err) {
    console.error('OAuth Callback Error:', err)
    return NextResponse.redirect(`${returnUrl}?error=calendar_connection_failed`)
  }
}

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  const oauthError =
    searchParams.get('error_description') ?? searchParams.get('error')
  if (oauthError) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(oauthError)}`
    )
  }

  if (code) {
    const redirectUrl = `${origin}${next.startsWith('/') ? next : '/dashboard'}`
    const supabaseResponse = NextResponse.redirect(redirectUrl)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.user?.email) {
      // Check if SSO is enforced for this user's organization
      const { data: ssoStatus } = await (supabase.rpc as any)('check_sso_status', { p_email: data.user.email })

      const status = ssoStatus as { enforced?: boolean; is_break_glass?: boolean; idp_url?: string } | null

      // If SSO is enforced, check if the OAuth provider matches the configured IdP (e.g. Google)
      const isGoogleSso = status?.idp_url?.includes('google')

      if (status?.enforced && !status?.is_break_glass && !isGoogleSso) {
        // Sign out immediately and block login if SSO is enforced and user is not break-glass admin and provider doesn't match
        await supabase.auth.signOut()
        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent(
            'SSO is enforced for your organization. You cannot sign in via unapproved social login.'
          )}`
        )
      }

      return supabaseResponse
    }

    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error?.message ?? 'Could not authenticate user')}`
    )
  }

  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent('Could not authenticate user')}`
  )
}

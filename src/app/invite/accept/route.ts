import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { ACTIVE_ORG_COOKIE } from '@/lib/workspace/constants'

function inviteErrorUrl(request: NextRequest, message: string) {
  return new URL(`/invite/error?message=${encodeURIComponent(message)}`, request.url)
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')?.trim()
  const next = request.nextUrl.searchParams.get('next')?.trim()

  if (!token) {
    return NextResponse.redirect(
      inviteErrorUrl(request, 'This invitation link is missing a token.')
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    let returnPath = `/invite?token=${encodeURIComponent(token)}`
    if (next) {
      returnPath += `&next=${encodeURIComponent(next)}`
    }
    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent(returnPath)}`, request.url)
    )
  }

  const { data: organizationId, error } = await supabase.rpc(
    'accept_invitation',
    { p_token: token }
  )

  if (error || !organizationId) {
    return NextResponse.redirect(
      inviteErrorUrl(
        request,
        error?.message ??
          'This invitation link is invalid, expired, or has already been used.'
      )
    )
  }

  let redirectTarget = '/dashboard'
  if (next && next.startsWith('/')) {
    redirectTarget = next
  }

  const response = NextResponse.redirect(new URL(redirectTarget, request.url))
  response.cookies.set(ACTIVE_ORG_COOKIE, organizationId as string, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })

  return response
}
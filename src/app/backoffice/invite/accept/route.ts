import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'

function inviteErrorUrl(request: NextRequest, message: string) {
  return new URL(`/invite/error?message=${encodeURIComponent(message)}`, request.url)
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')?.trim()
  const email = request.nextUrl.searchParams.get('email')?.trim()

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
    let returnPath = `/backoffice/invite/accept?token=${encodeURIComponent(token)}`
    if (email) returnPath += `&email=${encodeURIComponent(email)}`
    
    const signupUrl = new URL(`/backoffice/signup?next=${encodeURIComponent(returnPath)}`, request.url)
    if (email) signupUrl.searchParams.set('email', email)
    
    return NextResponse.redirect(signupUrl)
  }

  const { data: success, error } = await supabase.rpc(
    'accept_internal_invitation',
    { p_token: token }
  )

  if (error || !success) {
    return NextResponse.redirect(
      inviteErrorUrl(
        request,
        error?.message ??
          'This invitation link is invalid, expired, or has already been used.'
      )
    )
  }

  return NextResponse.redirect(new URL('/backoffice?invite_accepted=true', request.url))
}

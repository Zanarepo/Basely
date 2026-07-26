import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone()
  const pathname = url.pathname.replace(/\/+$/, '') || '/'

  // Let the auth callback and public API/webhook routes run without browser session/cookie proxying
  if (
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/api/v1') ||
    pathname.startsWith('/api/internal')
  ) {
    return NextResponse.next()
  }

  const { supabase, user, response } = await updateSession(request)

  const isDashboardRoute = pathname.startsWith('/dashboard')
  const isOnboardingRoute = pathname.startsWith('/onboarding')

  // 1. If user is not logged in
  if (!user) {
    if (isDashboardRoute || isOnboardingRoute) {
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return response
  }

  // 2. Logged-in users may still visit /login and /register (e.g. to sign out
  // or switch accounts). Those pages handle the active-session UI client-side.

  // 3. If user is logged in, check organization membership
  if (isDashboardRoute || isOnboardingRoute) {
    const { data: memberships } = await supabase
      .from('organization_members')
      .select('organization_id, is_active')
      .eq('user_id', user.id)

    const hasActiveWorkspace = memberships?.some((m) => m.is_active)

    if (!hasActiveWorkspace && isDashboardRoute) {
      if (!memberships || memberships.length === 0) {
        url.pathname = '/onboarding'
        return NextResponse.redirect(url)
      }
      // If user has only inactive/revoked workspaces, let them land on /dashboard
      // so the dashboard page can render the "Access Revoked" screen.
    }

    if (hasActiveWorkspace && isOnboardingRoute) {
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/v1 (stateless external REST API)
     * - api/internal (internal webhook/generation API)
     * - images/assets (static files)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/v1|api/internal|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

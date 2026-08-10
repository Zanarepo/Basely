import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { SignOutButton } from '@/components/SignOutButton'
import { CreateOrganizationForm } from '@/components/CreateOrganizationForm'
import { AuthPageShell } from '@/components/AuthPageShell'
import { Building2, Mail, LogIn } from 'lucide-react'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if the user is already a member of any org (as owner, admin, or invited member)
  const { data: memberships } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)

  if (memberships && memberships.length > 0) {
    redirect('/dashboard')
  }

  // Also check with admin client in case RLS is blocking the read
  const { createAdminClient } = await import('@/utils/supabase/admin')
  const adminSupabase = createAdminClient()
  const { data: adminMemberships } = await adminSupabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)

  const hasExistingAccess = adminMemberships && adminMemberships.length > 0

  if (hasExistingAccess) {
    redirect('/dashboard')
  }

  return (
    <AuthPageShell>
      <div className="w-full">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-app-fg mb-2">
            Welcome aboard
          </h2>
          <p className="text-sm text-app-muted font-medium">
            Create a workspace or join one with an invitation.
          </p>
        </div>

        <div className="mb-6 pb-6 border-b border-app-border flex items-center justify-between">
          <p className="text-app-muted text-sm flex items-center gap-2">
            <Mail className="h-4 w-4 text-app-subtle" />
            Signed in as <span className="text-app-fg font-medium">{user.email}</span>
          </p>
          <a
            href="/auth/signout"
            className="text-xs text-violet-500 dark:text-violet-400 hover:text-violet-600 dark:hover:text-violet-300 font-semibold transition-colors"
          >
            Sign out
          </a>
        </div>

        <CreateOrganizationForm />

        <div className="relative my-8 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-app-border" />
          </div>
          <span className="relative px-3 bg-app-bg lg:bg-transparent text-xs font-semibold text-app-subtle uppercase tracking-wider backdrop-blur-sm">
            Or
          </span>
        </div>

        <p className="text-sm text-app-muted text-center">
          Have an invite link? Open it in your browser to join an existing organization.
        </p>

      </div>
    </AuthPageShell>
  )
}


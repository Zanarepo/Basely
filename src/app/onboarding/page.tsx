import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { SignOutButton } from '@/components/SignOutButton'
import { CreateOrganizationForm } from '@/components/CreateOrganizationForm'
import { AuthPageShell } from '@/components/AuthPageShell'
import { Building2, Mail } from 'lucide-react'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (membership) {
    redirect('/dashboard')
  }

  return (
    <AuthPageShell>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-linear-to-tr from-violet-600 to-indigo-600 shadow-[0_0_30px_-5px_rgba(99,102,241,0.5)] mb-4">
          <Building2 className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-app-fg">Welcome aboard</h1>
        <p className="mt-2 text-sm text-app-muted">
          Create a workspace or join one with an invitation.
        </p>
      </div>

      <div className="auth-card">
        <p className="text-app-muted text-sm mb-6 flex items-center gap-2">
          <Mail className="h-4 w-4 text-app-subtle" />
          Signed in as{' '}
          <span className="text-app-fg font-medium">{user.email}</span>
        </p>

        <CreateOrganizationForm />

        <div className="relative my-8 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-app-border" />
          </div>
          <span className="relative px-3 bg-app-surface text-xs font-semibold text-app-subtle uppercase tracking-wider">
            Or
          </span>
        </div>

        <p className="text-sm text-app-muted text-center">
          Have an invite link? Open it in your browser to join an existing
          organization.
        </p>

        <div className="mt-6 pt-6 border-t border-app-border flex flex-col items-center gap-3">
          <p className="text-xs text-app-subtle text-center">
            Wrong account?{' '}
            <a
              href="/auth/signout"
              className="text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 font-semibold"
            >
              Sign out
            </a>
          </p>
          <SignOutButton />
        </div>
      </div>
    </AuthPageShell>
  )
}

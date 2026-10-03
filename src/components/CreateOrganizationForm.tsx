'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { createOrganizationSchema } from '@/lib/validations/organization'
import { Building2, ShieldAlert, ArrowRight, Loader2, LogIn } from 'lucide-react'
import { seedWelcomeProject } from '@/lib/workspace/actions'


interface CreateOrganizationFormProps {
  onSuccess?: (organizationId: string) => void
}

export function CreateOrganizationForm({ onSuccess }: CreateOrganizationFormProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [hasExistingMemberships, setHasExistingMemberships] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setHasExistingMemberships(false)

    // Validate only name
    if (!name.trim()) {
      setErrorMsg('Workspace name is required')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()

      // Check workspace ownership limit for Free tier accounts
      const { checkWorkspaceCreationLimitAction } = await import('@/lib/workspace/actions')
      const limitCheck = await checkWorkspaceCreationLimitAction()
      if (!limitCheck.allowed) {
        // Check if user already has memberships in other orgs they can access
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: memberships } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .limit(1)
          if (memberships && memberships.length > 0) {
            setHasExistingMemberships(true)
          }
        }
        setErrorMsg(limitCheck.reason || 'Workspace creation limit reached.')
        setLoading(false)
        return
      }

      // Pre-seed profile to satisfy foreign key constraint on organizations.owner_id
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || '',
          }, { onConflict: 'id' })
      }

      const { data, error } = await supabase.rpc('create_organization_with_admin', {
        p_name: name.trim(),
        p_team_size: null,
      })

      if (error) {
        setErrorMsg(error.message)
        setLoading(false)
        return
      }

      if (data) {
        // Clear onboarding flags so onboarding modal triggers for the new account/workspace
        if (typeof window !== 'undefined') {
          localStorage.removeItem('zanarepo_onboarding_completed')
          localStorage.removeItem('zanarepo_user_persona')
        }

        // Seed the welcome project automatically to avoid empty states
        const seedResult = await seedWelcomeProject(data, name.trim())

        if (onSuccess) {
          onSuccess(data)
        } else {
          router.refresh()
          if (seedResult.ok && seedResult.projectId) {
            // Drop them straight into the new welcome project (Time-to-Value)
            router.push(`/dashboard/projects/${seedResult.projectId}`)
          } else {
            router.push('/dashboard')
          }
        }
      }
    } catch {
      setErrorMsg('Could not create organization. Please try again.')
      setLoading(false)
    }
  }


  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-app-fg mb-1">
          Create your workspace
        </h2>
        <p className="text-sm text-app-muted">
          Give your team a home to manage projects and tasks.
        </p>
      </div>

      {errorMsg && (
        <div className="flex flex-col gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-sm">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          {hasExistingMemberships && (
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="h-4 w-4" />
              Go to your existing workspaces
            </button>
          )}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="orgName" className="auth-label">
          Organization name
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-app-subtle group-focus-within:text-indigo-500 transition-colors">
            <Building2 className="h-5 w-5" />
          </div>
          <input
            id="orgName"
            type="text"
            required
            placeholder="e.g. Acme Corp"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            className="auth-input"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="relative w-full py-3.5 px-4 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/40 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Setting up your workspace...</span>
          </>
        ) : (
          <>
            <span>Get Started</span>
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
    </form>
  )
}



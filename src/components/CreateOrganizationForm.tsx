'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { createOrganizationSchema } from '@/lib/validations/organization'
import { Building2, Users, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react'

const MAX_OWNED_WORKSPACES = 2

interface CreateOrganizationFormProps {
  onSuccess?: (organizationId: string) => void
}

export function CreateOrganizationForm({ onSuccess }: CreateOrganizationFormProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [teamSize, setTeamSize] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    const parsed = createOrganizationSchema.safeParse({ name, teamSize })
    if (!parsed.success) {
      setErrorMsg(parsed.error.issues[0]?.message ?? 'Invalid input')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()

      // Check workspace ownership limit
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { count } = await supabase
          .from('organizations')
          .select('id', { count: 'exact', head: true })
          .eq('owner_id', user.id)

        if ((count ?? 0) >= MAX_OWNED_WORKSPACES) {
          setErrorMsg(`You can own a maximum of ${MAX_OWNED_WORKSPACES} workspaces.`)
          return
        }
      }

      const { data, error } = await supabase.rpc('create_organization_with_admin', {
        p_name: parsed.data.name,
        p_team_size: parsed.data.teamSize ?? null,
      })

      if (error) {
        setErrorMsg(error.message)
        return
      }

      if (data) {
        if (onSuccess) {
          onSuccess(data)
        } else {
          router.refresh()
          router.push('/dashboard')
        }
      }
    } catch {
      setErrorMsg('Could not create organization. Please try again.')
    } finally {
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
          Set up an organization to start managing projects. You&apos;ll be
          assigned as Admin.
        </p>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-sm">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
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
            placeholder="Acme Project Controls Ltd"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            className="auth-input"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="teamSize" className="auth-label">
          Team size{' '}
          <span className="text-app-subtle normal-case">(optional)</span>
        </label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-app-subtle group-focus-within:text-indigo-500 transition-colors">
            <Users className="h-5 w-5" />
          </div>
          <input
            id="teamSize"
            type="number"
            min={1}
            placeholder="e.g. 25"
            value={teamSize}
            onChange={(e) => setTeamSize(e.target.value)}
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
            <span>Creating workspace...</span>
          </>
        ) : (
          <>
            <span>Create organization</span>
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
    </form>
  )
}

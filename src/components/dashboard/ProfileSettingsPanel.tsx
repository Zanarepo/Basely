'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save, User, Mail, ShieldCheck } from 'lucide-react'
import { updateProfileName } from '@/lib/workspace/member-actions'

type Props = {
  currentName: string
  email: string
}

export function ProfileSettingsPanel({ currentName, email }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(currentName)
  const [message, setMessage] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSave = () => {
    if (!name.trim() || name.trim() === currentName) return
    setMessage(null)
    setIsSuccess(false)
    startTransition(async () => {
      const result = await updateProfileName(name.trim())
      if (result.ok) {
        setMessage('Profile updated successfully.')
        setIsSuccess(true)
        router.refresh()
      } else {
        setMessage(result.error)
        setIsSuccess(false)
      }
    })
  }

  return (
    <section className="backdrop-blur-md bg-app-surface border border-app-border rounded-3xl p-6 space-y-6">
      <div className="flex items-start gap-3 mb-2">
        <div className="p-2 rounded-xl bg-indigo-500/15">
          <User className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="font-semibold text-app-fg">Personal Information</h2>
          <p className="text-sm text-app-muted">
            Update your display name. This is shown across all workspaces you belong to.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Name field */}
        <div>
          <label htmlFor="profileName" className="block text-sm font-medium text-app-fg mb-1.5">
            Display Name
          </label>
          <input
            id="profileName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isPending}
            placeholder="Your full name"
            className="w-full px-3 py-2.5 bg-app-bg border border-app-border rounded-xl text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
            }}
          />
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-app-fg mb-1.5">
            Email Address
          </label>
          <div className="flex items-center gap-2 px-3 py-2.5 bg-app-muted-surface border border-app-border rounded-xl">
            <Mail className="h-4 w-4 text-app-muted shrink-0" />
            <span className="text-sm text-app-muted">{email}</span>
          </div>
          <p className="mt-1 text-xs text-app-subtle">Email cannot be changed from here.</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-app-border">
        <div className="flex items-center gap-2 text-xs text-app-subtle">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          <span className={message ? (isSuccess ? 'text-emerald-500' : 'text-rose-500') : ''}>
            {message ?? 'Your name is visible to all workspace members.'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || !name.trim() || name.trim() === currentName}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </button>
      </div>
    </section>
  )
}

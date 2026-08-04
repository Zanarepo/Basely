'use client'

import { useState, useTransition } from 'react'
import {
  UserPlus,
  Copy,
  Check,
  Loader2,
  Link2,
  Mail,
} from 'lucide-react'
import { inviteInternalStaff } from '@/lib/backoffice/staff-actions'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'
import { ToastContainer, type ToastMessage } from '@/components/dashboard/Toast'

const INTERNAL_ROLES = [
  { value: 'superadmin', label: 'Super Admin', description: 'Full back-office access' },
  { value: 'account_manager', label: 'Account Manager', description: 'Scoped view of assigned accounts' },
  { value: 'support_admin', label: 'Support Admin', description: 'View & read-only impersonation' },
  { value: 'support_junior', label: 'Support Junior', description: 'Limited support access' }
]

export function InviteStaffPanel() {
  const [mode, setMode] = useState<'link' | 'email'>('link')
  const [role, setRole] = useState<string>('account_manager')
  const [inviteeEmail, setInviteeEmail] = useState('')
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToasts((prev) => [...prev, { id: Date.now().toString(), type, message }])
  }

  const handleGenerate = () => {
    setCopied(false)
    startTransition(async () => {
      if (mode === 'email' && !inviteeEmail.trim()) {
        showToast('error', 'Email is required for email invites')
        return
      }
      
      const emailToUse = inviteeEmail.trim() || `placeholder-${Date.now()}@example.com` // Subabase generateLink requires an email
      
      const result = await inviteInternalStaff(mode === 'email' ? inviteeEmail.trim() : emailToUse, role, mode)
      if (!result.ok) {
        setInviteUrl(null)
        showToast('error', result.error || 'Failed to generate invite')
        return
      }
      setInviteUrl(result.url || null)

      if (mode === 'email') {
        showToast(
          result.emailSent ? 'success' : 'error',
          result.emailSent
            ? `Invitation sent to ${result.inviteeEmail}`
            : 'Email was not sent. Copy and send the link manually.'
        )
      } else {
        showToast('success', 'Invite link generated successfully.')
      }
    })
  }

  const handleCopy = async () => {
    if (!inviteUrl) return
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      showToast('success', 'Link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast('error', 'Could not copy to clipboard')
    }
  }

  return (
    <>
    <div className="space-y-6 bg-app-card rounded-2xl border border-app-border p-6 shadow-sm max-w-lg w-full">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-indigo-500/15">
          <UserPlus className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="font-semibold text-app-fg">Invite Members</h2>
          <p className="text-sm text-app-muted">
            Generate a link or send an email to invite people to <span className="text-app-fg font-medium">Sellytics</span> Admin
          </p>
        </div>
      </div>

      {/* Invite method toggle */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-app-muted-surface border border-app-border p-1">
        <button
          type="button"
          onClick={() => setMode('link')}
          disabled={isPending}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 ${
            mode === 'link'
              ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/25 shadow-sm'
              : 'text-slate-600 dark:text-app-muted hover:text-app-fg border border-transparent'
          }`}
        >
          <Link2 className="h-4 w-4" />
          Invite Link
        </button>
        <button
          type="button"
          onClick={() => setMode('email')}
          disabled={isPending}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 ${
            mode === 'email'
              ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/25 shadow-sm'
              : 'text-slate-600 dark:text-app-muted hover:text-app-fg border border-transparent'
          }`}
        >
          <Mail className="h-4 w-4" />
          Email Invite
        </button>
      </div>

      {/* Email input */}
      {mode === 'email' && (
        <div className="space-y-2">
          <label htmlFor="invitePanelEmail" className="block text-sm font-medium text-app-fg">
            Invitee email
          </label>
          <input
            id="invitePanelEmail"
            type="email"
            value={inviteeEmail}
            onChange={(e) => setInviteeEmail(e.target.value)}
            disabled={isPending}
            placeholder="name@company.com"
            className="w-full px-4 py-2.5 bg-app-bg border border-app-border rounded-xl text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
          />
        </div>
      )}

      {/* Role selector */}
      <div className="space-y-2">
        <label htmlFor="invitePanelRole" className="block text-sm font-medium text-app-fg">
          Role for new members
        </label>
        <EnterpriseSelect
          value={role}
          onChange={(val) => setRole(val as string)}
          disabled={isPending}
          options={INTERNAL_ROLES.map((r) => ({
            value: r.value,
            label: r.label,
            description: r.description
          }))}
        />
      </div>

      {/* Generated invite URL */}
      {inviteUrl && (
        <div className="space-y-3 p-4 rounded-2xl bg-app-muted-surface border border-app-border">
          <label htmlFor="invitePanelUrl" className="block text-sm font-medium text-app-fg">
            Copyable invite URL
          </label>
          <div className="flex gap-2">
            <input
              id="invitePanelUrl"
              type="text"
              readOnly
              value={inviteUrl}
              className="flex-1 px-4 py-2.5 bg-app-bg border border-app-border rounded-xl text-xs font-mono text-app-fg focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopy}
              title="Copy link"
              className="shrink-0 px-4 py-2.5 rounded-xl border border-app-border bg-app-surface hover:bg-app-hover transition-colors cursor-pointer"
            >
              {copied ? (
                <Check className="h-5 w-5 text-emerald-500" />
              ) : (
                <Copy className="h-5 w-5 text-app-muted" />
              )}
            </button>
          </div>
          <p className="text-xs text-app-subtle">
            Single-use link
          </p>
        </div>
      )}

      {/* Generate button */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isPending || (mode === 'email' && !inviteeEmail.trim())}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {mode === 'email' ? 'Sending invite…' : 'Generating link…'}
          </>
        ) : (
          <>
            {mode === 'email' ? <Mail className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
            {mode === 'email' ? 'Send email invite' : 'Generate invite link'}
          </>
        )}
      </button>
    </div>
    <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(t => t.filter(x => x.id !== id))} />
    </>
  )
}


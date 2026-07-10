'use client'

import { useState, useTransition } from 'react'
import {
  X,
  UserPlus,
  Copy,
  Check,
  Loader2,
  ShieldAlert,
  Link2,
  Mail,
} from 'lucide-react'
import { useWorkspace } from './WorkspaceContext'
import { generateInviteLink } from '@/lib/invitations/actions'
import { INVITE_ROLES, type InviteRole } from '@/lib/invitations/constants'

type InviteTeamModalProps = {
  open: boolean
  onClose: () => void
}

type InviteMode = 'link' | 'email'

export function InviteTeamModal({ open, onClose }: InviteTeamModalProps) {
  const { activeWorkspace } = useWorkspace()
  const [mode, setMode] = useState<InviteMode>('link')
  const [role, setRole] = useState<InviteRole>('Team Member')
  const [inviteeEmail, setInviteeEmail] = useState('')
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (!open) return null

  const handleGenerate = () => {
    setErrorMsg(null)
    setStatusMsg(null)
    setCopied(false)
    startTransition(async () => {
      const result = await generateInviteLink(
        activeWorkspace.id,
        role,
        mode === 'email' ? inviteeEmail : undefined
      )
      if (!result.ok) {
        setInviteUrl(null)
        setExpiresAt(null)
        setErrorMsg(result.error)
        return
      }
      setInviteUrl(result.url)
      setExpiresAt(result.expiresAt)

      if (mode === 'email') {
        setStatusMsg(
          result.emailSent
            ? `Invitation sent to ${result.inviteeEmail}`
            : (result.warning ?? 'Email was not sent. Copy and send the link manually.')
        )
      }
    })
  }

  const handleCopy = async () => {
    if (!inviteUrl) return
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setErrorMsg('Could not copy to clipboard')
    }
  }

  const handleClose = () => {
    setMode('link')
    setRole('Team Member')
    setInviteeEmail('')
    setInviteUrl(null)
    setExpiresAt(null)
    setErrorMsg(null)
    setStatusMsg(null)
    setCopied(false)
    onClose()
  }

  const expiryLabel = expiresAt
    ? new Date(expiresAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-lg auth-card shadow-2xl animate-fade-in">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20">
              <UserPlus className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-app-fg">Invite team</h2>
              <p className="text-sm text-app-muted">
                Share a link to join{' '}
                <span className="text-app-fg font-medium">
                  {activeWorkspace.name}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-app-subtle hover:text-app-fg hover:bg-app-hover transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-3 p-4 mb-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-sm">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {statusMsg && (
          <div className="flex items-center gap-3 p-4 mb-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 text-sm">
            <Mail className="h-5 w-5 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mb-5 rounded-2xl bg-app-muted-surface border border-app-border p-1">
          <button
            type="button"
            onClick={() => setMode('link')}
            disabled={isPending}
            className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 ${
              mode === 'link'
                ? 'bg-indigo-500/20 text-indigo-500 dark:text-indigo-300'
                : 'text-app-muted hover:text-app-fg'
            }`}
          >
            <Link2 className="h-4 w-4" />
            Link
          </button>
          <button
            type="button"
            onClick={() => setMode('email')}
            disabled={isPending}
            className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 ${
              mode === 'email'
                ? 'bg-indigo-500/20 text-indigo-500 dark:text-indigo-300'
                : 'text-app-muted hover:text-app-fg'
            }`}
          >
            <Mail className="h-4 w-4" />
            Email
          </button>
        </div>

        {mode === 'email' && (
          <div className="space-y-2 mb-5">
            <label htmlFor="inviteeEmail" className="auth-label">
              Invitee email
            </label>
            <input
              id="inviteeEmail"
              type="email"
              value={inviteeEmail}
              onChange={(e) => setInviteeEmail(e.target.value)}
              disabled={isPending}
              placeholder="name@company.com"
              className="auth-input pl-4"
            />
          </div>
        )}

        <div className="space-y-2 mb-5">
          <label htmlFor="inviteRole" className="auth-label">
            Role for new members
          </label>
          <select
            id="inviteRole"
            value={role}
            onChange={(e) => setRole(e.target.value as InviteRole)}
            disabled={isPending}
            className="auth-input pl-4 cursor-pointer"
          >
            {INVITE_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isPending || (mode === 'email' && !inviteeEmail.trim())}
          className="relative w-full py-3 px-4 bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{mode === 'email' ? 'Sending invite...' : 'Generating link...'}</span>
            </>
          ) : (
            <>
              {mode === 'email' ? (
                <Mail className="h-5 w-5" />
              ) : (
                <Link2 className="h-5 w-5" />
              )}
              <span>{mode === 'email' ? 'Send email invite' : 'Generate invite link'}</span>
            </>
          )}
        </button>

        {inviteUrl && (
          <div className="mt-6 space-y-3">
            <label htmlFor="inviteUrl" className="auth-label">
              Copyable invite URL
            </label>
            <div className="flex gap-2">
              <input
                id="inviteUrl"
                type="text"
                readOnly
                value={inviteUrl}
                className="auth-input pl-4 text-xs font-mono"
              />
              <button
                type="button"
                onClick={handleCopy}
                title="Copy link"
                className="shrink-0 px-4 rounded-2xl bg-app-muted-surface border border-app-border hover:border-indigo-500/40 hover:bg-app-hover transition-all cursor-pointer"
              >
                {copied ? (
                  <Check className="h-5 w-5 text-emerald-500" />
                ) : (
                  <Copy className="h-5 w-5 text-app-muted" />
                )}
              </button>
            </div>
            {expiryLabel && (
              <p className="text-xs text-app-subtle">
                Expires {expiryLabel} - Single-use link
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
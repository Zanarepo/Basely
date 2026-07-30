'use client'

import { useState, useTransition } from 'react'
import {
  UserPlus,
  Copy,
  Check,
  Loader2,
  ShieldAlert,
  Link2,
  Mail,
} from 'lucide-react'
import { useWorkspace } from '../WorkspaceContext'
import { generateInviteLink } from '@/lib/invitations/actions'
import { INVITE_ROLES, type InviteRole } from '@/lib/invitations/constants'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'

export function InviteTeamPanel() {
  const { activeWorkspace } = useWorkspace()
  const [mode, setMode] = useState<'link' | 'email'>('link')
  const [role, setRole] = useState<InviteRole>('Team Member')
  const [inviteeEmail, setInviteeEmail] = useState('')
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

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

  const expiryLabel = expiresAt
    ? new Date(expiresAt).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-indigo-500/15">
          <UserPlus className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="font-semibold text-app-fg">Invite Members</h2>
          <p className="text-sm text-app-muted">
            Generate a link or send an email to invite people to{' '}
            <span className="text-app-fg font-medium">{activeWorkspace.name}</span>
          </p>
        </div>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-sm">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {statusMsg && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm">
          <Mail className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{statusMsg}</span>
        </div>
      )}

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
          onChange={(val) => setRole(val as InviteRole)}
          disabled={isPending}
          options={INVITE_ROLES.map((r) => ({
            value: r,
            label: r,
            description: r === 'PM' ? 'Project & team management access' : r === 'Viewer' ? 'Read-only viewing access' : 'Standard member team collaboration access'
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
          {expiryLabel && (
            <p className="text-xs text-app-subtle">
              Expires {expiryLabel} · Single-use link
            </p>
          )}
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
  )
}

'use client'

import React, { useState } from 'react'
import { createSignoffInvitation } from '@/lib/projects/signoff-actions'
import { X, UserPlus, Link2, Copy, Check, Loader2, Mail, User } from 'lucide-react'

export interface InviteSignerModalProps {
  projectId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void
}

export function InviteSignerModal({
  projectId,
  isOpen,
  onClose,
  onSuccess,
  onShowToast
}: InviteSignerModalProps) {
  const [signerName, setSignerName] = useState('')
  const [signerEmail, setSignerEmail] = useState('')
  const [signerType, setSignerType] = useState<'internal_user' | 'external_stakeholder'>('external_stakeholder')
  const [submitting, setSubmitting] = useState(false)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signerName.trim() || !signerEmail.trim()) {
      onShowToast?.('error', 'Please complete both signer name and email.')
      return
    }

    setSubmitting(true)
    try {
      const res = await createSignoffInvitation(projectId, signerName, signerEmail, signerType)
      if (!res.ok) {
        onShowToast?.('error', res.error || 'Failed to create acceptance invitation.')
      } else {
        onShowToast?.('success', 'Sign-off invitation created successfully!')
        if (res.inviteUrl) {
          setGeneratedLink(res.inviteUrl)
        } else {
          onSuccess()
          handleResetAndClose()
        }
      }
    } catch (err) {
      console.error(err)
      onShowToast?.('error', 'Unexpected network failure.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopyLink = () => {
    if (!generatedLink) return
    navigator.clipboard.writeText(generatedLink)
    setCopied(true)
    onShowToast?.('info', 'Secure client sign-off URL copied to clipboard!')
    setTimeout(() => setCopied(false), 2500)
  }

  const handleResetAndClose = () => {
    setSignerName('')
    setSignerEmail('')
    setSignerType('external_stakeholder')
    setGeneratedLink(null)
    setCopied(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-app-surface border border-app-border rounded-2xl p-5 sm:p-7 shadow-2xl space-y-5 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-app-border pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <UserPlus className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-app-fg tracking-tight">
              Request Project Closure Sign-off
            </h3>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 text-app-muted hover:text-app-fg rounded-lg hover:bg-app-hover transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {generatedLink ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs sm:text-sm text-emerald-300">
              <strong>External URL Ready!</strong> Because this stakeholder is external, they do not require an account. Share the secure URL below for instant 1-click review and acceptance.
            </div>
            <div className="p-3 bg-app-bg border border-app-border rounded-xl flex items-center gap-2">
              <Link2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <input
                type="text"
                value={generatedLink}
                readOnly
                className="w-full bg-transparent text-xs text-app-fg font-mono focus:outline-none truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => { onSuccess(); handleResetAndClose(); }}
              className="w-full py-3 rounded-xl bg-app-bg hover:bg-app-hover text-app-fg border border-app-border font-bold text-xs sm:text-sm transition-all cursor-pointer"
            >
              Done & View Board
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-app-fg uppercase tracking-wider block">Signer Role & Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSignerType('external_stakeholder')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    signerType === 'external_stakeholder'
                      ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-sm'
                      : 'bg-app-bg border-app-border text-app-muted hover:text-app-fg'
                  }`}
                >
                  <span>External Client</span>
                  <span className="text-[10px] text-app-muted font-normal">(Token Access URL)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSignerType('internal_user')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    signerType === 'internal_user'
                      ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-sm'
                      : 'bg-app-bg border-app-border text-app-muted hover:text-app-fg'
                  }`}
                >
                  <span>Internal Member</span>
                  <span className="text-[10px] text-app-muted font-normal">(Dashboard Sign)</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-app-fg uppercase tracking-wider block">Stakeholder Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-app-muted" />
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  required
                  placeholder="e.g., Jane Doe (VP Corporate Real Estate)"
                  className="w-full bg-app-bg border border-app-border rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-app-fg placeholder-app-muted focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-app-fg uppercase tracking-wider block">Stakeholder Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-app-muted" />
                <input
                  type="email"
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                  required
                  placeholder="stakeholder@enterprise-client.com"
                  className="w-full bg-app-bg border border-app-border rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-app-fg placeholder-app-muted focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2.5 rounded-xl border border-app-border hover:bg-app-hover text-app-muted hover:text-app-fg text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>{signerType === 'external_stakeholder' ? 'Generate Acceptance URL' : 'Send Invite'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

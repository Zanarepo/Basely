'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  getProjectSignoffs, 
  submitProjectSignoff, 
  deleteProjectSignoff, 
  bulkDeleteProjectSignoffs, 
  ProjectSignoffRecord 
} from '@/lib/projects/signoff-actions'
import { InviteSignerModal } from './InviteSignerModal'
import { 
  CheckCircle2, 
  Clock, 
  UserPlus, 
  Lock, 
  ShieldCheck, 
  Copy, 
  Check, 
  Mail, 
  Loader2, 
  PenTool,
  Trash2
} from 'lucide-react'

export interface SignoffManagementBoardProps {
  projectId: string
  hasEditAccess: boolean
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void
}

export function SignoffManagementBoard({
  projectId,
  hasEditAccess,
  onShowToast
}: SignoffManagementBoardProps) {
  const [signoffs, setSignoffs] = useState<ProjectSignoffRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [signingId, setSigningId] = useState<string | null>(null)
  const [typedSignature, setTypedSignature] = useState('')
  const [submittingSign, setSubmittingSign] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  const loadSignoffs = useCallback(async () => {
    setLoading(true)
    try {
      const list = await getProjectSignoffs(projectId)
      setSignoffs(list)
    } catch (err) {
      console.error(err)
      onShowToast?.('error', 'Could not load project acceptance records.')
    } finally {
      setLoading(false)
    }
  }, [projectId, onShowToast])

  useEffect(() => {
    loadSignoffs()
  }, [loadSignoffs])

  const handleCopyTokenUrl = (token: string | null, id: string) => {
    if (!token) return
    const url = `${window.location.origin}/signoff?token=${encodeURIComponent(token)}`
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    onShowToast?.('info', 'Secure client acceptance URL copied!')
    setTimeout(() => setCopiedId(null), 2500)
  }

  const handleInternalSign = async (id: string) => {
    if (!typedSignature.trim()) {
      onShowToast?.('error', 'Please type your full legal signature to formally execute closure acceptance.')
      return
    }
    setSubmittingSign(true)
    try {
      const res = await submitProjectSignoff({ signoffId: id, signatureReference: typedSignature })
      if (!res.ok) {
        onShowToast?.('error', res.error || 'Execution failed.')
      } else {
        onShowToast?.('success', 'Project sign-off formally recorded and locked immutably.')
        setSigningId(null)
        setTypedSignature('')
        loadSignoffs()
      }
    } catch {
      onShowToast?.('error', 'Network failure during signature execution.')
    } finally {
      setSubmittingSign(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])
  }

  const handleDeleteSingle = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await deleteProjectSignoff(id, projectId)
      if (!res.ok) {
        onShowToast?.('error', res.error || 'Failed to delete sign-off record.')
      } else {
        onShowToast?.('success', 'Sign-off record removed successfully.')
        setSelectedIds((prev) => prev.filter((i) => i !== id))
        loadSignoffs()
      }
    } catch {
      onShowToast?.('error', 'Network failure while deleting record.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    setIsBulkDeleting(true)
    try {
      const res = await bulkDeleteProjectSignoffs(selectedIds, projectId)
      if (!res.ok) {
        onShowToast?.('error', res.error || 'Bulk deletion failed.')
      } else {
        onShowToast?.('success', `${selectedIds.length} records removed successfully.`)
        setSelectedIds([])
        loadSignoffs()
      }
    } catch {
      onShowToast?.('error', 'Network failure during bulk deletion.')
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const completedCount = signoffs.filter((s) => !!s.signed_at).length
  const totalCount = signoffs.length

  return (
    <div className="w-full space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      <InviteSignerModal
        projectId={projectId}
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={() => loadSignoffs()}
        onShowToast={onShowToast}
      />

      {/* Header and Summary Bar */}
      <div className="p-4 sm:p-6 bg-app-surface border border-app-border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-2xl font-black text-app-fg tracking-tight truncate">
              Closure Acceptance & Sign-offs
            </h2>
            <p className="text-xs sm:text-sm text-app-muted truncate">
              Multi-signer immutable closure sign-off board with token-based external client links
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-app-bg border border-app-border text-xs font-mono font-bold text-app-muted flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{completedCount} / {totalCount} Accepted</span>
          </div>
          {hasEditAccess && (
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Signer</span>
            </button>
          )}
        </div>
      </div>

      {/* Bulk Delete Floating Banner */}
      {selectedIds.length > 0 && hasEditAccess && (
        <div className="p-3.5 px-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm animate-in fade-in slide-in-from-top-2 duration-200 shadow-md">
          <div className="flex items-center gap-2 font-bold text-rose-300">
            <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{selectedIds.length} sign-off record{selectedIds.length > 1 ? 's' : ''} selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-lg bg-app-bg text-app-muted hover:text-app-fg text-xs font-bold transition-all cursor-pointer"
            >
              Clear Selection
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isBulkDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Sign-off Records Grid (Responsive: Mobile 1 column, Tablet 2 col, Desktop 3 col) */}
      {loading ? (
        <div className="min-h-[200px] flex flex-col items-center justify-center p-8 text-app-muted space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          <p className="text-xs sm:text-sm font-bold animate-pulse">Loading compliance sign-off records...</p>
        </div>
      ) : signoffs.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-app-surface border border-app-border rounded-2xl space-y-4 max-w-2xl mx-auto">
          <ShieldCheck className="w-12 h-12 text-app-muted/40 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-app-fg">No Sign-off Invitations Active</h3>
            <p className="text-xs sm:text-sm text-app-muted leading-relaxed">
              Initiate project closure acceptance by inviting internal executive sponsors or sending 1-click zero-account URLs to external client leads.
            </p>
          </div>
          {hasEditAccess && (
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-indigo-500 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 cursor-pointer hover:bg-indigo-600 shadow-md shadow-indigo-500/20 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite First Signer</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {signoffs.map((item) => {
            const isSigned = !item.signed_at === false
            const isSelected = selectedIds.includes(item.id)
            return (
              <div
                key={item.id}
                className={`group p-4 sm:p-5 bg-app-surface border rounded-2xl transition-all flex flex-col justify-between relative overflow-hidden ${
                  isSelected ? 'border-rose-500/50 bg-rose-500/[0.02] ring-1 ring-rose-500/20' : isSigned ? 'border-emerald-500/30 bg-emerald-500/[0.02]' : 'border-app-border hover:border-app-muted/40'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 pr-1">
                      <h4 className="text-sm sm:text-base font-bold text-app-fg flex items-center gap-2 truncate">
                        <span>{item.signer_name}</span>
                      </h4>
                      <span className="text-xs font-mono text-app-muted flex items-center gap-1 mt-0.5 truncate">
                        <Mail className="w-3 h-3 shrink-0" />
                        {item.signer_email}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {hasEditAccess && (
                        <div className={`flex items-center gap-1 transition-opacity duration-200 ${
                          isSelected ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
                        }`}>
                          <label className="p-1.5 rounded-lg bg-app-bg/80 border border-app-border hover:bg-app-hover cursor-pointer flex items-center justify-center transition-colors" title="Select for bulk actions">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(item.id)}
                              className="w-3.5 h-3.5 rounded text-rose-500 focus:ring-0 cursor-pointer accent-rose-500"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => handleDeleteSingle(item.id)}
                            disabled={deletingId === item.id}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all cursor-pointer flex items-center justify-center"
                            title="Delete sign-off card"
                          >
                            {deletingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                        item.signer_type === 'external_stakeholder'
                          ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                          : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                      }`}>
                        {item.signer_type === 'external_stakeholder' ? 'External' : 'Internal'}
                      </span>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="pt-2 border-t border-app-border/60">
                    {isSigned ? (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5 text-xs text-emerald-800 dark:text-emerald-300">
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            Executed & Signed
                          </span>
                          <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-mono flex items-center gap-1 bg-emerald-500/20 px-2 py-0.5 rounded">
                            <Lock className="w-3 h-3" />
                            Immutable
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-700/90 dark:text-emerald-400/90 font-mono flex items-center justify-between pt-1 border-t border-emerald-500/20">
                          <span>Sig: <strong>&ldquo;{item.signature_reference}&rdquo;</strong></span>
                          <span>{new Date(item.signed_at!).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 font-bold">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse shrink-0" />
                          Pending Acceptance
                        </span>
                        {item.expires_at && (
                          <span className="text-[10px] text-amber-700/90 dark:text-amber-400/90">
                            Expires {new Date(item.expires_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Comments if present */}
                  {item.comments && (
                    <div className="text-xs text-app-muted bg-app-bg p-2.5 rounded-xl border border-app-border italic">
                      &ldquo;{item.comments}&rdquo;
                    </div>
                  )}
                </div>

                {/* Bottom Actions for Pending Sign-offs */}
                {!isSigned && (
                  <div className="mt-4 pt-3 border-t border-app-border/60 flex items-center justify-between gap-2">
                    {item.token ? (
                      <button
                        type="button"
                        onClick={() => handleCopyTokenUrl(item.token, item.id)}
                        className="w-full px-3 py-2 rounded-xl bg-app-bg hover:bg-app-hover border border-app-border text-app-fg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
                        <span>{copiedId === item.id ? 'URL Copied!' : 'Copy Client URL'}</span>
                      </button>
                    ) : signingId === item.id ? (
                      <div className="w-full space-y-2">
                        <input
                          type="text"
                          value={typedSignature}
                          onChange={(e) => setTypedSignature(e.target.value)}
                          placeholder="Type Full Legal Name..."
                          className="w-full px-3 py-1.5 bg-app-bg border border-app-border rounded-lg text-xs text-app-fg focus:outline-none focus:border-indigo-500"
                        />
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSigningId(null)}
                            className="px-2.5 py-1 rounded-md text-app-muted hover:text-app-fg text-xs"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleInternalSign(item.id)}
                            disabled={submittingSign}
                            className="px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1"
                          >
                            {submittingSign ? <Loader2 className="w-3 h-3 animate-spin" /> : <PenTool className="w-3 h-3" />}
                            <span>Confirm Sign</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setSigningId(item.id); setTypedSignature(item.signer_name); }}
                        className="w-full px-3 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        <span>Sign as Internal Member</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

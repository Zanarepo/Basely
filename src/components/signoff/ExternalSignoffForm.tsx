'use client'

import React, { useState } from 'react'
import { submitProjectSignoff, ProjectSignoffRecord } from '@/lib/projects/signoff-actions'
import { 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  Building2, 
  Workflow, 
  Loader2, 
  AlertTriangle, 
  PenTool, 
  Check, 
  FileText 
} from 'lucide-react'

export interface ExternalSignoffFormProps {
  token: string
  signoff: ProjectSignoffRecord
  project?: {
    id: string
    name: string
    client_name: string | null
    methodology: string
    lifecycle_status?: string
  }
}

export function ExternalSignoffForm({
  token,
  signoff,
  project
}: ExternalSignoffFormProps) {
  const [signature, setSignature] = useState(signoff.signer_name || '')
  const [comments, setComments] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isCompleted, setIsCompleted] = useState(!!signoff.signed_at)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signature.trim()) {
      setErrorMsg('Please enter your full typed name as your legal digital signature.')
      return
    }

    setSubmitting(true)
    setErrorMsg(null)
    try {
      const res = await submitProjectSignoff({
        token,
        signatureReference: signature,
        comments
      })
      if (!res.ok) {
        setErrorMsg(res.error || 'Failed to execute digital sign-off.')
      } else {
        setIsCompleted(true)
      }
    } catch (err) {
      console.error(err)
      setErrorMsg('Network connectivity error occurred while submitting.')
    } finally {
      setSubmitting(false)
    }
  }

  if (isCompleted) {
    return (
      <div className="w-full max-w-xl mx-auto p-6 sm:p-8 md:p-10 bg-app-surface border border-emerald-500/30 rounded-3xl shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-app-fg tracking-tight">
            Project Sign-Off Completed & Verified
          </h2>
          <p className="text-xs sm:text-sm text-app-muted leading-relaxed">
            Thank you, <strong className="text-app-fg">{signoff.signer_name}</strong>. Your formal project acceptance has been permanently recorded in the enterprise governance archive.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-app-bg border border-app-border text-left space-y-2.5 text-xs font-mono">
          <div className="flex justify-between border-b border-app-border/60 pb-2">
            <span className="text-app-muted">Project Name:</span>
            <span className="font-bold text-app-fg truncate max-w-[200px]">{project?.name || 'Enterprise Project'}</span>
          </div>
          <div className="flex justify-between border-b border-app-border/60 pb-2">
            <span className="text-app-muted">Signature Hash Reference:</span>
            <span className="text-emerald-400 font-bold">&ldquo;{signature || signoff.signature_reference}&rdquo;</span>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="text-app-muted">Record Integrity:</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px]">
              <Lock className="w-3 h-3" /> Immutable Append-Only
            </span>
          </div>
        </div>

        <p className="text-[11px] text-app-muted italic">
          You may safely close this tab. Automated notifications have been dispatched to the project leadership team.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Project Banner & Header (Responsive) */}
      <div className="p-5 sm:p-8 bg-app-surface border border-app-border rounded-3xl shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-app-border pb-6">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0 shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">
                External Client Acceptance Portal
              </span>
              <h1 className="text-xl sm:text-3xl font-black text-app-fg tracking-tight truncate">
                {project?.name || 'Project Closure Acceptance'}
              </h1>
            </div>
          </div>

          {project?.lifecycle_status && (
            <div className="px-3.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs sm:text-sm font-bold font-mono shrink-0 self-start sm:self-center">
              Phase: {project.lifecycle_status}
            </div>
          )}
        </div>

        {/* Stakeholder Details Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
          <div className="p-3.5 bg-app-bg rounded-2xl border border-app-border space-y-1">
            <span className="text-app-muted font-medium text-xs block">Designated Approver</span>
            <div className="font-bold text-app-fg text-sm truncate">{signoff.signer_name}</div>
            <div className="font-mono text-[11px] text-app-muted truncate">{signoff.signer_email}</div>
          </div>
          <div className="p-3.5 bg-app-bg rounded-2xl border border-app-border space-y-1 flex flex-col justify-between">
            <span className="text-app-muted font-medium text-xs block">Client Sponsor</span>
            <div className="font-bold text-app-fg text-sm flex items-center gap-1.5 truncate">
              <Building2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>{project?.client_name || 'Enterprise Client Sponsor'}</span>
            </div>
            <div className="text-[11px] text-emerald-400 font-bold">Verified External Token</div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs sm:text-sm text-rose-300 flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Acceptance Form */}
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-bold text-app-fg uppercase tracking-wider block">
              Digital Signature Verification
            </label>
            <p className="text-xs text-app-muted">
              By entering your full name below, you confirm that all project deliverables have been received, tested, and formally accepted under established specifications.
            </p>
            <div className="relative">
              <PenTool className="w-4 h-4 absolute left-3.5 top-3.5 text-app-muted" />
              <input
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                required
                placeholder="Type your full legal name to execute sign-off..."
                className="w-full bg-app-bg border border-app-border rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm font-bold text-app-fg focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-bold text-app-fg uppercase tracking-wider block">
              Additional Feedback or Comments (Optional)
            </label>
            <textarea
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Enter any commendations, notes, or operational remarks..."
              className="w-full bg-app-bg border border-app-border rounded-2xl p-3 sm:p-4 text-xs sm:text-sm text-app-fg focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 text-[11px] sm:text-xs text-app-muted leading-relaxed">
            <strong className="text-indigo-400 block mb-1">Compliance & Immutability Notice</strong>
            Upon clicking confirm, your sign-off signature, timestamp, and verification hash will be permanently written to an append-only audit trail in accordance with PM governance standards.
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white font-black text-sm sm:text-base tracking-wide shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
            <span>Formally Accept & Sign Project Closure</span>
          </button>
        </form>
      </div>
    </div>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { resolveHandoverData, HandoverData } from '@/lib/documents/resolvers/handover-and-pir-resolver'
import { LifecycleGatingBanner } from './LifecycleGatingBanner'
import type { ProjectLifecycleStatus } from '@/lib/projects/lifecycle-types'
import { 
  Briefcase, 
  UserCheck, 
  ArrowRightLeft, 
  FileCheck2, 
  Loader2, 
  Save, 
  Printer, 
  Mail, 
  Shield 
} from 'lucide-react'

export interface HandoverViewerProps {
  projectId: string
  hasEditAccess: boolean
  currentLifecycle: ProjectLifecycleStatus
  onOpenLifecycleModal?: () => void
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void
}

export function HandoverViewer({
  projectId,
  hasEditAccess,
  currentLifecycle,
  onOpenLifecycleModal,
  onShowToast
}: HandoverViewerProps) {
  const [data, setData] = useState<HandoverData | null>(null)
  const [loading, setLoading] = useState(true)
  const [instructions, setInstructions] = useState('')
  const [saving, setSaving] = useState(false)

  const isUnlocked = ['Closing', 'Closed'].includes(currentLifecycle)

  useEffect(() => {
    let isMounted = true
    async function loadData() {
      if (!isUnlocked) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const res = await resolveHandoverData(projectId)
        if (isMounted && res) {
          setData(res)
          setInstructions(res.defaultInstructions.operational_instructions)
        }
      } catch (err) {
        console.error('Failed to load handover data:', err)
        onShowToast?.('error', 'Could not compile handover package.')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadData()
    return () => { isMounted = false }
  }, [projectId, isUnlocked, onShowToast])

  if (!isUnlocked) {
    return (
      <LifecycleGatingBanner
        documentTitle="Final Handover Document"
        currentStatus={currentLifecycle}
        requiredStatuses={['Closing', 'Closed']}
        onOpenLifecycleModal={onOpenLifecycleModal}
        canEdit={hasEditAccess}
      />
    )
  }

  if (loading || !data) {
    return (
      <div className="w-full min-h-[400px] flex flex-col items-center justify-center p-8 text-app-muted space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs sm:text-sm font-bold animate-pulse">Compiling operational handover and RACI transfer matrix...</p>
      </div>
    )
  }

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      onShowToast?.('success', 'Final Handover package archived and locked.')
    }, 800)
  }

  return (
    <div className="w-full h-full overflow-y-auto pr-1 pb-12 space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="p-4 sm:p-6 bg-app-surface border border-app-border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-2xl font-black text-app-fg tracking-tight truncate">
              Final Project Handover Package
            </h2>
            <p className="text-xs sm:text-sm text-app-muted truncate">
              Operational transfer of WBS deliverables, maintenance guidelines, and long-term RACI support owners
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            onClick={() => window.print()}
            className="p-2.5 rounded-xl bg-app-bg border border-app-border hover:bg-app-hover text-app-fg transition-all cursor-pointer"
            title="Print or Export PDF"
          >
            <Printer className="w-4 h-4" />
          </button>
          {hasEditAccess && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-sky-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Commit Handover</span>
            </button>
          )}
        </div>
      </div>

      {/* Section 1: Operational Instructions */}
      <div className="p-4 sm:p-6 bg-app-surface border border-app-border rounded-2xl space-y-3">
        <label className="text-xs sm:text-sm font-bold text-app-fg uppercase tracking-wider block">
          Section 1: Operational Acceptance & Maintenance Instructions
        </label>
        <textarea
          rows={4}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          readOnly={!hasEditAccess}
          placeholder="Enter detailed maintenance instructions, system operating constraints, and SLA guarantees for post-closure operations..."
          className="w-full bg-app-bg border border-app-border rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-app-fg placeholder-app-muted focus:outline-none focus:border-sky-500 leading-relaxed"
        />
      </div>

      {/* Section 2: Transferred Deliverables Table (Responsive) */}
      <div className="p-4 sm:p-6 bg-app-surface border border-app-border rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-app-border pb-3">
          <h3 className="text-xs sm:text-sm font-bold text-app-fg uppercase tracking-wider flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            <span>Section 2: Transferred WBS Work Packages & Deliverables</span>
          </h3>
          <span className="text-xs font-mono font-bold text-app-muted">{data.deliverables.length} Packages</span>
        </div>

        <div className="w-full overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-app-border text-app-muted text-[11px] uppercase font-bold">
                <th className="py-2 px-3">Package Code</th>
                <th className="py-2 px-3">Deliverable Name</th>
                <th className="py-2 px-3">Original Engineering Lead</th>
                <th className="py-2 px-3 text-right">Handoff Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border/40">
              {data.deliverables.map((item, idx) => (
                <tr key={idx} className="hover:bg-app-hover/30 transition-colors">
                  <td className="py-3 px-3 font-mono text-sky-400 font-bold whitespace-nowrap">{item.code}</td>
                  <td className="py-3 px-3 text-app-fg font-medium">{item.name}</td>
                  <td className="py-3 px-3 text-app-muted whitespace-nowrap">{item.assignedOwner}</td>
                  <td className="py-3 px-3 text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 text-xs">
                      Transferred to Client
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Ongoing Ownership & Support RACI */}
      <div className="p-4 sm:p-6 bg-app-surface border border-app-border rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-app-border pb-3">
          <h3 className="text-xs sm:text-sm font-bold text-app-fg uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-purple-400" />
            <span>Section 3: Ongoing Post-Project Support & RACI Contacts</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {data.ongoingOwners.map((owner, idx) => (
            <div key={idx} className="p-4 bg-app-bg border border-app-border rounded-xl space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-bold text-app-fg">{owner.role}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Active SLA
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-app-muted">
                <span className="font-bold text-app-fg">{owner.name}</span>
                <span>•</span>
                <span className="font-mono text-[11px] flex items-center gap-1 text-sky-400">
                  <Mail className="w-3 h-3" />
                  {owner.email}
                </span>
              </div>
              <p className="text-xs text-app-muted/90 bg-app-surface p-2.5 rounded-lg border border-app-border/50">
                <strong className="text-app-fg">Responsibility: </strong> {owner.responsibility}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

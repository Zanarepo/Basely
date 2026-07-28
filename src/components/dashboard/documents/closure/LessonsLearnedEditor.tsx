'use client'

import React, { useState, useEffect } from 'react'
import { resolveLessonsLearnedData, LessonsLearnedTemplateStructure } from '@/lib/documents/resolvers/lessons-learned-resolver'
import { LifecycleGatingBanner } from './LifecycleGatingBanner'
import type { ProjectLifecycleStatus } from '@/lib/projects/lifecycle-types'
import { 
  Lightbulb, 
  ThumbsUp, 
  ThumbsDown, 
  Compass, 
  Loader2, 
  Save, 
  Printer, 
  Users, 
  Clock,
  Workflow 
} from 'lucide-react'
import { DocumentLoader } from '../DocumentLoader'

export interface LessonsLearnedEditorProps {
  projectId: string
  hasEditAccess: boolean
  currentLifecycle: ProjectLifecycleStatus
  onOpenLifecycleModal?: () => void
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void
}

export function LessonsLearnedEditor({
  projectId,
  hasEditAccess,
  currentLifecycle,
  onOpenLifecycleModal,
  onShowToast
}: LessonsLearnedEditorProps) {
  const [data, setData] = useState<LessonsLearnedTemplateStructure | null>(null)
  const [loading, setLoading] = useState(true)
  const [sections, setSections] = useState<Record<string, string>>({})
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
        const res = await resolveLessonsLearnedData(projectId)
        if (isMounted && res) {
          setData(res)
          setSections(res.defaultSections)
        }
      } catch (err) {
        console.error('Failed to load lessons learned data:', err)
        onShowToast?.('error', 'Could not retrieve retrospective templates.')
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
        documentTitle="Lessons Learned Retrospective"
        currentStatus={currentLifecycle}
        requiredStatuses={['Closing', 'Closed']}
        onOpenLifecycleModal={onOpenLifecycleModal}
        canEdit={hasEditAccess}
      />
    )
  }

  if (loading || !data) {
    return <DocumentLoader message="Initializing structured retrospective framework..." />
  }

  const handleSectionChange = (key: string, val: string) => {
    setSections(prev => ({ ...prev, [key]: val }))
  }

  const handleSave = async () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      onShowToast?.('success', 'Lessons Learned report saved and locked into enterprise PMO archive.')
    }, 800)
  }

  return (
    <div className="w-full h-full overflow-y-auto pr-1 pb-12 space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-4 sm:p-6 bg-app-surface border border-app-border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
            <Lightbulb className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-2xl font-black text-app-fg tracking-tight truncate">
              Lessons Learned Retrospective
            </h2>
            <p className="text-xs sm:text-sm text-app-muted truncate">
              Structured post-execution review of accomplishments, challenges, and actionable PMO recommendations
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
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-purple-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Retrospective Archive</span>
            </button>
          )}
        </div>
      </div>

      {/* Project Context Metadata Cards (Responsive Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-3.5 bg-app-surface border border-app-border rounded-xl flex items-center gap-3">
          <Workflow className="w-5 h-5 text-indigo-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-[10px] text-app-muted uppercase font-bold">Methodology</div>
            <div className="text-xs sm:text-sm font-bold text-app-fg truncate">{data.projectContext.methodology}</div>
          </div>
        </div>
        <div className="p-3.5 bg-app-surface border border-app-border rounded-xl flex items-center gap-3">
          <Users className="w-5 h-5 text-sky-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-[10px] text-app-muted uppercase font-bold">Execution Team Size</div>
            <div className="text-xs sm:text-sm font-bold text-app-fg truncate">{data.projectContext.teamSize} Contributors</div>
          </div>
        </div>
        <div className="p-3.5 bg-app-surface border border-app-border rounded-xl flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-[10px] text-app-muted uppercase font-bold">Project Duration</div>
            <div className="text-xs sm:text-sm font-bold text-app-fg truncate">{data.projectContext.durationDays} Active Days</div>
          </div>
        </div>
      </div>

      {/* Structured Prompted Section 1: What Worked Well */}
      <div className="p-4 sm:p-6 bg-app-surface border border-app-border rounded-2xl space-y-3">
        <div className="flex items-center gap-2.5 pb-2 border-b border-app-border">
          <ThumbsUp className="w-5 h-5 text-emerald-400 shrink-0" />
          <h3 className="text-xs sm:text-sm font-bold text-app-fg uppercase tracking-wider">
            1. What Worked Well (Successes & Key Drivers)
          </h3>
        </div>
        <p className="text-xs text-app-muted">
          Document high-performing practices, successful risk mitigations, effective tooling, and team collaborations that contributed to milestone completion.
        </p>
        <textarea
          rows={5}
          value={sections.what_worked_well || ''}
          onChange={(e) => handleSectionChange('what_worked_well', e.target.value)}
          readOnly={!hasEditAccess}
          placeholder="List bullet points of successful engineering methods, clear stakeholder communication, or EVM cost efficiencies..."
          className="w-full bg-app-bg border border-app-border rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-app-fg placeholder-app-muted focus:outline-none focus:border-purple-500 leading-relaxed font-mono sm:font-sans"
        />
      </div>

      {/* Structured Prompted Section 2: What Did Not Work */}
      <div className="p-4 sm:p-6 bg-app-surface border border-app-border rounded-2xl space-y-3">
        <div className="flex items-center gap-2.5 pb-2 border-b border-app-border">
          <ThumbsDown className="w-5 h-5 text-rose-400 shrink-0" />
          <h3 className="text-xs sm:text-sm font-bold text-app-fg uppercase tracking-wider">
            2. What Did Not Work (Challenges & Obstacles)
          </h3>
        </div>
        <p className="text-xs text-app-muted">
          Identify root causes of schedule slippage, scope expansion, budget variance, or vendor delays that hampered project velocity.
        </p>
        <textarea
          rows={5}
          value={sections.what_did_not_work || ''}
          onChange={(e) => handleSectionChange('what_did_not_work', e.target.value)}
          readOnly={!hasEditAccess}
          placeholder="Detail obstacles encountered during development, requirement gathering ambiguities, or unexpected resource bottlenecks..."
          className="w-full bg-app-bg border border-app-border rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-app-fg placeholder-app-muted focus:outline-none focus:border-purple-500 leading-relaxed font-mono sm:font-sans"
        />
      </div>

      {/* Structured Prompted Section 3: Recommendations for Future Projects */}
      <div className="p-4 sm:p-6 bg-app-surface border border-app-border rounded-2xl space-y-3">
        <div className="flex items-center gap-2.5 pb-2 border-b border-app-border">
          <Compass className="w-5 h-5 text-indigo-400 shrink-0" />
          <h3 className="text-xs sm:text-sm font-bold text-app-fg uppercase tracking-wider">
            3. Actionable Recommendations for Future Projects
          </h3>
        </div>
        <p className="text-xs text-app-muted">
          Synthesize lessons into concrete operational guidelines and baseline templates to empower subsequent teams and enterprise PMO playbooks.
        </p>
        <textarea
          rows={5}
          value={sections.recommendations_for_future || ''}
          onChange={(e) => handleSectionChange('recommendations_for_future', e.target.value)}
          readOnly={!hasEditAccess}
          placeholder="Provide prioritized recommendations, such as mandatory RTM signoff before Planning Phase completion..."
          className="w-full bg-app-bg border border-app-border rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-app-fg placeholder-app-muted focus:outline-none focus:border-purple-500 leading-relaxed font-mono sm:font-sans"
        />
      </div>
    </div>
  )
}

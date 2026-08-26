'use client'

import React, { useState, useEffect, useRef } from 'react'
import { resolveLessonsLearnedData, LessonsLearnedTemplateStructure } from '@/lib/documents/resolvers/lessons-learned-resolver'
import { generateClosureSynthesis } from '@/lib/documents/ai-closure-actions'
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
  Workflow,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react'
import { DocumentLoader } from '../DocumentLoader'
import { toast } from 'sonner'

export interface LessonsLearnedEditorProps {
  projectId: string
  organizationId: string
  hasEditAccess: boolean
  currentLifecycle: ProjectLifecycleStatus
  onOpenLifecycleModal?: () => void
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void
  releaseId?: string
}

export function LessonsLearnedEditor({
  projectId,
  organizationId,
  hasEditAccess,
  currentLifecycle,
  onOpenLifecycleModal,
  onShowToast,
  releaseId
}: LessonsLearnedEditorProps) {
  const [data, setData] = useState<LessonsLearnedTemplateStructure | null>(null)
  const [loading, setLoading] = useState(true)
  const [sections, setSections] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const initialLoadDone = useRef(false)
  
  // AI States
  const [aiLoading, setAiLoading] = useState(false)
  const [aiInsights, setAiInsights] = useState<any[] | null>(null)
  const [proposedRisks, setProposedRisks] = useState<any[]>([])
  const [proposedMoats, setProposedMoats] = useState<any[]>([])
  const [lessonsLearnedId, setLessonsLearnedId] = useState<string | null>(null)
  const [strategyUpdated, setStrategyUpdated] = useState(false)

  const isUnlocked = releaseId ? true : ['Closing', 'Closed'].includes(currentLifecycle)

  useEffect(() => {
    let isMounted = true
    async function loadData() {
      if (!isUnlocked) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const res = await resolveLessonsLearnedData(projectId, releaseId)
        if (isMounted && res) {
          setData(res)
          setSections(res.defaultSections)
          if (res.aiInsights) setAiInsights(res.aiInsights)
          if (res.lessonId) setLessonsLearnedId(res.lessonId)
          if (res.status === 'strategy_updated') setStrategyUpdated(true)
          
          // If we already have insights but no strategy update, we should fetch proposed updates
          if (res.aiInsights && res.status !== 'strategy_updated' && res.lessonId) {
            fetch('/api/internal/ai/lessons-learned', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'propose_strategy_updates', projectId, lessonsLearnedId: res.lessonId })
            }).then(updateRes => updateRes.json()).then(updateResult => {
              if (updateResult.ok && isMounted) {
                 setProposedRisks(updateResult.proposedRisks)
                 setProposedMoats(updateResult.proposedMoats)
              }
            }).catch(console.error)
          }
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

  // Auto-save: debounce 1.5s after sections change
  useEffect(() => {
    if (!initialLoadDone.current) {
      if (Object.keys(sections).length > 0) initialLoadDone.current = true
      return
    }
    if (!hasEditAccess || saving) return

    const timer = setTimeout(() => {
      // Inline save logic to avoid hoisting issues
      const rawNotes = `What worked well:\n${sections.what_worked_well || ''}\n\nWhat did not work:\n${sections.what_did_not_work || ''}\n\nRecommendations:\n${sections.recommendations_for_future || ''}`
      fetch('/api/internal/ai/lessons-learned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_draft', projectId, rawNotes, releaseId })
      }).catch(err => console.error('Auto-save failed:', err))
    }, 1500)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections])

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
    try {
      const rawNotes = `What worked well:\n${sections.what_worked_well}\n\nWhat did not work:\n${sections.what_did_not_work}\n\nRecommendations:\n${sections.recommendations_for_future}`
      
      const res = await fetch('/api/internal/ai/lessons-learned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_draft', projectId, rawNotes, lessonsLearnedId, releaseId })
      })
      const result = await res.json()
      if (result.ok) {
        if (result.id) setLessonsLearnedId(result.id)
        toast.success('Lessons Learned report saved and locked into enterprise PMO archive.')
        onShowToast?.('success', 'Lessons Learned report saved and locked into enterprise PMO archive.')
      } else {
        toast.error(result.error || 'Failed to save report.')
        onShowToast?.('error', result.error || 'Failed to save report.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error saving report.')
      onShowToast?.('error', err.message || 'Error saving report.')
    } finally {
      setSaving(false)
    }
  }
  
  const handleSynthesize = async () => {
    setAiLoading(true)
    try {
      // --- 1. Run the new AI engine to overwrite the text fields ---
      const synthesisPromise = generateClosureSynthesis(projectId, 'lessons_learned', 'openai')
        .then((synthesisRes) => {
          if (synthesisRes.ok && synthesisRes.data) {
            const d = synthesisRes.data as Record<string, string>
            setSections(prev => ({
              ...prev,
              what_worked_well: d.what_worked_well || prev.what_worked_well,
              what_did_not_work: d.what_did_not_work || prev.what_did_not_work,
              recommendations_for_future: d.recommendations_for_future || prev.recommendations_for_future,
              ...(d.executive_context ? { executive_context: d.executive_context } : {})
            }))
            toast.success('Fields auto-filled from real project history!')
          } else {
            console.error('Closure synthesis returned not ok:', synthesisRes.error)
            toast.error(synthesisRes.error || 'AI field population failed')
          }
        })
        .catch((e) => {
          console.error('Failed to populate fields via closure engine:', e)
          toast.error('AI field generation failed — check server logs')
        })

      // --- 2. Run old clustered insights API in parallel ---
      const rawNotes = `What worked well:\n${sections.what_worked_well}\n\nWhat did not work:\n${sections.what_did_not_work}\n\nRecommendations:\n${sections.recommendations_for_future}`
      const insightsPromise = fetch('/api/internal/ai/lessons-learned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'synthesize', projectId, releaseId, rawNotes })
      })
        .then(res => res.json())
        .then(async (result) => {
          if (result.ok) {
            setAiInsights(result.insights)
            // Propose strategy updates
            try {
              const updateRes = await fetch('/api/internal/ai/lessons-learned', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'propose_strategy_updates', projectId, lessonsLearnedId: result.id || lessonsLearnedId })
              })
              const updateResult = await updateRes.json()
              if (updateResult.ok) {
                setProposedRisks(updateResult.proposedRisks)
                setProposedMoats(updateResult.proposedMoats)
              }
            } catch (e) {
              console.error('Strategy proposal failed:', e)
            }
          }
        })
        .catch(console.error)

      // Wait for both to complete
      await Promise.allSettled([synthesisPromise, insightsPromise])

    } catch (err: any) {
      toast.error(err.message || 'Error occurred.')
      onShowToast?.('error', err.message || 'Error occurred.')
    } finally {
      setAiLoading(false)
    }
  }
  
  const handleAcceptStrategyUpdates = async () => {
    setAiLoading(true)
    try {
      const res = await fetch('/api/internal/ai/lessons-learned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'accept_strategy_updates', 
          projectId, 
          lessonsLearnedId: lessonsLearnedId || 'temp',
          proposedRisks,
          proposedMoats 
        })
      })
      const result = await res.json()
      if (result.ok) {
         setStrategyUpdated(true)
         toast.success('Product Strategy successfully updated!')
         onShowToast?.('success', 'Product Strategy successfully updated!')
      } else {
         toast.error(result.error || 'Failed to update Product Strategy.')
         onShowToast?.('error', result.error || 'Failed to update Product Strategy.')
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred while updating the strategy.')
      onShowToast?.('error', err.message || 'An error occurred while updating the strategy.')
    } finally {
      setAiLoading(false)
    }
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
              {releaseId ? 'Release Retrospective' : 'Project Lessons Learned'}
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
              className="px-4 py-2.5 rounded-xl bg-app-surface border border-app-border hover:bg-app-hover active:scale-95 text-app-fg font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Archive</span>
            </button>
          )}
          {hasEditAccess && (
            <button
              onClick={handleSynthesize}
              disabled={aiLoading}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-purple-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>AI Synthesize</span>
            </button>
          )}
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
        <textarea
          rows={5}
          value={sections.what_worked_well || ''}
          onChange={(e) => handleSectionChange('what_worked_well', e.target.value)}
          readOnly={!hasEditAccess}
          placeholder="List bullet points of successful methods..."
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
        <textarea
          rows={5}
          value={sections.what_did_not_work || ''}
          onChange={(e) => handleSectionChange('what_did_not_work', e.target.value)}
          readOnly={!hasEditAccess}
          placeholder="Detail obstacles encountered..."
          className="w-full bg-app-bg border border-app-border rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-app-fg placeholder-app-muted focus:outline-none focus:border-purple-500 leading-relaxed font-mono sm:font-sans"
        />
      </div>
      
      {/* AI Insights & Strategy Proposal (Visible only if AI Synthesis ran) */}
      {aiInsights && (
        <div className="p-4 sm:p-6 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-500/30 rounded-2xl space-y-6">
          <div className="flex items-center gap-2.5 pb-2 border-b border-purple-200 dark:border-purple-500/20">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold text-purple-900 dark:text-purple-100 uppercase tracking-wider">
              AI Synthesized Strategy Insights
            </h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Insights */}
            <div className="space-y-3">
               <h4 className="text-sm font-bold text-purple-900 dark:text-purple-200">Clustered Retro Insights</h4>
               {aiInsights.map((insight, idx) => (
                 <div key={idx} className="p-3 bg-white dark:bg-app-bg/50 border border-purple-200 dark:border-purple-500/20 rounded-xl shadow-sm">
                   <div className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase mb-1">{insight.category}</div>
                   <div className="text-sm text-app-fg font-medium">{insight.summary}</div>
                   <div className="text-xs text-app-muted mt-1">{insight.action_item}</div>
                 </div>
               ))}
            </div>
            
            {/* Proposed Updates */}
            <div className="space-y-3">
               <h4 className="text-sm font-bold text-purple-900 dark:text-purple-200">Proposed Strategy Document Updates</h4>
               
               {proposedRisks && proposedRisks.length > 0 && (
                 <div className="p-3 bg-app-bg/50 border border-rose-500/20 rounded-xl space-y-2">
                   <div className="flex items-center gap-2 text-rose-400">
                     <AlertTriangle className="w-4 h-4" />
                     <span className="text-xs font-bold uppercase">New Strategic Risks</span>
                   </div>
                   {proposedRisks.map((r, i) => (
                     <div key={i} className="text-xs text-app-muted">
                       <span className="text-app-fg font-medium">{r.title}</span> - {r.description}
                     </div>
                   ))}
                 </div>
               )}
               
               {proposedMoats && proposedMoats.length > 0 && (
                 <div className="p-3 bg-app-bg/50 border border-emerald-500/20 rounded-xl space-y-2">
                   <div className="flex items-center gap-2 text-emerald-400">
                     <ShieldCheck className="w-4 h-4" />
                     <span className="text-xs font-bold uppercase">New Execution Moats</span>
                   </div>
                   {proposedMoats.map((m, i) => (
                     <div key={i} className="text-xs text-app-muted">
                       <span className="text-app-fg font-medium">{m.title}</span> - {m.description}
                     </div>
                   ))}
                 </div>
               )}
               
               {!strategyUpdated ? (
                  <button 
                    onClick={handleAcceptStrategyUpdates}
                    disabled={aiLoading || (!proposedRisks?.length && !proposedMoats?.length)}
                    className="w-full p-2.5 mt-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Updating Strategy...</span>
                      </>
                    ) : (
                      'Accept & Update Product Strategy'
                    )}
                  </button>
                ) : (
                 <div className="w-full p-2.5 mt-2 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center gap-2">
                   <CheckCircle2 className="w-4 h-4" /> Strategy Updated Successfully
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import React, { useState } from 'react'
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react'
import { AiHoverBannerWrapper } from '../AiHoverBannerWrapper'
import { generateBacklogFromPrdAndRoadmap } from '@/lib/wbs/wbs-ai-actions'
import { useRouter } from 'next/navigation'

interface PrdToWbsAutomationBannerProps {
  projectId: string
  organizationId: string
  onShowToast: (type: 'success' | 'error', msg: string) => void
  isSnapshot?: boolean
}

export default function PrdToWbsAutomationBanner({
  projectId,
  organizationId,
  onShowToast,
  isSnapshot = false,
}: PrdToWbsAutomationBannerProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const router = useRouter()

  const handleGenerateWbs = async () => {
    if (isGenerating) return
    setIsGenerating(true)
    try {
      const res = await generateBacklogFromPrdAndRoadmap(projectId, organizationId)
      
      if (res.success) {
        setIsDone(true)
        onShowToast('success', 'Execution Backlog (Epics & Stories) successfully generated in Product Backlog!')
        router.refresh()
      } else {
        onShowToast('error', res.error || 'Failed to extract PRD to Product Backlog.')
      }
    } catch (err: any) {
      console.error('[PRD to WBS Hook Error]:', err)
      onShowToast('error', err.message || 'An error occurred during backlog generation.')
    } finally {
      setIsGenerating(false)
    }
  }

  if (isSnapshot) return null

  return (
    <AiHoverBannerWrapper
      widthClass="w-[420px]"
      trigger={
        <div className="flex items-center gap-2">
          {isDone ? (
            <button
              type="button"
              style={{ cursor: 'pointer' }}
              onClick={() => router.push(`/dashboard/projects/${projectId}?tab=wbs`)}
              className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-md bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-600/20 font-bold text-xs transition-all shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>View Product Backlog</span>
            </button>
          ) : (
            <button
              type="button"
              style={{ cursor: 'pointer' }}
              disabled={isGenerating}
              onClick={handleGenerateWbs}
              className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-md bg-violet-600/10 hover:bg-violet-600/20 text-violet-600 dark:text-violet-400 border border-violet-600/20 font-bold text-xs transition-all shadow-sm disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Building Backlog...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Convert PRD to Product Backlog</span>
                </>
              )}
            </button>
          )}
        </div>
      }
    >
      <div className="bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-white dark:to-slate-900 border border-violet-500/20 px-5 py-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                PRD → Product Backlog Automation
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-violet-600 text-white uppercase tracking-wider">
                Execution Module
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Extract explicit User Stories and Epics from this PRD directly into your Agile Product Backlog.
            </p>
          </div>
        </div>
      </div>
    </AiHoverBannerWrapper>
  )
}

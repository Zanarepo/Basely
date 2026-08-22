'use client'

import React, { useEffect, useState } from 'react'
import { getQualityManagementPlan, QualityManagementPlan, QualityStandard } from '@/lib/planning/quality-actions'
import { generateQualityPlanFromWbs } from '@/lib/planning/ai-quality-actions'
import { CheckSquare, FileText, Sparkles, Loader2 } from 'lucide-react'
import StructuredEditableField from '@/components/dashboard/documents/components/StructuredEditableField'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { markdownComponents } from '@/components/dashboard/documents/components/structured/markdownComponents'

export function QualityManagementPlanResolver({ projectId }: { projectId: string }) {
  const [plan, setPlan] = useState<QualityManagementPlan | null>(null)
  const [standards, setStandards] = useState<QualityStandard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  const fetchPlan = async () => {
    setIsLoading(true)
    const res = await getQualityManagementPlan(projectId)
    if (!res.error) {
      if (res.plan) setPlan(res.plan)
      if (res.standards) setStandards(res.standards)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchPlan()
  }, [projectId])

  const handleGenerateAI = async () => {
    setIsGenerating(true)
    const res = await generateQualityPlanFromWbs(projectId)
    if (res.ok) {
      await fetchPlan()
    } else {
      alert(res.error || 'Failed to generate plan')
    }
    setIsGenerating(false)
  }

  if (isLoading) return <div className="p-4 text-sm text-app-muted">Loading quality plan...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <button
          onClick={handleGenerateAI}
          disabled={isGenerating}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-violet-700 bg-violet-100 hover:bg-violet-200 rounded-md transition-colors disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {isGenerating ? 'Analyzing WBS...' : 'Auto-Generate via AI'}
        </button>
      </div>

      <div className="space-y-8">
        <StructuredEditableField
          value={plan?.review_cadence || ''}
          onChange={() => {}}
          title="Quality Review Cadence"
          hasEditAccess={false}
          documentType="quality_plan"
        />

      <div className="bg-app-surface border border-app-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-app-border bg-app-surface/50">
          <h3 className="text-sm font-semibold text-app-fg">Quality Standards</h3>
        </div>
        <div className="divide-y divide-app-border">
          {standards.length === 0 ? (
            <div className="p-4 text-sm text-app-muted italic">No quality standards defined.</div>
          ) : (
            standards.map(std => (
              <div key={std.id} className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  {std.is_checklist_item ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      <CheckSquare className="w-3 h-3" /> Checklist
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20">
                      <FileText className="w-3 h-3" /> Prose Standard
                    </span>
                  )}
                </div>
                <div className="text-sm text-app-fg prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {std.criterion_text}
                  </ReactMarkdown>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      </div>
    </div>
  )
}

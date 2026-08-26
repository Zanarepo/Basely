'use client'

import React, { useState, useEffect } from 'react'
import { Check, Edit2, Loader2, Plus, Save, Trash2, ShieldCheck, AlertCircle, Pencil, X, FileText, CheckSquare, Sparkles } from 'lucide-react'
import { DocumentLoader } from '@/components/dashboard/documents/DocumentLoader'
import { useQualityManagementPlan } from './hooks/useQualityManagementPlan'
import { QualityStandard } from '@/lib/planning/quality-actions'
import { generateQualityPlanFromWbs } from '@/lib/planning/ai-quality-actions'
import { QualityStandardForm } from './QualityStandardForm'
import StructuredEditableField from '@/components/dashboard/documents/components/StructuredEditableField'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { markdownComponents } from '@/components/dashboard/documents/components/structured/markdownComponents'
import { useAiEntitlements } from '@/hooks/useAiEntitlements'
import { UpgradePromptModal } from '@/components/dashboard/billing/UpgradePromptModal'

export function QualityManagementPlanEditor({ 
  projectId,
  organizationId,
  hasEditAccess,
  onShowToast
}: { 
  projectId: string
  organizationId: string
  hasEditAccess?: boolean
  onShowToast?: (type: 'error' | 'success' | 'info', msg: string) => void
}) {
  const { plan, standards, isLoading, error, isSaving, savePlanDetails, saveStandard, removeStandard, refresh } = useQualityManagementPlan(projectId)
  
  const [editingPlan, setEditingPlan] = useState(false)
  const [draftCadence, setDraftCadence] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedStandard, setSelectedStandard] = useState<QualityStandard | null>(null)
  const { checkLimit, recordUsage, isChecking, UpgradePromptModalProps } = useAiEntitlements(organizationId)

  const handleGenerateAI = async () => {
    if (isGenerating || isChecking) return
    const allowed = await checkLimit('max_ai_generations')
    if (!allowed) return

    setIsGenerating(true)
    const res = await generateQualityPlanFromWbs(projectId)
    if (res.ok) {
      await recordUsage('generations')
      onShowToast?.('success', 'Generated successfully!')
      refresh()
    } else {
      onShowToast?.('error', res.error || 'Failed to generate plan')
    }
    setIsGenerating(false)
  }

  useEffect(() => {
    if (plan) {
      setDraftCadence(plan.review_cadence || '')
    }
  }, [plan])

  useEffect(() => {
    if (error) {
      onShowToast?.('error', error)
    }
  }, [error, onShowToast])

  if (isLoading) {
    return <DocumentLoader message="Loading Quality Management Plan..." />
  }

  const handleSavePlan = async () => {
    const err = await savePlanDetails(draftCadence)
    if (err) onShowToast?.('error', err)
    else {
      onShowToast?.('success', 'Plan details saved')
      setEditingPlan(false)
    }
  }

  const handleSaveStandard = async (stdData: Partial<QualityStandard>) => {
    const err = await saveStandard(stdData)
    if (err) return err
    onShowToast?.('success', 'Standard saved')
    setIsModalOpen(false)
  }

  const startEditStandard = (std: QualityStandard) => {
    setSelectedStandard(std)
    setIsModalOpen(true)
  }

  const startAddStandard = () => {
    setSelectedStandard(null)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-app-fg tracking-tight">Quality Management Plan</h2>
          <p className="text-sm text-app-muted">Define the criteria and frequency for quality audits.</p>
        </div>
        
        {hasEditAccess && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerateAI}
              disabled={isGenerating || isSaving}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-violet-700 bg-violet-100 hover:bg-violet-200 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Auto-Generate via AI
            </button>
            <button
              onClick={handleSavePlan}
              disabled={isSaving || isGenerating}
              className="flex items-center gap-2 bg-violet-500 hover:bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        )}
      </div>

      <div className="space-y-8">
        <StructuredEditableField
          value={draftCadence}
          onChange={(val) => setDraftCadence(val)}
          title="Quality Review Cadence"
          hasEditAccess={hasEditAccess || false}
          documentType="quality_plan"
          placeholder="Describe how often the project quality will be formally audited (e.g. Monthly, End of Phase)..."
        />

      <div className="bg-app-surface border border-app-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-app-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-app-fg">Project Quality Standards</h3>
            <p className="text-xs text-app-muted mt-1">
              Define the criteria deliverables must meet. Use checklist items for programmatically checkable rules.
            </p>
          </div>
          {hasEditAccess && (
            <button
              onClick={startAddStandard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white text-xs font-medium rounded-md transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Standard
            </button>
          )}
        </div>

        <div className="divide-y divide-app-border">
          {standards.length === 0 ? (
            <div className="p-8 text-center text-sm text-app-muted">
              No quality standards defined yet. Add one to get started.
            </div>
          ) : (
            standards.map(std => (
              <div key={std.id} className="group flex items-start justify-between p-4 hover:bg-app-surface/50 transition-colors">
                <div className="flex-1 mr-4">
                  <div className="flex items-center gap-2 mb-2">
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

                {hasEditAccess && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEditStandard(std)}
                      className="p-1.5 text-app-muted hover:text-violet-500 rounded transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this standard?')) removeStandard(std.id)
                      }}
                      className="p-1.5 text-app-muted hover:text-red-500 rounded transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      </div>
      
      {isModalOpen && (
        <QualityStandardForm 
          standard={selectedStandard}
          onSave={handleSaveStandard}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      <UpgradePromptModal {...UpgradePromptModalProps} />
    </div>
  )
}

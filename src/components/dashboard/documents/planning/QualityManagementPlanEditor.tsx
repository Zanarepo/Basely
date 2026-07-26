'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Pencil, Check, X, FileText, CheckSquare, Save, Loader2 } from 'lucide-react'
import { useQualityManagementPlan } from './hooks/useQualityManagementPlan'
import { QualityStandard } from '@/lib/planning/quality-actions'
import { QualityStandardForm } from './QualityStandardForm'

export function QualityManagementPlanEditor({ 
  projectId,
  hasEditAccess,
  onShowToast
}: { 
  projectId: string
  hasEditAccess?: boolean
  onShowToast?: (type: 'error' | 'success' | 'info', msg: string) => void
}) {
  const { plan, standards, isLoading, error, isSaving, savePlanDetails, saveStandard, removeStandard } = useQualityManagementPlan(projectId)
  
  const [editingPlan, setEditingPlan] = useState(false)
  const [draftCadence, setDraftCadence] = useState('')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedStandard, setSelectedStandard] = useState<QualityStandard | null>(null)

  useEffect(() => {
    if (error) {
      onShowToast?.('error', error)
    }
  }, [error, onShowToast])

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-app-muted" />
      </div>
    )
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

  const startEditPlan = () => {
    setDraftCadence(plan?.review_cadence || '')
    setEditingPlan(true)
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
      <div className="bg-app-surface border border-app-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-app-border flex items-center justify-between group">
          <div>
            <h3 className="text-sm font-semibold text-app-fg">Quality Review Cadence</h3>
            <p className="text-xs text-app-muted mt-1">How often the project quality will be formally audited</p>
          </div>
          {hasEditAccess && !editingPlan && (
            <button
              onClick={startEditPlan}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-app-muted hover:text-indigo-500 rounded-md transition-all cursor-pointer"
              title="Edit Cadence"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="p-4">
          {editingPlan ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={draftCadence}
                onChange={(e) => setDraftCadence(e.target.value)}
                placeholder="e.g. Monthly, End of Phase..."
                className="flex-1 bg-app-bg border border-app-border rounded px-3 py-1.5 text-sm text-app-fg focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleSavePlan}
                disabled={isSaving}
                className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded cursor-pointer transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setEditingPlan(false)}
                className="p-1.5 text-app-muted hover:text-app-fg rounded cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-sm text-app-fg">
              {plan?.review_cadence || <span className="text-app-muted italic">No cadence defined</span>}
            </div>
          )}
        </div>
      </div>

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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium rounded-md transition-colors shadow-sm cursor-pointer"
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
                  <div className="text-sm text-app-fg whitespace-pre-wrap">{std.criterion_text}</div>
                </div>

                {hasEditAccess && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEditStandard(std)}
                      className="p-1.5 text-app-muted hover:text-indigo-500 rounded transition-colors cursor-pointer"
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
      
      {isModalOpen && (
        <QualityStandardForm
          standard={selectedStandard}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveStandard}
        />
      )}
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { X, Save } from 'lucide-react'
import { BusinessCase, FeasibilityStudy, createFeasibilityStudy, updateFeasibilityStudy } from '@/lib/initiation/actions'

interface FeasibilityStudyModalProps {
  open: boolean
  onClose: () => void
  organizationId: string
  callerUserId: string
  initialData: FeasibilityStudy | null
  businessCases: BusinessCase[]
  onShowToast: (type: 'success' | 'error', msg: string) => void
}

export function FeasibilityStudyModal({ open, onClose, organizationId, callerUserId, initialData, businessCases, onShowToast }: FeasibilityStudyModalProps) {
  const [isPending, startTransition] = useTransition()
  
  const [name, setName] = useState(initialData?.name || '')
  const [businessCaseId, setBusinessCaseId] = useState(initialData?.business_case_id || '')
  const [technicalAssessment, setTechnicalAssessment] = useState(initialData?.technical_assessment || '')
  const [financialAssessment, setFinancialAssessment] = useState(initialData?.financial_assessment || '')
  const [operationalAssessment, setOperationalAssessment] = useState(initialData?.operational_assessment || '')
  const [overallRecommendation, setOverallRecommendation] = useState(initialData?.overall_recommendation || '')

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const payload = {
      organization_id: organizationId,
      name,
      business_case_id: businessCaseId || null,
      technical_assessment: technicalAssessment || null,
      financial_assessment: financialAssessment || null,
      operational_assessment: operationalAssessment || null,
      overall_recommendation: overallRecommendation || null,
      created_by: callerUserId
    }

    startTransition(async () => {
      let res
      if (initialData) {
        res = await updateFeasibilityStudy(initialData.id, payload)
      } else {
        res = await createFeasibilityStudy(payload)
      }
      
      if (res.ok) {
        onShowToast('success', initialData ? 'Feasibility Study updated' : 'Feasibility Study created')
        onClose()
      } else {
        onShowToast('error', res.error || 'Failed to save Feasibility Study')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isPending && onClose()} />
        
        <div className="relative w-full max-w-2xl bg-app-surface border border-app-border rounded-2xl shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
          <div className="shrink-0 px-6 py-4 border-b border-app-border flex items-center justify-between">
            <h2 className="text-lg font-bold text-app-fg">
              {initialData ? 'Edit Feasibility Study' : 'New Feasibility Study'}
            </h2>
            <button onClick={onClose} disabled={isPending} className="p-2 rounded-xl hover:bg-app-hover text-app-muted transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form id="fs-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            <div>
              <label className="auth-label">Study Name <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Cloud Migration Feasibility"
                className="auth-input"
                disabled={isPending}
              />
            </div>

            <div>
              <label className="auth-label">Link to Business Case (Optional)</label>
              <select
                value={businessCaseId}
                onChange={e => setBusinessCaseId(e.target.value)}
                className="auth-input"
                disabled={isPending}
              >
                <option value="">None (Standalone Study)</option>
                {businessCases.map(bc => (
                  <option key={bc.id} value={bc.id}>{bc.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="auth-label">Technical Assessment</label>
              <textarea
                rows={3}
                value={technicalAssessment}
                onChange={e => setTechnicalAssessment(e.target.value)}
                placeholder="Can it be built? Tech stack, risks..."
                className="auth-input resize-none"
                disabled={isPending}
              />
            </div>

            <div>
              <label className="auth-label">Financial Assessment</label>
              <textarea
                rows={3}
                value={financialAssessment}
                onChange={e => setFinancialAssessment(e.target.value)}
                placeholder="Can we afford it? Funding, cash flow..."
                className="auth-input resize-none"
                disabled={isPending}
              />
            </div>
            
            <div>
              <label className="auth-label">Operational Assessment</label>
              <textarea
                rows={3}
                value={operationalAssessment}
                onChange={e => setOperationalAssessment(e.target.value)}
                placeholder="Will it work in practice? Resources, change management..."
                className="auth-input resize-none"
                disabled={isPending}
              />
            </div>

            <div>
              <label className="auth-label">Overall Recommendation</label>
              <textarea
                rows={3}
                value={overallRecommendation}
                onChange={e => setOverallRecommendation(e.target.value)}
                placeholder="Final verdict on feasibility..."
                className="auth-input resize-none"
                disabled={isPending}
              />
            </div>
          </form>

          <div className="shrink-0 px-6 py-4 border-t border-app-border bg-app-muted-surface flex justify-end gap-3 rounded-b-2xl">
            <button type="button" onClick={onClose} disabled={isPending} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" form="fs-form" disabled={isPending} className="btn-primary">
              <Save className="w-4 h-4 mr-2" />
              {isPending ? 'Saving...' : 'Save Feasibility Study'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

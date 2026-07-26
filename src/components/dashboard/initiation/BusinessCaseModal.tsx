'use client'

import { useState, useTransition } from 'react'
import { X, Save } from 'lucide-react'
import { BusinessCase, createBusinessCase, updateBusinessCase } from '@/lib/initiation/actions'

interface BusinessCaseModalProps {
  open: boolean
  onClose: () => void
  organizationId: string
  callerUserId: string
  initialData: BusinessCase | null
  onShowToast: (type: 'success' | 'error', msg: string) => void
}

export function BusinessCaseModal({ open, onClose, organizationId, callerUserId, initialData, onShowToast }: BusinessCaseModalProps) {
  const [isPending, startTransition] = useTransition()
  
  const [name, setName] = useState(initialData?.name || '')
  const [problemStatement, setProblemStatement] = useState(initialData?.problem_statement || '')
  const [proposedSolution, setProposedSolution] = useState(initialData?.proposed_solution || '')
  const [estimatedCost, setEstimatedCost] = useState(initialData?.estimated_cost ? String(initialData.estimated_cost) : '')
  const [estimatedBenefit, setEstimatedBenefit] = useState(initialData?.estimated_benefit || '')
  const [recommendation, setRecommendation] = useState(initialData?.recommendation || '')

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const payload = {
      organization_id: organizationId,
      name,
      problem_statement: problemStatement || null,
      proposed_solution: proposedSolution || null,
      estimated_cost: estimatedCost ? parseFloat(estimatedCost) : null,
      estimated_benefit: estimatedBenefit || null,
      recommendation: recommendation || null,
      created_by: callerUserId
    }

    startTransition(async () => {
      let res
      if (initialData) {
        res = await updateBusinessCase(initialData.id, payload)
      } else {
        res = await createBusinessCase(payload)
      }
      
      if (res.ok) {
        onShowToast('success', initialData ? 'Business Case updated' : 'Business Case created')
        onClose()
      } else {
        onShowToast('error', res.error || 'Failed to save Business Case')
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
              {initialData ? 'Edit Business Case' : 'New Business Case'}
            </h2>
            <button onClick={onClose} disabled={isPending} className="p-2 rounded-xl hover:bg-app-hover text-app-muted transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form id="bc-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            <div>
              <label className="auth-label">Business Case Name <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Enterprise CRM Migration"
                className="auth-input"
                disabled={isPending}
              />
            </div>

            <div>
              <label className="auth-label">Problem / Opportunity Statement</label>
              <textarea
                rows={3}
                value={problemStatement}
                onChange={e => setProblemStatement(e.target.value)}
                placeholder="What problem does this project solve?"
                className="auth-input resize-none"
                disabled={isPending}
              />
            </div>

            <div>
              <label className="auth-label">Proposed Solution Summary</label>
              <textarea
                rows={3}
                value={proposedSolution}
                onChange={e => setProposedSolution(e.target.value)}
                placeholder="How will you solve the problem?"
                className="auth-input resize-none"
                disabled={isPending}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="auth-label">Estimated Cost</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={estimatedCost}
                  onChange={e => setEstimatedCost(e.target.value)}
                  placeholder="0.00"
                  className="auth-input"
                  disabled={isPending}
                />
              </div>
              <div>
                <label className="auth-label">Estimated Benefit / ROI</label>
                <input
                  type="text"
                  value={estimatedBenefit}
                  onChange={e => setEstimatedBenefit(e.target.value)}
                  placeholder="e.g., $100,000 / yr or 12 mo payback"
                  className="auth-input"
                  disabled={isPending}
                />
              </div>
            </div>

            <div>
              <label className="auth-label">Recommendation</label>
              <textarea
                rows={3}
                value={recommendation}
                onChange={e => setRecommendation(e.target.value)}
                placeholder="Final verdict and next steps..."
                className="auth-input resize-none"
                disabled={isPending}
              />
            </div>
          </form>

          <div className="shrink-0 px-6 py-4 border-t border-app-border bg-app-muted-surface flex justify-end gap-3 rounded-b-2xl">
            <button type="button" onClick={onClose} disabled={isPending} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" form="bc-form" disabled={isPending} className="btn-primary">
              <Save className="w-4 h-4 mr-2" />
              {isPending ? 'Saving...' : 'Save Business Case'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

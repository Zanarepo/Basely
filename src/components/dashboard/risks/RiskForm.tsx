'use client'

import { useEffect } from 'react'
import { X, Save, AlertTriangle } from 'lucide-react'
import type { Risk } from './useRiskData'
import { getCurrencySymbol, formatCurrency } from '@/lib/utils'
import { CommentThread } from '@/components/dashboard/collaboration/CommentThread'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'
import { useRiskForm } from './hooks/useRiskForm'

interface RiskFormProps {
  projectId: string
  workspaceMembers: { userId: string; name: string; email: string; role: string }[]
  stakeholders: any[]
  existingRisk: Risk | null
  onClose: () => void
  onSuccess: () => void
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void
  scrollToComments?: boolean
}

export default function RiskForm({
  projectId,
  workspaceMembers,
  stakeholders,
  existingRisk,
  onClose,
  onSuccess,
  onShowToast,
  scrollToComments = false
}: RiskFormProps) {
  const {
    title, setTitle,
    description, setDescription,
    probability, setProbability,
    impact, setImpact,
    responseStrategy, setResponseStrategy,
    mitigationPlan, setMitigationPlan,
    status, setStatus,
    ownerId, setOwnerId,
    allocatedAmount, setAllocatedAmount,
    linkedWbsId, setLinkedWbsId,
    wbsSearch, setWbsSearch,
    isWbsDropdownOpen, setIsWbsDropdownOpen,
    wbsElements,
    projectContingency,
    projectCurrency,
    isSubmitting,
    currentUserId,
    riskScore,
    totalAllocated,
    isOverAllocated,
    handleSubmit
  } = useRiskForm(projectId, existingRisk, onSuccess, onShowToast)

  useEffect(() => {
    if (scrollToComments && existingRisk) {
      setTimeout(() => {
        document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [scrollToComments, existingRisk])

  return (
    <>
      <div className="fixed inset-0 bg-app-bg/50 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-app-surface border-l border-app-border shadow-2xl flex flex-col animate-fade-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-app-border bg-app-surface-solid shrink-0">
          <div>
            <h2 className="text-lg font-bold text-app-fg">
              {existingRisk ? 'Edit Risk' : 'Log New Risk'}
            </h2>
            <p className="text-sm text-app-muted mt-1">
              Capture probability, impact, and assign an owner.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-app-muted hover:text-app-fg hover:bg-app-hover rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <form id="risk-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-app-fg mb-1.5">
                Risk Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Supply chain delays"
                required
                className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-app-fg mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Details about the risk..."
                className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
              />
            </div>

            {/* Scoring */}
            <div className="p-4 bg-app-bg rounded-lg border border-app-border space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-app-fg">Risk Assessment</h3>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  riskScore >= 15 ? 'bg-red-500/10 text-red-500' : 
                  riskScore >= 8 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                }`}>
                  Score: {riskScore}
                </span>
              </div>
              
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label className="font-medium text-app-fg">Probability (1-5)</label>
                  <span className="text-app-muted">{probability}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={probability}
                  onChange={(e) => setProbability(Number(e.target.value))}
                  className="w-full accent-violet-500"
                />
              </div>
              
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label className="font-medium text-app-fg">Impact (1-5)</label>
                  <span className="text-app-muted">{impact}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={impact}
                  onChange={(e) => setImpact(Number(e.target.value))}
                  className="w-full accent-violet-500"
                />
              </div>
            </div>

            {/* Strategy & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-app-fg mb-1.5">Strategy</label>
                <EnterpriseSelect
                  value={responseStrategy}
                  onChange={(val) => setResponseStrategy(val)}
                  options={[
                    { value: 'Avoid', label: 'Avoid', description: 'Change plans to avoid risk entirely' },
                    { value: 'Mitigate', label: 'Mitigate', description: 'Reduce impact or likelihood' },
                    { value: 'Transfer', label: 'Transfer', description: 'Shift liability to third party' },
                    { value: 'Accept', label: 'Accept', description: 'Acknowledge and manage' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-app-fg mb-1.5">Status</label>
                <EnterpriseSelect
                  value={status}
                  onChange={(val) => setStatus(val)}
                  options={[
                    { value: 'Identified', label: 'Identified', description: 'Newly documented risk' },
                    { value: 'Monitoring', label: 'Monitoring', description: 'Under active observation' },
                    { value: 'Mitigating', label: 'Mitigating', description: 'Mitigation plan in effect' },
                    { value: 'Occurred', label: 'Occurred', description: 'Risk event triggered' },
                    { value: 'Closed', label: 'Closed', description: 'Risk resolved or expired' },
                  ]}
                />
              </div>
            </div>

            {/* Mitigation Plan */}
            <div>
              <label className="block text-sm font-semibold text-app-fg mb-1.5">Mitigation Plan / Strategy Details</label>
              <textarea
                value={mitigationPlan}
                onChange={(e) => setMitigationPlan(e.target.value)}
                rows={4}
                placeholder="Describe the actionable steps and strategies planned to mitigate or address this risk..."
                className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
              />
            </div>

            {/* Owner */}
            <div>
              <label className="block text-sm font-semibold text-app-fg mb-1.5">Risk Owner</label>
              <EnterpriseSelect
                value={ownerId}
                onChange={(val) => setOwnerId(val)}
                placeholder="Unassigned"
                options={[
                  { value: '', label: 'Unassigned', description: 'No designated owner yet' },
                  ...stakeholders.map((st) => ({
                    value: st.id,
                    label: st.name,
                    description: st.role_title ? `Role: ${st.role_title}` : 'Project Stakeholder'
                  }))
                ]}
              />
              <p className="text-xs text-app-muted mt-1.5">Assign an owner from the project stakeholder register.</p>
            </div>

            {/* WBS Link - Searchable Dropdown */}
            <div className="relative">
              <label className="block text-sm font-semibold text-app-fg mb-1.5">Linked WBS Element</label>
              <div 
                className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-fg cursor-pointer flex justify-between items-center"
                onClick={() => setIsWbsDropdownOpen(!isWbsDropdownOpen)}
              >
                <span className="truncate">
                  {linkedWbsId ? wbsElements.find(e => e.id === linkedWbsId)?.name || 'Unknown' : 'None (Project Level Risk)'}
                </span>
                <span className="text-xs">▼</span>
              </div>
              
              {isWbsDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-app-surface-solid border border-app-border rounded-lg shadow-2xl max-h-60 overflow-y-auto">
                  <div className="p-2 border-b border-app-border sticky top-0 bg-app-surface-solid z-20">
                    <input
                      type="text"
                      placeholder="Search WBS..."
                      value={wbsSearch}
                      onChange={(e) => setWbsSearch(e.target.value)}
                      className="w-full px-2 py-1 text-sm bg-app-bg border border-app-border rounded-md focus:outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div 
                    className="px-3 py-2 text-sm hover:bg-app-hover cursor-pointer text-app-muted italic"
                    onClick={() => { setLinkedWbsId(''); setIsWbsDropdownOpen(false); }}
                  >
                    None (Project Level Risk)
                  </div>
                  
                  {/* Group WBS Elements */}
                  {(() => {
                    const filtered = wbsElements.filter(e => e.name.toLowerCase().includes(wbsSearch.toLowerCase()) || e.code.toLowerCase().includes(wbsSearch.toLowerCase()))
                    const summaryElements = filtered.filter(e => !e.is_work_package)
                    const standaloneWPs = filtered.filter(e => e.is_work_package && !summaryElements.find(s => s.id === e.parent_id))
                    
                    return (
                      <>
                        {summaryElements.map(summary => (
                          <div key={summary.id}>
                            <div 
                              className={`px-3 py-2 text-sm hover:bg-app-hover cursor-pointer font-bold text-app-fg ${linkedWbsId === summary.id ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/30' : ''}`}
                              onClick={() => { setLinkedWbsId(summary.id); setIsWbsDropdownOpen(false); }}
                            >
                              {summary.code} - {summary.name}
                            </div>
                            {wbsElements
                              .filter(wp => wp.parent_id === summary.id && wp.is_work_package && (wp.name.toLowerCase().includes(wbsSearch.toLowerCase()) || wp.code.toLowerCase().includes(wbsSearch.toLowerCase()) || summary.name.toLowerCase().includes(wbsSearch.toLowerCase())))
                              .map(wp => (
                                <div 
                                  key={wp.id}
                                  className={`px-3 py-2 pl-8 text-sm hover:bg-app-hover cursor-pointer text-app-fg ${linkedWbsId === wp.id ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/30' : ''}`}
                                  onClick={() => { setLinkedWbsId(wp.id); setIsWbsDropdownOpen(false); }}
                                >
                                  {wp.code} - {wp.name}
                                </div>
                            ))}
                          </div>
                        ))}
                        {standaloneWPs.map(wp => (
                           <div 
                            key={wp.id}
                            className={`px-3 py-2 text-sm hover:bg-app-hover cursor-pointer text-app-fg ${linkedWbsId === wp.id ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/30' : ''}`}
                            onClick={() => { setLinkedWbsId(wp.id); setIsWbsDropdownOpen(false); }}
                          >
                            {wp.code} - {wp.name}
                          </div>
                        ))}
                      </>
                    )
                  })()}
                </div>
              )}
            </div>

            {/* Contingency */}
            <div className="p-4 bg-app-bg rounded-lg border border-app-border space-y-3">
              <h3 className="text-sm font-bold text-app-fg">Contingency Allocation</h3>
              <div>
                <label className="block text-xs font-medium text-app-fg mb-1">
                  Earmark Reserve Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted text-sm">{getCurrencySymbol(projectCurrency)}</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={allocatedAmount}
                    onChange={(e) => setAllocatedAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 bg-app-surface border border-app-border rounded-lg text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                </div>
              </div>
              
              {isOverAllocated && (
                <div className="flex items-start gap-2 p-2 bg-amber-500/10 rounded-md border border-amber-500/20 text-amber-700 dark:text-amber-500 text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>
                    Warning: Allocating this amount brings total allocated contingency ({formatCurrency(totalAllocated, projectCurrency)}) over the project's total reserve ({formatCurrency(projectContingency, projectCurrency)}). This action will not be blocked.
                  </p>
                </div>
              )}
            </div>

          </form>

          {existingRisk && (
            <div id="comments-section" className="mt-8 border-t border-app-border pt-6">
              <CommentThread 
                projectId={projectId}
                entityType="risk"
                entityId={existingRisk.id}
                stakeholders={stakeholders}
                workspaceMembers={workspaceMembers}
                currentUserId={currentUserId}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-app-border bg-app-surface-solid flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-app-muted hover:text-app-fg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="risk-form"
            disabled={isSubmitting || !title.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-violet-500 text-white text-sm font-semibold rounded-lg hover:bg-violet-600 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Saving...' : 'Save Risk'}
          </button>
        </div>
      </div>
    </>
  )
}

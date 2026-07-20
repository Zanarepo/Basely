'use client'

import { useState, useEffect } from 'react'
import { X, Save, AlertTriangle, ShieldAlert } from 'lucide-react'
import type { Risk } from './useRiskData'
import { createRisk, updateRisk } from '@/lib/risks/actions'
import { createClient } from '@/utils/supabase/client'
import { CurrencyDisplay } from '@/components/CurrencyDisplay'
import { getCurrencySymbol, formatCurrency } from '@/lib/utils'

interface RiskFormProps {
  projectId: string
  workspaceMembers: { userId: string; name: string; email: string; role: string }[]
  stakeholders: any[]
  existingRisk: Risk | null
  onClose: () => void
  onSuccess: () => void
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void
}

export default function RiskForm({
  projectId,
  workspaceMembers,
  stakeholders,
  existingRisk,
  onClose,
  onSuccess,
  onShowToast,
}: RiskFormProps) {
  const [title, setTitle] = useState(existingRisk?.title || '')
  const [description, setDescription] = useState(existingRisk?.description || '')
  const [probability, setProbability] = useState<number>(existingRisk?.probability || 3)
  const [impact, setImpact] = useState<number>(existingRisk?.impact || 3)
  const [responseStrategy, setResponseStrategy] = useState<string>(existingRisk?.response_strategy || 'Mitigate')
  const [status, setStatus] = useState<string>(existingRisk?.status || 'Identified')
  const [ownerId, setOwnerId] = useState<string>(existingRisk?.owner_stakeholder_id || '')
  const [allocatedAmount, setAllocatedAmount] = useState<string>(existingRisk?.allocated_contingency_amount?.toString() || '')
  const [linkedWbsId, setLinkedWbsId] = useState<string>(existingRisk?.linked_wbs_element_id || '')
  const [wbsSearch, setWbsSearch] = useState('')
  const [isWbsDropdownOpen, setIsWbsDropdownOpen] = useState(false)
  
  const [wbsElements, setWbsElements] = useState<{ id: string; name: string; is_work_package: boolean; parent_id: string | null; code: string }[]>([])
  const [projectContingency, setProjectContingency] = useState<number>(0)
  const [projectCurrency, setProjectCurrency] = useState<string>('USD')
  const [otherRisksAllocated, setOtherRisksAllocated] = useState<number>(0)
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  const riskScore = probability * impact

  useEffect(() => {
    // Fetch WBS Elements and Project Contingency Data
    const fetchData = async () => {
      const supabase = createClient()
      
      const [wbsRes, projRes, risksRes] = await Promise.all([
        supabase.from('wbs_elements').select('id, name, is_work_package, parent_id, code').eq('project_id', projectId).order('sort_order'),
        supabase.from('projects').select('contingency_amount, contingency_type, currency').eq('id', projectId).single(),
        supabase.from('risks').select('id, allocated_contingency_amount').eq('project_id', projectId)
      ])

      if (wbsRes.data) setWbsElements(wbsRes.data)
      
      if (projRes.data) {
        // For simplicity, we are assuming flat amount for this calculation, 
        // or we'd need total budget to calculate percentage contingency.
        // We'll just display whatever numerical value is stored.
        setProjectContingency(projRes.data.contingency_amount || 0)
        setProjectCurrency(projRes.data.currency || 'USD')
      }

      if (risksRes.data) {
        let sum = 0
        risksRes.data.forEach(r => {
          if (r.id !== existingRisk?.id && r.allocated_contingency_amount) {
            sum += Number(r.allocated_contingency_amount)
          }
        })
        setOtherRisksAllocated(sum)
      }
    }
    
    fetchData()
  }, [projectId, existingRisk])

  const currentAllocation = Number(allocatedAmount) || 0
  const totalAllocated = otherRisksAllocated + currentAllocation
  const isOverAllocated = projectContingency > 0 && totalAllocated > projectContingency

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    const data = {
      title,
      description: description || null,
      probability,
      impact,
      response_strategy: responseStrategy || null,
      status,
      owner_stakeholder_id: ownerId || null,
      allocated_contingency_amount: currentAllocation > 0 ? currentAllocation : null,
      linked_wbs_element_id: linkedWbsId || null,
    }

    const result = existingRisk
      ? await updateRisk(existingRisk.id, projectId, data)
      : await createRisk(projectId, data)

    setIsSubmitting(false)

    if (result.ok) {
      onSuccess()
    } else {
      onShowToast?.('error', `Failed to save risk: ${result.error}`)
    }
  }

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
                className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
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
                className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
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
                  className="w-full accent-indigo-500"
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
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>

            {/* Strategy & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-app-fg mb-1.5">Strategy</label>
                <select
                  value={responseStrategy}
                  onChange={(e) => setResponseStrategy(e.target.value)}
                  className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="Avoid">Avoid</option>
                  <option value="Mitigate">Mitigate</option>
                  <option value="Transfer">Transfer</option>
                  <option value="Accept">Accept</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-app-fg mb-1.5">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="Identified">Identified</option>
                  <option value="Monitoring">Monitoring</option>
                  <option value="Mitigating">Mitigating</option>
                  <option value="Occurred">Occurred</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Owner */}
            <div>
              <label className="block text-sm font-semibold text-app-fg mb-1.5">Risk Owner</label>
              <select
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="w-full px-3 py-2 bg-app-bg border border-app-border rounded-lg text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="">Unassigned</option>
                {stakeholders.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} {st.role_title ? `(${st.role_title})` : ''}
                  </option>
                ))}
              </select>
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
                              className={`px-3 py-2 text-sm hover:bg-app-hover cursor-pointer font-bold text-app-fg ${linkedWbsId === summary.id ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30' : ''}`}
                              onClick={() => { setLinkedWbsId(summary.id); setIsWbsDropdownOpen(false); }}
                            >
                              {summary.code} - {summary.name}
                            </div>
                            {wbsElements
                              .filter(wp => wp.parent_id === summary.id && wp.is_work_package && (wp.name.toLowerCase().includes(wbsSearch.toLowerCase()) || wp.code.toLowerCase().includes(wbsSearch.toLowerCase()) || summary.name.toLowerCase().includes(wbsSearch.toLowerCase())))
                              .map(wp => (
                                <div 
                                  key={wp.id}
                                  className={`px-3 py-2 pl-8 text-sm hover:bg-app-hover cursor-pointer text-app-fg ${linkedWbsId === wp.id ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30' : ''}`}
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
                            className={`px-3 py-2 text-sm hover:bg-app-hover cursor-pointer text-app-fg ${linkedWbsId === wp.id ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30' : ''}`}
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
                    className="w-full pl-7 pr-3 py-2 bg-app-surface border border-app-border rounded-lg text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
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
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white text-sm font-semibold rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Saving...' : 'Save Risk'}
          </button>
        </div>
      </div>
    </>
  )
}

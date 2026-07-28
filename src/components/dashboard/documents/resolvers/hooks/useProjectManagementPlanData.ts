'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'

export interface SubPlanSummary {
  type: string
  title: string
  category: string
  description: string
  isGenerated: boolean
  documentId?: string
  lastUpdated?: string
  keyHighlights: string[]
  tabTarget: string
}

export interface ProjectManagementPlanData {
  subPlans: SubPlanSummary[]
  generatedCount: number
  totalSubPlans: number
  loading: boolean
  error?: string
  refetch: () => Promise<void>
}

const SUB_PLAN_DEFINITIONS: { type: string; title: string; category: string; description: string; tab: string }[] = [
  { type: 'scope_statement', title: 'Scope Statement & Deliverables', category: 'Planning', description: 'Defines project boundaries, project deliverables, requirements, and exclusions.', tab: 'scope_statement' },
  { type: 'schedule_document', title: 'Project Schedule Document', category: 'Planning', description: 'Narrative baseline schedule, key milestone dates, and critical path analysis.', tab: 'schedule_document' },
  { type: 'budget_baseline', title: 'Budget Baseline Document', category: 'Cost & Baseline', description: 'Time-phased cost estimates, work package allocations, and contingency reserves.', tab: 'budget_baseline' },
  { type: 'risk_register', title: 'Risk Register & Mitigations', category: 'Registers', description: 'Identified risk profile, response strategies, probability/impact scores, and risk owners.', tab: 'risk_register' },
  { type: 'communication_plan', title: 'Communication Management Plan', category: 'Planning', description: 'Stakeholder communication cadences, information channels, and messaging frequency.', tab: 'communication_plan' },
  { type: 'raci', title: 'Resource & RACI Matrix', category: 'Core Documents', description: 'Operational governance outlining Responsible, Accountable, Consulted, and Informed roles.', tab: 'raci' },
  { type: 'quality_management_plan', title: 'Quality Management Plan', category: 'Planning', description: 'Quality standard tolerances, audit compliance checkpoints, and defect control procedures.', tab: 'quality_management_plan' },
  { type: 'procurement_plan', title: 'Procurement Management Plan', category: 'Planning', description: 'Vendor acquisition contracts, make-or-buy decisions, and solicitation milestones.', tab: 'procurement_plan' },
  { type: 'change_management_plan', title: 'Change Management Plan', category: 'Governance', description: 'Process governing scope/schedule/cost variations, approval thresholds, and escalation rules.', tab: 'change_management_plan' }
]

export function useProjectManagementPlanData(projectId: string, periodEnd?: Date, frozenData?: any): ProjectManagementPlanData {
  const [loading, setLoading] = useState(!frozenData)
  const [subPlans, setSubPlans] = useState<SubPlanSummary[]>(frozenData?.subPlans || [])
  const [error, setError] = useState<string>()

  const loadData = useCallback(async () => {
    if (frozenData) {
      setSubPlans(frozenData.subPlans || [])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(undefined)

    try {
      const supabase = createClient()

      // Fetch generated documents for all sub-plans
      const docTypes = SUB_PLAN_DEFINITIONS.map(d => d.type)
      const { data: generatedDocs } = await supabase
        .from('generated_documents')
        .select('id, document_type, free_text_content, updated_at, is_snapshot')
        .eq('project_id', projectId)
        .in('document_type', docTypes)
        .eq('is_snapshot', false)

      // Fetch live project data counts for robust highlight generation
      const [risksRes, wbsRes, actRes, commRes] = await Promise.all([
        supabase.from('risks').select('id, status', { count: 'exact' }).eq('project_id', projectId),
        supabase.from('wbs_elements').select('id, budget', { count: 'exact' }).eq('project_id', projectId),
        supabase.from('activities').select('id, status', { count: 'exact' }).eq('project_id', projectId),
        supabase.from('stakeholders').select('id', { count: 'exact' }).eq('project_id', projectId)
      ])

      const totalRisks = risksRes.count || (risksRes.data || []).length
      const totalWbs = wbsRes.count || (wbsRes.data || []).length
      const totalTasks = actRes.count || (actRes.data || []).length
      const totalStakeholders = commRes.count || (commRes.data || []).length

      const sumBudget = (wbsRes.data || []).reduce((acc, curr) => acc + Number(curr.budget || 0), 0)

      const summaries: SubPlanSummary[] = SUB_PLAN_DEFINITIONS.map(def => {
        const doc = (generatedDocs || []).find(d => d.document_type === def.type)
        const isGenerated = Boolean(doc)

        const highlights: string[] = []

        if (isGenerated && doc?.free_text_content) {
          const firstKey = Object.keys(doc.free_text_content)[0]
          if (firstKey && doc.free_text_content[firstKey]) {
            const excerpt = doc.free_text_content[firstKey].slice(0, 95) + (doc.free_text_content[firstKey].length > 95 ? '...' : '')
            highlights.push(`Summary Excerpt: "${excerpt}"`)
          }
        }

        if (def.type === 'risk_register') highlights.push(`Active Risk Log Count: ${totalRisks} identified risks`)
        if (def.type === 'budget_baseline') highlights.push(`Baseline Allocation: $${sumBudget.toLocaleString()}`)
        if (def.type === 'schedule_document') highlights.push(`Tracked Schedule Tasks: ${totalTasks} schedule items`)
        if (def.type === 'raci') highlights.push(`RACI Governance: Tied to ${totalStakeholders} project roles & stakeholders`)
        if (def.type === 'scope_statement') highlights.push(`WBS Deliverable Coverage: ${totalWbs} structural packages`)
        
        if (highlights.length === 0) {
          highlights.push('Standard organizational governance policies and baselines apply.')
        }

        return {
          type: def.type,
          title: def.title,
          category: def.category,
          description: def.description,
          isGenerated,
          documentId: doc?.id,
          lastUpdated: doc?.updated_at,
          keyHighlights: highlights,
          tabTarget: def.tab
        }
      })

      setSubPlans(summaries)
    } catch (err: any) {
      console.error('Error fetching master PM plan data:', err)
      setError('Could not aggregate master project management sub-plans.')
    } finally {
      setLoading(false)
    }
  }, [projectId, frozenData])

  useEffect(() => {
    loadData()
  }, [loadData])

  const generatedCount = subPlans.filter(p => p.isGenerated).length
  const totalSubPlans = SUB_PLAN_DEFINITIONS.length

  return {
    subPlans,
    generatedCount,
    totalSubPlans,
    loading,
    error,
    refetch: loadData
  }
}

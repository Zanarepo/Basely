import { useState, useEffect } from 'react'
import type { Risk } from '../useRiskData'
import { createRisk, updateRisk } from '@/lib/risks/actions'
import { createClient } from '@/utils/supabase/client'

export function useRiskForm(
  projectId: string,
  existingRisk: Risk | null,
  onSuccess: () => void,
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void
) {
  const [title, setTitle] = useState(existingRisk?.title || '')
  const [description, setDescription] = useState(existingRisk?.description || '')
  const [probability, setProbability] = useState<number>(existingRisk?.probability || 3)
  const [impact, setImpact] = useState<number>(existingRisk?.impact || 3)
  const [responseStrategy, setResponseStrategy] = useState<string>(existingRisk?.response_strategy || 'Mitigate')
  const [mitigationPlan, setMitigationPlan] = useState(existingRisk?.mitigation_plan || '')
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
  const [currentUserId, setCurrentUserId] = useState<string>('')

  useEffect(() => {
    const fetchUserId = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      if (data?.user) setCurrentUserId(data.user.id)
    }
    fetchUserId()
  }, [])

  const riskScore = probability * impact

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      
      const [wbsRes, projRes, risksRes] = await Promise.all([
        supabase.from('wbs_elements').select('id, name, is_work_package, parent_id, code').eq('project_id', projectId).order('sort_order'),
        supabase.from('projects').select('contingency_amount, contingency_type, currency').eq('id', projectId).single(),
        supabase.from('risks').select('id, allocated_contingency_amount').eq('project_id', projectId)
      ])

      if (wbsRes.data) setWbsElements(wbsRes.data)
      
      if (projRes.data) {
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
      mitigation_plan: mitigationPlan || null,
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

  return {
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
  }
}

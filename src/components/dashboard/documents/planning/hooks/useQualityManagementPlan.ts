import { useState, useEffect } from 'react'
import { 
  getQualityManagementPlan, 
  upsertQualityManagementPlan, 
  upsertQualityStandard, 
  deleteQualityStandard,
  QualityManagementPlan,
  QualityStandard
} from '@/lib/planning/quality-actions'

export function useQualityManagementPlan(projectId: string) {
  const [plan, setPlan] = useState<QualityManagementPlan | null>(null)
  const [standards, setStandards] = useState<QualityStandard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    const res = await getQualityManagementPlan(projectId)
    if (res.error) {
      setError(res.error)
    } else {
      if (res.plan) setPlan(res.plan)
      setStandards(res.standards || [])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [projectId])

  const savePlanDetails = async (reviewCadence: string) => {
    setIsSaving(true)
    const res = await upsertQualityManagementPlan(projectId, reviewCadence)
    setIsSaving(false)
    if (res.error) {
      setError(res.error)
      return res.error
    } else if (res.plan) {
      setPlan(res.plan)
    }
  }

  const saveStandard = async (standard: Partial<QualityStandard>) => {
    if (!plan) return 'No plan exists yet. Please set the review cadence first.'
    setIsSaving(true)
    const res = await upsertQualityStandard(plan.id, standard)
    setIsSaving(false)
    if (res.error) {
      setError(res.error)
      return res.error
    } else if (res.standard) {
      if (standard.id) {
        setStandards(prev => prev.map(s => s.id === standard.id ? res.standard : s))
      } else {
        setStandards(prev => [...prev, res.standard])
      }
    }
  }

  const removeStandard = async (standardId: string) => {
    setIsSaving(true)
    const res = await deleteQualityStandard(standardId)
    if (res.error) {
      setError(res.error)
    } else {
      setStandards(prev => prev.filter(s => s.id !== standardId))
    }
    setIsSaving(false)
  }

  return {
    plan,
    standards,
    isLoading,
    isSaving,
    error,
    savePlanDetails,
    saveStandard,
    removeStandard,
    refresh: loadData
  }
}

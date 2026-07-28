'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'

export interface WorkPackageCostItem {
  id: string
  name: string
  wbs_code: string
  budget: number
  estimation_method?: string
  rate?: number
  quantity?: number
  currency: string
  reconciliation_status: string
  time_phases?: {
    id: string
    period_start_date: string
    period_end_date: string
    planned_amount: number
  }[]
}

export interface BudgetBaselineData {
  workPackages: WorkPackageCostItem[]
  contingencyAmount: number
  totalProjectBudget: number
  latestBaseline?: {
    id: string
    name: string
    saved_at: string
  } | null
  loading: boolean
  error?: string
  refetch: () => Promise<void>
}

export function useBudgetBaselineData(projectId: string, periodEnd?: Date, frozenData?: any): BudgetBaselineData {
  const [loading, setLoading] = useState(!frozenData)
  const [workPackages, setWorkPackages] = useState<WorkPackageCostItem[]>(frozenData?.workPackages || [])
  const [contingencyAmount, setContingencyAmount] = useState<number>(frozenData?.contingencyAmount || 0)
  const [totalProjectBudget, setTotalProjectBudget] = useState<number>(frozenData?.totalProjectBudget || 0)
  const [latestBaseline, setLatestBaseline] = useState<any>(frozenData?.latestBaseline || null)
  const [error, setError] = useState<string>()

  const loadData = useCallback(async () => {
    if (frozenData) {
      setWorkPackages(frozenData.workPackages || [])
      setContingencyAmount(frozenData.contingencyAmount || 0)
      setTotalProjectBudget(frozenData.totalProjectBudget || 0)
      setLatestBaseline(frozenData.latestBaseline || null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(undefined)

    try {
      const supabase = createClient()

      // 1. Fetch project contingency
      const { data: projectData } = await supabase
        .from('projects')
        .select('contingency_amount')
        .eq('id', projectId)
        .maybeSingle()

      const contingency = Number(projectData?.contingency_amount || 0)
      setContingencyAmount(contingency)

      // 2. Fetch WBS Elements (prioritize work packages, but load all with budgets)
      const { data: wbsElements } = await supabase
        .from('wbs_elements')
        .select('id, name, code, budget, is_work_package')
        .eq('project_id', projectId)
        .order('code', { ascending: true })

      const elementIds = (wbsElements || []).map(w => w.id)

      // 3. Fetch Cost Accounts for these WBS elements
      let costAccounts: any[] = []
      let timePhases: any[] = []

      if (elementIds.length > 0) {
        const { data: caData } = await supabase
          .from('cost_accounts')
          .select('*')
          .in('wbs_element_id', elementIds)
        if (caData) costAccounts = caData

        const caIds = costAccounts.map(ca => ca.id)
        if (caIds.length > 0) {
          const { data: tpData } = await supabase
            .from('time_phase_entries')
            .select('*')
            .in('cost_account_id', caIds)
            .order('period_start_date', { ascending: true })
          if (tpData) timePhases = tpData
        }
      }

      // 4. Fetch latest budget baseline record if any
      const { data: baselineData } = await supabase
        .from('budget_baselines')
        .select('id, name, saved_at')
        .eq('project_id', projectId)
        .order('saved_at', { ascending: false })
        .limit(1)

      setLatestBaseline(baselineData && baselineData.length > 0 ? baselineData[0] : null)

      // Combine WBS elements and cost accounts into items
      const items: WorkPackageCostItem[] = (wbsElements || []).map(w => {
        const ca = costAccounts.find(c => c.wbs_element_id === w.id)
        const itemPhases = ca ? timePhases.filter(t => t.cost_account_id === ca.id) : []

        const budgetValue = ca ? Number(ca.budgeted_total) : Number(w.budget || 0)

        return {
          id: w.id,
          name: w.name,
          wbs_code: w.code || 'N/A',
          budget: budgetValue,
          estimation_method: ca?.estimation_method || 'bottom_up',
          rate: ca ? Number(ca.rate) : undefined,
          quantity: ca ? Number(ca.quantity) : undefined,
          currency: ca?.currency || 'USD',
          reconciliation_status: ca?.reconciliation_status || 'reconciled',
          time_phases: itemPhases.map(tp => ({
            id: tp.id,
            period_start_date: tp.period_start_date,
            period_end_date: tp.period_end_date,
            planned_amount: Number(tp.planned_amount)
          }))
        }
      })

      setWorkPackages(items)

      const sumBudgets = items.reduce((acc, curr) => acc + (curr.budget || 0), 0)
      setTotalProjectBudget(sumBudgets + contingency)
    } catch (err: any) {
      console.error('Error fetching budget baseline data:', err)
      setError('Failed to load budget data.')
    } finally {
      setLoading(false)
    }
  }, [projectId, periodEnd, frozenData])

  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    workPackages,
    contingencyAmount,
    totalProjectBudget,
    latestBaseline,
    loading,
    error,
    refetch: loadData
  }
}

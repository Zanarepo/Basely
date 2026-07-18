import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { CostAccount, TimePhaseEntry, BudgetBaseline, BaselineCostSnapshot, WbsCostData } from '@/lib/cost/types'

export function useCostData(projectId: string) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [wbsCostData, setWbsCostData] = useState<WbsCostData[]>([])
  const [baselines, setBaselines] = useState<BudgetBaseline[]>([])
  const [resourceRates, setResourceRates] = useState<any[]>([])
  const [contingencyAmount, setContingencyAmount] = useState<number>(0)
  const [contingencyType, setContingencyType] = useState<'flat' | 'percentage'>('flat')
  const [projectCurrency, setProjectCurrency] = useState<string>('USD')
  const [globalOverhead, setGlobalOverhead] = useState<number>(0)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()

    try {
      // Fetch project details for contingency
      const { data: project, error: pError } = await supabase
        .from('projects')
        .select('contingency_amount, contingency_type, currency, global_overhead_percentage')
        .eq('id', projectId)
        .single()
        
      if (pError) throw pError
      setContingencyAmount(project.contingency_amount || 0)
      setContingencyType(project.contingency_type || 'flat')
      setProjectCurrency(project.currency || 'USD')
      setGlobalOverhead(project.global_overhead_percentage || 0)

      // Fetch all WBS Elements
      const { data: wbs, error: wError } = await supabase
        .from('wbs_elements')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true })
        
      if (wError) throw wError

      // Fetch all cost accounts for this project
      const { data: costAccounts, error: cError } = await supabase
        .from('cost_accounts')
        .select('*')
        .in('wbs_element_id', wbs.map(w => w.id))
        
      if (cError) throw cError

      // Fetch all time phase entries
      const { data: timePhases, error: tError } = await supabase
        .from('time_phase_entries')
        .select('*')
        .in('cost_account_id', costAccounts.map(c => c.id))
        
      if (tError) throw tError

      // Fetch baselines
      const { data: bData, error: bError } = await supabase
        .from('budget_baselines')
        .select('*')
        .eq('project_id', projectId)
        .order('saved_at', { ascending: false })
        
      if (bError) throw bError
      setBaselines(bData || [])

      // Fetch Resource Rates
      const { data: ratesData, error: rError } = await supabase
        .from('resource_rates')
        .select('*')
        .eq('project_id', projectId)

      if (rError) throw rError
      setResourceRates(ratesData || [])

      // Fetch Assignments
      const { data: assignmentsData, error: aError } = await supabase
        .from('activity_resource_assignments')
        .select('*, resource:resource_rates(*)')
        .in('wbs_element_id', wbs.map(w => w.id))

      if (aError) throw aError

      // Merge into WbsCostData
      const merged: WbsCostData[] = wbs.map(element => {
        const ca = costAccounts.find(c => c.wbs_element_id === element.id) || null
        const tps = ca ? timePhases.filter(t => t.cost_account_id === ca.id) : []
        const assigns = (assignmentsData || []).filter(a => a.wbs_element_id === element.id)

        return {
          wbsId: element.id,
          wbsName: element.name,
          wbsCode: element.code,
          parentId: element.parent_id,
          isWorkPackage: element.is_work_package,
          costAccount: ca,
          timePhaseEntries: tps,
          resourceAssignments: assigns
        }
      })

      setWbsCostData(merged)
    } catch (err: any) {
      console.error("Error fetching cost data:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return {
    loading,
    error,
    wbsCostData,
    baselines,
    resourceRates,
    contingencyAmount,
    contingencyType,
    projectCurrency,
    globalOverhead,
    refresh: fetchAll
  }
}

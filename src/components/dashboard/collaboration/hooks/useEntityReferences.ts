import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export type ProjectEntity = {
  id: string
  title: string
  type: 'wbs' | 'risk' | 'issue' | 'raci' | 'charter' | 'stakeholders' | 'cost_estimation' | 'cost_resources' | 'cost_timephasing' | 'cost_baselines' | 'cost_actuals' | 'gantt' | 'wbs_board' | 'wbs_grid' | 'wbs_unassigned'
}

export function useEntityReferences(projectId: string) {
  const [entities, setEntities] = useState<ProjectEntity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEntities() {
      if (!projectId) return
      const supabase = createClient()
      
      const [wbsRes, risksRes, issuesRes] = await Promise.all([
        supabase.from('wbs_elements').select('id, name').eq('project_id', projectId).order('created_at', { ascending: true }),
        supabase.from('risks').select('id, title').eq('project_id', projectId).order('created_at', { ascending: false }),
        supabase.from('issues').select('id, title').eq('project_id', projectId).order('created_at', { ascending: false })
      ])

      const fetched: ProjectEntity[] = []

      if (wbsRes.data) {
        fetched.push(...wbsRes.data.map(item => ({ id: item.id, title: item.name, type: 'wbs' as const })))
      }
      if (risksRes.data) {
        fetched.push(...risksRes.data.map(item => ({ id: item.id, title: item.title, type: 'risk' as const })))
      }
      if (issuesRes.data) {
        fetched.push(...issuesRes.data.map(item => ({ id: item.id, title: item.title, type: 'issue' as const })))
      }
      
      fetched.push({ id: 'raci', title: 'RACI Matrix', type: 'raci' })
      fetched.push({ id: 'charter', title: 'Project Charter', type: 'charter' })
      fetched.push({ id: 'stakeholders', title: 'Stakeholder Register', type: 'stakeholders' })
      fetched.push({ id: 'gantt', title: 'Gantt & Scheduling', type: 'gantt' })
      fetched.push({ id: 'board', title: 'WBS Board', type: 'wbs_board' })
      fetched.push({ id: 'grid', title: 'WBS Grid', type: 'wbs_grid' })
      fetched.push({ id: 'unassigned', title: 'Unassigned Work', type: 'wbs_unassigned' })
      fetched.push({ id: 'estimation', title: 'Cost Estimations', type: 'cost_estimation' })
      fetched.push({ id: 'resources', title: 'Resource Rates', type: 'cost_resources' })
      fetched.push({ id: 'timephasing', title: 'Time-Phased (S-Curve)', type: 'cost_timephasing' })
      fetched.push({ id: 'baselines', title: 'Cost Baselines', type: 'cost_baselines' })
      fetched.push({ id: 'actuals', title: 'Cost Actuals', type: 'cost_actuals' })

      setEntities(fetched)
      setLoading(false)
    }

    fetchEntities()
  }, [projectId])

  return { entities, loading }
}

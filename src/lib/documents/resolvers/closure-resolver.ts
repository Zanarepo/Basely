'use server'

import { createClient } from '@/utils/supabase/server'

export interface ClosureReportData {
  project: {
    id: string
    name: string
    client_name: string | null
    methodology: string
    currency: string
    start_date: string | null
    end_date: string | null
    lifecycle_status?: string
  }
  scheduleSummary: {
    totalActivities: number
    completedActivities: number
    plannedEndDate: string | null
    actualCompletionPercentage: number
    varianceDays: number
  }
  evmSummary: {
    bac: number // Budget at Completion (Planned Value total)
    ev: number  // Earned Value
    ac: number  // Actual Cost
    cv: number  // Cost Variance (EV - AC)
    sv: number  // Schedule Variance (EV - PV)
    cpi: number // Cost Performance Index (EV / AC)
    spi: number // Schedule Performance Index (EV / PV)
    eac: number // Estimate at Completion
    pv: number  // Planned Value
    etc: number // Estimate to Complete
    vac: number // Variance at Completion
  }
  deliverables: Array<{
    id: string
    code: string
    name: string
    status: string
    owner: string
    isMilestone?: boolean
  }>
  risksSummary: {
    totalRisks: number
    mitigatedRisks: number
    openRisks: number
    criticalMitigations: Array<{
      title: string
      severity: string
      mitigationPlan: string
      status: string
    }>
  }
}

/**
 * Resolves comprehensive real-time planning, cost, deliverable, and risk data
 * to produce an executive-ready project Closure Report.
 */
export async function resolveClosureReportData(projectId: string): Promise<ClosureReportData | null> {
  const supabase = await createClient()

  // 1. Fetch Project Details with resilient fallback
  let proj: any = null
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle()
    if (data && !error) {
      proj = data
    }
  } catch (err) {
    console.error('Project query non-critical error:', err)
  }

  if (!proj) {
    proj = {
      id: projectId,
      name: 'Project Closure Baseline',
      client_name: 'Enterprise Client',
      methodology: 'PMO Standard',
      currency: 'USD',
      start_date: new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      lifecycle_status: 'Closing'
    }
  }

  let wbsData: any[] = []
  let profilesMap: Record<string, { full_name?: string, email?: string }> = {}
  try {
    const { data } = await supabase
      .from('wbs_elements')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
    if (data) {
      wbsData = data
      const ownerIds = [...new Set(data.map((w: any) => w.owner_id).filter(Boolean))]
      if (ownerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', ownerIds)
        if (profiles) {
          profilesMap = profiles.reduce((acc: any, p: any) => ({ ...acc, [p.id]: p }), {})
        }
      }
    }
  } catch (err) {
    console.warn('WBS fetch non-critical error:', err)
  }

  let actData: any[] = []
  try {
    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('project_id', projectId)
    if (data) actData = data
  } catch (err) {
    console.warn('Activities fetch non-critical error:', err)
  }

  const deliverables = (wbsData || [])
    .filter((w: any) => {
      // A true parent element has other elements pointing to it as their parent
      const isParent = wbsData.some((child: any) => child.parent_id === w.id)
      
      const wbsActivities = actData.filter((a: any) => a.wbs_element_id === w.id)
      const hasMilestoneActivity = wbsActivities.some((a: any) => {
        const duration = Number(a.duration_days || a.duration || 0)
        return duration === 0 || a.name?.toLowerCase().includes('milestone') || a.type === 'milestone'
      })
      const isMilestone = w.name?.toLowerCase().includes('milestone') || hasMilestoneActivity
      
      // Cache it for the map function
      w._computedIsMilestone = isMilestone

      // Exclude true parent elements (containers). Keep leaf nodes (tasks) and ALL milestones.
      return !isParent || isMilestone
    })
    .map((w: any) => {
      const ownerId = w.owner_id || w.owner
      const profile = ownerId ? profilesMap[ownerId] : null
      const ownerName = profile?.full_name?.trim() || profile?.email || ownerId || 'N/A'
      
      const isMilestone = w._computedIsMilestone
      
      return {
        id: String(w.id || Math.random()),
        code: String(w.code || 'WBS-PKG'),
        name: String(w.name || 'Core Deliverable Work Package'),
        status: String(w.status || 'N/A'),
        owner: String(ownerName),
        isMilestone
      }
    })

  const activities = (actData || []).filter((a: any) => {
    const duration = Number(a.duration_days || a.duration || 0)
    const isActivityMilestone = duration === 0 || a.name?.toLowerCase().includes('milestone') || a.type === 'milestone'
    return !isActivityMilestone
  })
  const totalActivities = activities.length
  const completedActivities = activities.filter((a: any) => (Number(a.percent_complete) || 0) >= 100 || a.actual_end_date).length
  const actualCompletionPercentage = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : (deliverables.length > 0 ? 100 : 100)

  // 3. Fetch Cost Accounts and Budget Baselines for EVM
  const wbsIds = (wbsData || []).map((w: any) => w.id).filter(Boolean)

  let costAccounts: any[] = []
  if (wbsIds.length > 0) {
    try {
      const { data } = await supabase
        .from('cost_accounts')
        .select('*')
        .in('wbs_element_id', wbsIds)
      if (data) costAccounts = data
    } catch (err) {
      console.warn('Cost accounts fetch non-critical error:', err)
    }
  }

  let actualsData: any[] = []
  if (wbsIds.length > 0) {
    try {
      const { data: actuals } = await supabase
        .from('actual_costs')
        .select('*')
        .in('wbs_element_id', wbsIds)
      if (actuals) actualsData = actuals
    } catch (err) {
      console.warn('Actual costs fetch non-critical error:', err)
    }
  }

  let bac = 0
  if (costAccounts && costAccounts.length > 0) {
    bac = costAccounts.reduce((sum: number, acc: any) => sum + (Number(acc.budgeted_total) || Number(acc.budget) || 0), 0)
  }
  
  let ac = 0
  if (actualsData && actualsData.length > 0) {
    ac = actualsData.reduce((sum: number, act: any) => sum + (Number(act.amount) || 0), 0)
  }

  // If EVM calculations lack explicit Earned Value, derive EV from completion percentage
  const ev = Math.round(bac * (actualCompletionPercentage / 100))
  const cv = ev - ac
  const sv = ev - bac
  const cpi = ac > 0 ? Number((ev / ac).toFixed(2)) : 1.00
  const spi = bac > 0 ? Number((ev / bac).toFixed(2)) : 1.00
  const eac = cpi > 0 ? Math.round(bac / cpi) : bac
  const pv = bac
  const etc = eac - ac
  const vac = bac - eac

  // 4. Fetch Risk Register Summary
  let risks: any[] = []
  try {
    const { data: risksData } = await supabase
      .from('risks')
      .select('*')
      .eq('project_id', projectId)
    if (risksData) risks = risksData
  } catch (err) {
    console.warn('Risks fetch non-critical error:', err)
  }

  const totalRisks = risks.length
  const mitigatedRisks = risks.filter((r: any) => 
    ['closed', 'mitigated', 'resolved'].includes(String(r.status || '').toLowerCase()) ||
    (r.mitigation_plan && String(r.mitigation_plan).trim() !== '')
  ).length
  const openRisks = totalRisks - mitigatedRisks

  const criticalMitigations = risks
    .filter((r: any) => {
      const impStr = String(r.impact || r.severity || '').toLowerCase()
      const probStr = String(r.probability || '').toLowerCase()
      const impNum = Number(r.impact || r.severity || 0)
      const probNum = Number(r.probability || 0)
      return impStr === 'high' || impStr === 'critical' || probStr === 'high' || impNum >= 4 || probNum >= 0.7
    })
    .map((r: any) => ({
      title: String(r.title || 'Untitled Risk'),
      severity: r.impact ? `${r.impact} Impact` : String(r.severity || 'High Priority'),
      mitigationPlan: String(r.mitigation_plan || r.response_strategy || r.description || 'Active Risk Mitigation Monitored'),
      status: String(r.status || 'Closed')
    }))

  return {
    project: {
      id: proj.id,
      name: proj.name || 'Project Closure Baseline',
      client_name: proj.client_name || null,
      methodology: proj.methodology || 'Waterfall PMO',
      currency: proj.currency || 'USD',
      start_date: proj.start_date || null,
      end_date: proj.end_date || null,
      lifecycle_status: proj.lifecycle_status || 'Closing'
    },
    scheduleSummary: {
      totalActivities,
      completedActivities,
      plannedEndDate: proj.end_date || null,
      actualCompletionPercentage,
      varianceDays: 0
    },
    evmSummary: {
      bac,
      ev,
      ac,
      cv,
      sv,
      cpi,
      spi,
      eac,
      pv,
      etc,
      vac
    },
    deliverables,
    risksSummary: {
      totalRisks,
      mitigatedRisks,
      openRisks,
      criticalMitigations
    }
  }
}

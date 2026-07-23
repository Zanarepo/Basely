'use server'

import { createClient } from '@/utils/supabase/server'

export async function fetchAutoFillText(projectId: string, sectionSource: string): Promise<string> {
  if (!sectionSource) return ''
  console.log(`[AutoFill] Starting fetch for source: ${sectionSource} in project: ${projectId}`)
  const supabase = await createClient()
  let text = ''
  const src = sectionSource

  if (src.startsWith('wbs')) {
    const { data: wbs, error: wbsErr } = await supabase
      .from('wbs_elements')
      .select('*, raci_assignments(*, stakeholder:stakeholders(*))')
      .eq('project_id', projectId)
      .eq('is_work_package', true)
      .order('sort_order', { ascending: true })

    if (wbsErr) {
      console.error("wbs fetch error", wbsErr)
      throw new Error(wbsErr.message)
    }

    if (!wbs || wbs.length === 0) {
      text = '• No work packages created yet in this project.'
    } else {
      const sorted = [...wbs].sort((a, b) => {
        const partsA = (a.code || '').split('.').map((p: string) => parseInt(p, 10) || 0)
        const partsB = (b.code || '').split('.').map((p: string) => parseInt(p, 10) || 0)
        const len = Math.max(partsA.length, partsB.length)
        for (let i = 0; i < len; i++) {
          if ((partsA[i] ?? -1) !== (partsB[i] ?? -1)) return (partsA[i] ?? -1) - (partsB[i] ?? -1)
        }
        return 0
      })

      text = `| Code | Name | Status | RACI |\n|---|---|---|---|\n`
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      text += sorted.map((el: any) => {
        let raciStr = ''
        if (el.raci_assignments && el.raci_assignments.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          raciStr = el.raci_assignments.map((r: any) => `${r.role_type}: ${r.stakeholder?.name || 'Unknown'}`).join(', ')
        }
        return `| ${el.code || ''} | ${el.name || ''} | ${el.status || 'Not Started'} | ${raciStr || '-'} |`
      }).join('\n')
    }
  } else if (src === 'status.risks' || src.includes('risk')) {
    const { data: risks, error: risksErr } = await supabase
      .from('risks')
      .select('*')
      .eq('project_id', projectId)
      .order('risk_score', { ascending: false })

    if (risksErr) throw new Error(risksErr.message)

    if (!risks || risks.length === 0) {
      text = '• No high-level risks recorded in the Risk Register.'
    } else {
      text = `| Risk | Category | Impact | Status | Score |\n|---|---|---|---|---|\n`
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      text += risks.map((r: any) => `| ${r.title || 'Untitled Risk'} | ${r.category || 'General'} | ${r.impact || 'Medium'} | ${r.status || 'Open'} | ${r.risk_score || 0} |`).join('\n')
    }
  } else if (src === 'status.schedule' || src.includes('schedule') || src.includes('milestone')) {
    const { data: acts } = await supabase.from('activities').select('*').eq('project_id', projectId)
    
    // Fetch milestones from wbs_elements (summary elements treated as milestones, duration 0)
    const { data: wbs, error: wbsErr } = await supabase
      .from('wbs_elements')
      .select('*, activities(duration)')
      .eq('project_id', projectId)
      .eq('is_work_package', false)

    if (wbsErr) throw new Error(wbsErr.message)

    const total = acts?.length || 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const completed = (acts || []).filter((a: any) => a.percent_complete === 100).length
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const criticalDelayed = (acts || []).filter((a: any) => a.is_critical && a.percent_complete < 100).length

    text = `Overall Schedule Completion: ${pct}%\nCritical Path Health: ${criticalDelayed > 0 ? 'At Risk' : 'On Track'}\n`

    // Filter milestones where duration is 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const milestones = (wbs || []).filter((el: any) => {
      const act = el.activities?.[0]
      return act && (act.duration === 0 || act.duration === '0d')
    })

    if (milestones.length > 0) {
      text += `\n### Upcoming Milestones\n| Code | Milestone | Status |\n|---|---|---|\n`
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      text += milestones.map((m: any) => `| ${m.code || ''} | ${m.name} | ${m.status || 'Not Started'} |`).join('\n')
    } else {
      text += `\n*No Milestones defined.*`
    }
  } else if (src === 'raci.matrix' || src.includes('raci') || src.includes('organization')) {
    const { data: raciAssignments, error: raciErr } = await supabase
      .from('raci_assignments')
      .select('*, stakeholder:stakeholders(*), wbs_element:wbs_elements(*)')
      .eq('project_id', projectId)
    
    if (raciErr) {
      console.error("RACI fetch error", raciErr)
      throw new Error(raciErr.message)
    }

    const { data: sh } = await supabase.from('stakeholders').select('*').eq('project_id', projectId).order('name', { ascending: true })
    if (!sh || sh.length === 0) {
      text = '• No project stakeholders or organization roster assigned.'
    } else {
      text = '### Project Stakeholders\n| Name | Role |\n|---|---|\n'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      text += sh.map((s: any) => `| ${s.name} | ${s.role_title || s.organization_type || 'Team Member'} |`).join('\n')
      
      if (raciAssignments && raciAssignments.length > 0) {
        text += '\n\n### RACI Assignments\n| Deliverable | RACI Roles |\n|---|---|\n'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raciByWbs = raciAssignments.reduce((acc: any, r: any) => {
          const wbsName = r.wbs_element?.name || 'Unknown Deliverable'
          if (!acc[wbsName]) acc[wbsName] = []
          acc[wbsName].push(`${r.role_type}: ${r.stakeholder?.name || 'Unknown'}`)
          return acc
        }, {})
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.entries(raciByWbs).forEach(([wbsName, roles]: [string, any]) => {
          text += `| ${wbsName} | ${roles.join(', ')} |\n`
        })
      }
    }
  } else if (src === 'status.cost' || src.includes('cost') || src.includes('budget')) {
    const { data: snapshots } = await supabase
      .from('evm_snapshots')
      .select('*')
      .eq('project_id', projectId)
      .is('wbs_element_id', null)
      .order('snapshot_date', { ascending: false })
      .limit(1)

    const snap = snapshots?.[0]
    if (!snap) {
      text = '• No budget or cost data recorded yet.'
    } else {
      const formatCurrency = (val: number) => `$${val.toLocaleString()}`
      text = `### Budget/Cost Status (EVM)\n| Metric | Value |\n|---|---|\n`
      text += `| Planned Value (PV) | ${formatCurrency(snap.planned_value || 0)} |\n`
      text += `| Earned Value (EV) | ${formatCurrency(snap.earned_value || 0)} |\n`
      text += `| Actual Cost (AC) | ${formatCurrency(snap.actual_cost || 0)} |\n`
      text += `| Cost Performance Index (CPI) | ${snap.cpi?.toFixed(2) || 'N/A'} |\n`
      text += `| Schedule Performance Index (SPI) | ${snap.spi?.toFixed(2) || 'N/A'} |`
      
      if ((snap.cpi || 0) < 1.0) text += '\n\n> **Note:** CPI is under 1.0, indicating the project is currently over budget.'
    }
  } else if (src.startsWith('project.')) {
    const { data: proj } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()
      
    if (!proj) {
      text = 'Project not found.'
    } else if (src === 'project.name') {
      text = proj.name || ''
    } else if (src === 'project.client_name') {
      text = proj.client_name || 'Not specified'
    } else if (src === 'project.methodology') {
      text = proj.methodology || ''
    } else if (src === 'project.start_date') {
      text = proj.start_date ? new Date(proj.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified'
    } else if (src === 'project.end_date') {
      text = proj.end_date ? new Date(proj.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified'
    } else {
      text = `Debug: Unhandled project source - ${src}`
    }
  } else {
    text = `Debug: Unhandled source - ${src}`
  }
  console.log(`[AutoFill] Finished fetch for source: ${sectionSource}. Output length: ${text.length}`)
  return text
}

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

      text = sorted.map((el: any) => {
        let line = `• ${el.code || ''} ${el.name || ''} [Status: ${el.status || 'Not Started'}]`
        if (el.description) line += `\n   Description: ${el.description}`
        if (el.deliverables) line += `\n   Deliverables: ${el.deliverables}`
        
        if (el.raci_assignments && el.raci_assignments.length > 0) {
          const raci = el.raci_assignments.map((r: any) => `${r.role_type}: ${r.stakeholder?.name || 'Unknown'}`).join(', ')
          line += `\n   RACI: ${raci}`
        }
        return line
      }).join('\n\n')
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
      text = risks.map((r: any) => `• ${r.title || 'Untitled Risk'} (Category: ${r.category || 'General'}, Impact: ${r.impact || 'Medium'}, Risk Score: ${r.risk_score || 0}, Status: ${r.status || 'Open'})`).join('\n')
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
    const completed = (acts || []).filter((a: any) => a.percent_complete === 100).length
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0
    const criticalDelayed = (acts || []).filter((a: any) => a.is_critical && a.percent_complete < 100).length

    text = `Overall Schedule Completion: ${pct}%\nCritical Path Health: ${criticalDelayed > 0 ? 'At Risk' : 'On Track'}\n`

    // Filter milestones where duration is 0
    const milestones = (wbs || []).filter((el: any) => {
      const act = el.activities?.[0]
      return act && (act.duration === 0 || act.duration === '0d')
    })

    if (milestones.length > 0) {
      text += `\nUpcoming Milestones:\n` + milestones.map((m: any) => `• ${m.code || ''} ${m.name} (Status: ${m.status || 'Not Started'})`).join('\n')
    } else {
      text += `\nNo Milestones defined.`
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
      text = 'Project Stakeholders:\n' + sh.map((s: any) => `• ${s.name} (${s.role_title || s.organization_type || 'Team Member'})`).join('\n')
      
      if (raciAssignments && raciAssignments.length > 0) {
        text += '\n\nRACI Assignments:\n'
        const raciByWbs = raciAssignments.reduce((acc: any, r: any) => {
          const wbsName = r.wbs_element?.name || 'Unknown Deliverable'
          if (!acc[wbsName]) acc[wbsName] = []
          acc[wbsName].push(`${r.role_type}: ${r.stakeholder?.name || 'Unknown'}`)
          return acc
        }, {})
        
        Object.entries(raciByWbs).forEach(([wbsName, roles]: [string, any]) => {
          text += `• ${wbsName}: ${roles.join(', ')}\n`
        })
      }
    }
  } else {
    text = `Debug: Unhandled source - ${src}`
  }
  console.log(`[AutoFill] Finished fetch for source: ${sectionSource}. Output length: ${text.length}`)
  return text
}

'use server'

import { createClient } from '@/utils/supabase/server'

export interface LessonsLearnedTemplateStructure {
  projectContext: {
    name: string
    methodology: string
    teamSize: number
    durationDays: number
  }
  defaultSections: Record<string, string>
}

/**
 * Resolves project context and provides structured free-text section prompts
 * to guide project teams through formal sprint and project retrospectives.
 */
export async function resolveLessonsLearnedData(projectId: string): Promise<LessonsLearnedTemplateStructure | null> {
  const supabase = await createClient()

  let proj: any = null
  try {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle()
    if (data) proj = data
  } catch (err) {
    console.warn('Project query non-critical error:', err)
  }

  if (!proj) {
    proj = {
      name: 'Project Retrospective',
      methodology: 'PMO Standard',
      start_date: new Date(Date.now() - 60 * 86400000).toISOString(),
      end_date: new Date().toISOString()
    }
  }

  let members: any[] = []
  try {
    const { data } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', projectId)
    if (data) members = data
  } catch (err) {
    console.warn('Project members non-critical error:', err)
  }

  let durationDays = 30
  if (proj.start_date && proj.end_date) {
    const start = new Date(proj.start_date).getTime()
    const end = new Date(proj.end_date).getTime()
    durationDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)))
  }

  return {
    projectContext: {
      name: proj.name || 'Project Retrospective',
      methodology: proj.methodology || 'Waterfall',
      teamSize: (members?.length || 1) + 1,
      durationDays
    },
    defaultSections: {
      executive_context: `This Lessons Learned report summarizes historical performance and retrospective insights for "${proj.name || 'Project Retrospective'}", executed using the ${proj.methodology || 'Waterfall'} methodology over an estimated ${durationDays}-day duration.`,
      what_worked_well: "• Cross-functional engineering communication via automated Slack notifications.\n• Earned Value Management (EVM) tracking enabled proactive budget variance mitigation.\n• Clear deliverables outlined in the WBS Dictionary reduced scope creep.",
      what_did_not_work: "• Initial stakeholder gathering lacked explicit sign-off criteria for sub-deliverables.\n• Third-party vendor dependencies led to minor critical path buffer absorption.",
      recommendations_for_future: "1. Introduce mandatory Requirements Traceability Matrix (RTM) tracking during Phase 1 Initiation.\n2. Schedule recurring weekly Post-Implementation Review reminders 30 days prior to formal closure.\n3. Automate token-based external client sign-off links to eliminate login barriers."
    }
  }
}

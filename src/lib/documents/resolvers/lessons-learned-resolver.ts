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
  aiInsights?: any[] | null
  lessonId?: string | null
  status?: string | null
}

/**
 * Resolves project context and provides structured free-text section prompts
 * to guide project teams through formal sprint and project retrospectives.
 */
export async function resolveLessonsLearnedData(projectId: string, releaseId?: string): Promise<LessonsLearnedTemplateStructure | null> {
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

  let query = supabase
    .from('product_lessons_learned')
    .select('*')
    .eq('project_id', projectId)

  if (releaseId) {
    query = query.eq('release_id', releaseId)
  } else {
    query = query.is('release_id', null)
  }

  const { data: lesson } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle()

  let whatWorked = ''
  let whatDidNotWork = ''
  let recommendations = ''

  if (lesson && lesson.raw_notes) {
    const notes = lesson.raw_notes
    const match1 = notes.match(/What worked well:\n([\s\S]*?)(?=\n\nWhat did not work:|$)/)
    const match2 = notes.match(/What did not work:\n([\s\S]*?)(?=\n\nRecommendations:|$)/)
    const match3 = notes.match(/Recommendations:\n([\s\S]*?)$/)
    
    if (match1) whatWorked = match1[1].trim()
    if (match2) whatDidNotWork = match2[1].trim()
    if (match3) recommendations = match3[1].trim()
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
      what_worked_well: whatWorked,
      what_did_not_work: whatDidNotWork,
      recommendations_for_future: recommendations
    },
    aiInsights: lesson?.synthesized_insights?.length > 0 ? lesson.synthesized_insights : null,
    status: lesson?.status || null,
    lessonId: lesson?.id || null
  }
}

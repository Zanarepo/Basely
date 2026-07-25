'use server'

import { createClient } from '@/utils/supabase/server'

export type GlobalSearchResult = {
  type: 'project' | 'wbs' | 'risk' | 'attachment'
  id: string
  title: string
  subtitle?: string
  projectId: string
  url: string
}

export async function globalSearch(query: string): Promise<GlobalSearchResult[]> {
  if (!query || query.trim().length < 2) return []

  const supabase = await createClient()
  const searchQuery = `%${query.trim()}%`
  const results: GlobalSearchResult[] = []

  // Note: We rely on Supabase Row-Level Security (RLS) to automatically 
  // filter these queries to only projects the user has access to!

  try {
    // 1. Search Projects
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, description')
      .or(`name.ilike.${searchQuery},description.ilike.${searchQuery}`)
      .limit(5)
    
    if (projects) {
      projects.forEach(p => {
        results.push({
          type: 'project',
          id: p.id,
          title: p.name,
          subtitle: p.description || 'Project',
          projectId: p.id,
          url: `/dashboard/projects/${p.id}`
        })
      })
    }

    // 2. Search WBS Elements
    const { data: wbs } = await supabase
      .from('wbs_elements')
      .select('id, name, description, project_id')
      .or(`name.ilike.${searchQuery},description.ilike.${searchQuery}`)
      .limit(5)
    
    if (wbs) {
      wbs.forEach(w => {
        results.push({
          type: 'wbs',
          id: w.id,
          title: w.name,
          subtitle: w.description || 'WBS Element',
          projectId: w.project_id,
          url: `/dashboard/projects/${w.project_id}?tab=wbs&element=${w.id}`
        })
      })
    }

    // 3. Search Risks
    const { data: risks } = await supabase
      .from('risks')
      .select('id, title, description, project_id')
      .or(`title.ilike.${searchQuery},description.ilike.${searchQuery}`)
      .limit(5)
    
    if (risks) {
      risks.forEach(r => {
        results.push({
          type: 'risk',
          id: r.id,
          title: r.title,
          subtitle: r.description || 'Risk Record',
          projectId: r.project_id,
          url: `/dashboard/projects/${r.project_id}?tab=risks`
        })
      })
    }

    // 4. Search Attachments
    const { data: attachments } = await supabase
      .from('attachments')
      .select('id, file_name, entity_type, entity_id, project_id')
      .ilike('file_name', searchQuery)
      .limit(5)

    if (attachments) {
      attachments.forEach(a => {
        let url = `/dashboard/projects/${a.project_id}?tab=documents`
        if (a.entity_type === 'wbs_element') {
          url = `/dashboard/projects/${a.project_id}?tab=wbs&element=${a.entity_id}`
        } else if (a.entity_type === 'risk') {
          url = `/dashboard/projects/${a.project_id}?tab=risks`
        }

        results.push({
          type: 'attachment',
          id: a.id,
          title: a.file_name,
          subtitle: `Attached to ${a.entity_type.replace('_', ' ')}`,
          projectId: a.project_id,
          url
        })
      })
    }

    return results
  } catch (error) {
    console.error('Global search error:', error)
    return []
  }
}

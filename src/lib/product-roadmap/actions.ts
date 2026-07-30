'use server'

import { createClient } from '@/utils/supabase/server'
import { ProductBacklogItem } from '../product-strategy/types'

export async function getRoadmapItems(projectId: string) {
  const supabase = await createClient()
  
  // We need to fetch the backlog items that have a horizon set.
  // We also want to join with wbs_elements -> iterations so we can get the schedule end_date 
  // to power the variance warning (The Project Bridge).
  
  const { data, error } = await supabase
    .from('product_backlog_items')
    .select(`
      *,
      okr:primary_okr_id(title),
      wbs_element:wbs_element_id(
        id,
        name,
        iteration:iteration_id(
          id,
          name,
          end_date
        )
      )
    `)
    .eq('project_id', projectId)
    .order('rice_score', { ascending: false })

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

export async function updateRoadmapHorizon(itemId: string, horizon: 'Now' | 'Next' | 'Later' | null) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('product_backlog_items')
    .update({ horizon })
    .eq('id', itemId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function updateRoadmapTheme(itemId: string, theme: string | null) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('product_backlog_items')
    .update({ theme })
    .eq('id', itemId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

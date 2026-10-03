'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { ProductBacklogItem } from '../product-strategy/types'

export async function getRoadmapItems(projectId: string) {
  const adminClient = createAdminClient()
  
  // Fetch the backlog items for this project
  const { data, error } = await adminClient
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
  
  // Fetch WBS children for all connected items to calculate progress
  const wbsIds = data.filter(d => d.wbs_element_id).map(d => d.wbs_element_id)
  if (wbsIds.length > 0) {
    const { data: wbsChildren } = await adminClient
      .from('wbs_elements')
      .select('parent_id, status')
      .in('parent_id', wbsIds)
      
    if (wbsChildren) {
      data.forEach(item => {
        if (item.wbs_element_id) {
          const children = wbsChildren.filter(c => c.parent_id === item.wbs_element_id)
          if (children.length > 0) {
            const completedCount = children.filter(c => c.status === 'Complete').length
            item.wbsProgressPercent = Math.round((completedCount / children.length) * 100)
          } else {
            item.wbsProgressPercent = 0
          }
        }
      })
    }
  }

  return { success: true, data }
}

export async function updateRoadmapHorizon(itemId: string, horizon: 'Now' | 'Next' | 'Later' | 'Backlog' | null) {
  try {
    const adminClient = createAdminClient()
    
    // Map 'Backlog' to null in the database
    const dbHorizon = horizon === 'Backlog' ? null : horizon

    const { error } = await adminClient
      .from('product_backlog_items')
      .update({ horizon: dbHorizon, updated_at: new Date().toISOString() })
      .eq('id', itemId)

    if (error) {
      console.error('[updateRoadmapHorizon Error]:', error)
      return { success: false, error: error.message }
    }
    
    revalidatePath(`/dashboard/projects`)
    return { success: true }
  } catch (err: any) {
    console.error('[updateRoadmapHorizon Exception]:', err)
    return { success: false, error: err.message || 'Failed to update horizon' }
  }
}

export async function updateRoadmapTheme(itemId: string, theme: string | null) {
  try {
    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('product_backlog_items')
      .update({ theme, updated_at: new Date().toISOString() })
      .eq('id', itemId)

    if (error) {
      console.error('[updateRoadmapTheme Error]:', error)
      return { success: false, error: error.message }
    }
    
    revalidatePath(`/dashboard/projects`)
    return { success: true }
  } catch (err: any) {
    console.error('[updateRoadmapTheme Exception]:', err)
    return { success: false, error: err.message || 'Failed to update theme' }
  }
}

export async function getProjectOkrs(projectId: string) {
  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('okr_objectives')
    .select('id, title, status')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) return { success: false, error: error.message }
  return { success: true, data }
}

export async function createProjectOkr(projectId: string, title: string) {
  try {
    const adminClient = createAdminClient()
    
    // OKR requires organization_id, get it from the project
    const { data: project } = await adminClient
      .from('projects')
      .select('organization_id')
      .eq('id', projectId)
      .single()

    const { data, error } = await adminClient
      .from('okr_objectives')
      .insert({
        project_id: projectId,
        organization_id: project?.organization_id,
        title,
        status: 'Not Started',
      })
      .select('id, title, status')
      .single()

    if (error) {
      console.error('[createProjectOkr Error]:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, data }
  } catch (err: any) {
    console.error('[createProjectOkr Exception]:', err)
    return { success: false, error: err.message || 'Failed to create OKR' }
  }
}

export async function saveRoadmapItem(projectId: string, itemId: string | null, data: Partial<ProductBacklogItem>) {
  try {
    const adminClient = createAdminClient()
    
    // Fetch organization_id from projects table
    const { data: project } = await adminClient
      .from('projects')
      .select('organization_id')
      .eq('id', projectId)
      .single()

    // PostgreSQL computes rice_score automatically via generated column.
    // We MUST NOT pass it in the insert/update payload.
    const { rice_score, ...cleanData } = data as any

    const itemData = {
      ...cleanData,
      project_id: projectId,
      organization_id: project?.organization_id,
      updated_at: new Date().toISOString(),
    }

    let result
    if (itemId) {
      result = await adminClient
        .from('product_backlog_items')
        .update(itemData)
        .eq('id', itemId)
    } else {
      result = await adminClient
        .from('product_backlog_items')
        .insert({
          ...itemData,
          horizon: itemData.horizon || null
        })
    }

    if (result.error) {
      console.error('[saveRoadmapItem Error]:', result.error)
      return { success: false, error: result.error.message }
    }

    revalidatePath(`/dashboard/projects`)
    return { success: true }
  } catch (err: any) {
    console.error('[saveRoadmapItem Exception]:', err)
    return { success: false, error: err.message || 'Failed to save roadmap item' }
  }
}

export async function deleteRoadmapItem(itemId: string) {
  try {
    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from('product_backlog_items')
      .delete()
      .eq('id', itemId)

    if (error) {
      console.error('[deleteRoadmapItem Error]:', error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/dashboard/projects`)
    return { success: true }
  } catch (err: any) {
    console.error('[deleteRoadmapItem Exception]:', err)
    return { success: false, error: err.message || 'Failed to delete roadmap item' }
  }
}

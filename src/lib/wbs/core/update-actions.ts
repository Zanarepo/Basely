'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { logProjectActivity } from '@/lib/projects/activity-actions'
import { dispatchNotification } from '@/lib/notifications/dispatch'
import type { 
  WbsElement, 
  WbsStatus, 
  DeliverableItem, 
  AcceptanceCriteriaItem,
  ChecklistItem 
} from '../constants'
import { recalculateSchedule } from '@/lib/schedule/actions/recalculate'
import { ActionResponse, CreateWbsResult } from './types'

export async function updateWbsElement(
  id: string,
  projectId: string,
  payload: {
    name?: string
    description?: string | null
    deliverables?: string | null
    deliverablesData?: DeliverableItem[]
    acceptanceCriteria?: string | null
    acceptanceCriteriaData?: AcceptanceCriteriaItem[]
    status?: WbsStatus
    isWorkPackage?: boolean
    cost?: number
    estimationMethod?: 'analogous' | 'parametric' | 'bottom_up'
    priority?: string | null
    userStoriesData?: ChecklistItem[]
    edgeCasesData?: ChecklistItem[]
    storyPoints?: number | null
    story_points?: number | null
    required_skills?: string[]
  }
): Promise<ActionResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'You must be signed in' }

  // Extract fields to update
  const updateData: any = {}

  // 1. Quality Gate Interception (Enterprise Only)
  if (payload.status === 'Complete') {
    // Check if the project belongs to an Enterprise organization
    const { data: project } = await supabase.from('projects').select('organization_id').eq('id', projectId).single()
    let isEnterprise = false
    if (project?.organization_id) {
      const { data: sub } = await supabase.from('organization_subscriptions').select('tier_id').eq('organization_id', project.organization_id).maybeSingle()
      if (sub?.tier_id === 'enterprise') {
        isEnterprise = true
      }
    }

    if (isEnterprise) {
      // Check if the project has an active Quality Management Plan
      const { data: qmp } = await supabase
        .from('quality_management_plans')
        .select('id')
        .eq('project_id', projectId)
        .maybeSingle()

    if (qmp) {
      // Ensure this is a work package (we don't enforce quality gates on summary nodes directly)
      const { data: elCheck } = await supabase.from('wbs_elements').select('is_work_package').eq('id', id).maybeSingle()
      if (elCheck?.is_work_package) {
        // Fetch ONLY standards linked specifically to this work package
        const { data: linkedStandards } = await supabase
          .from('wbs_quality_standard_links')
          .select(`
            quality_standards!inner (
              id,
              criterion_text,
              is_checklist_item,
              plan_id
            )
          `)
          .eq('wbs_element_id', id)
          .eq('quality_standards.plan_id', qmp.id)

        if (linkedStandards && linkedStandards.length > 0) {
          // Check if a quality signoff exists for this element
          const { data: signoff } = await supabase
            .from('wbs_quality_signoffs')
            .select('id')
            .eq('wbs_element_id', id)
            .maybeSingle()

          if (!signoff) {
            return { 
              ok: false, 
              error: 'QUALITY_GATE_REQUIRED', 
              qualityStandards: linkedStandards.map(link => {
                const s = link.quality_standards as any
                return {
                  id: s.id,
                  title: s.criterion_text,
                  isChecklist: s.is_checklist_item
                }
              }),
              category: 'General' 
            }
          }
        }
        }
      }
    }
  }
  if (payload.name !== undefined) {
    if (!payload.name.trim()) return { ok: false, error: 'Name is required' }
    updateData.name = payload.name.trim()
  }
  if (payload.description !== undefined) updateData.description = payload.description || null
  if (payload.deliverables !== undefined) updateData.deliverables = payload.deliverables || null
  if (payload.deliverablesData !== undefined) updateData.deliverables_data = payload.deliverablesData || []
  if (payload.acceptanceCriteria !== undefined) {
    updateData.acceptance_criteria = payload.acceptanceCriteria || null
  }
  if (payload.acceptanceCriteriaData !== undefined) {
    updateData.acceptance_criteria_data = payload.acceptanceCriteriaData || []
  }
  if (payload.status !== undefined) updateData.status = payload.status
  if (payload.isWorkPackage !== undefined) updateData.is_work_package = payload.isWorkPackage
  if (payload.priority !== undefined) updateData.priority = payload.priority
  if (payload.userStoriesData !== undefined) updateData.user_stories = JSON.stringify(payload.userStoriesData)
  if (payload.edgeCasesData !== undefined) updateData.edge_cases = JSON.stringify(payload.edgeCasesData)
  if (payload.storyPoints !== undefined) updateData.story_points = payload.storyPoints
  if (payload.story_points !== undefined) updateData.story_points = payload.story_points
  if (payload.required_skills !== undefined) updateData.required_skills = payload.required_skills


  const { error } = await supabase
    .from('wbs_elements')
    .update(updateData)
    .eq('id', id)

  if (error) return { ok: false, error: error.message }

  // Sync completion status to activities table if status was provided
  if (payload.status !== undefined) {
    let percentComplete = 0
    if (payload.status === 'Complete') percentComplete = 100
    else if (payload.status === 'In Progress') percentComplete = 50 // Safe default for in-progress
    
    // We update actual_finish as well for better tracking if complete
    const updateAct: any = { percent_complete: percentComplete }
    if (percentComplete === 100) {
      updateAct.actual_finish = new Date().toISOString().split('T')[0]
    } else {
      updateAct.actual_finish = null
    }

    // Try to update corresponding activity (if it exists)
    // Note: Since activities table schema doesn't have actual_finish we just update percent_complete
    await supabase
      .from('activities')
      .update({ percent_complete: percentComplete })
      .eq('wbs_element_id', id)
  }

  // Handle Cost Accounts sync
  if (payload.isWorkPackage === false) {
    // If changed to a summary node, we delete any associated cost account
    await supabase.from('cost_accounts').delete().eq('wbs_element_id', id)
  } else if (payload.cost !== undefined || payload.estimationMethod !== undefined) {
    // Check if it's a work package before syncing cost account
    let isWp = payload.isWorkPackage
    if (isWp === undefined) {
      const { data: elData } = await supabase.from('wbs_elements').select('is_work_package').eq('id', id).single()
      isWp = elData?.is_work_package
    }
    if (isWp) {
      const { data: existingCost } = await supabase.from('cost_accounts').select('id').eq('wbs_element_id', id).maybeSingle()
      const costUpdate: any = {}
      if (payload.cost !== undefined) costUpdate.budgeted_total = payload.cost
      if (payload.estimationMethod !== undefined) costUpdate.estimation_method = payload.estimationMethod

      if (existingCost) {
        await supabase.from('cost_accounts').update(costUpdate).eq('id', existingCost.id)
      } else {
        await supabase.from('cost_accounts').insert({
          wbs_element_id: id,
          budgeted_total: payload.cost || 0,
          estimation_method: payload.estimationMethod || 'bottom_up'
        })
      }
    }
  }

  // Recalculate schedule if work package status changed
  if (payload.isWorkPackage !== undefined) {
    await recalculateSchedule(projectId)
  }

  logProjectActivity(projectId, 'wbs_element', id, 'updated', { name: payload.name || 'WBS Element Updated' }).catch(() => {})

  try {
    revalidatePath(`/dashboard/projects/${projectId}`)
  } catch (err) {}

  return { ok: true }
}

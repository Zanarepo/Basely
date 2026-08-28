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
} from './constants'
import { recalculateSchedule } from '@/lib/schedule/actions/recalculate'

export type ActionResponse = 
  | { ok: true } 
  | { ok: false; error: string }
  | { ok: false; error: 'QUALITY_GATE_REQUIRED'; qualityStandards: any[]; category: string }
export type CreateWbsResult = { ok: true; id: string } | { ok: false; error: string }

export async function getWbsElements(projectId: string): Promise<
  | { ok: true; data: WbsElement[] }
  | { ok: false; error: string }
> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('wbs_elements')
    .select('*, activities(duration), raci_assignments(*, stakeholder:stakeholders(*, profiles(full_name, email))), cost_accounts(id, budgeted_total, estimation_method), product_backlog_items(id, primary_okr_id, okr:okr_objectives(id, title))')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    return { ok: false, error: error.message }
  }

  const mapped: WbsElement[] = data.map((d: any) => {
    // Determine cost from cost_accounts (handles array or object)
    let cost = undefined;
    let estimationMethod = undefined;
    if (d.cost_accounts) {
      if (Array.isArray(d.cost_accounts) && d.cost_accounts.length > 0) {
        cost = Number(d.cost_accounts[0].budgeted_total);
        estimationMethod = d.cost_accounts[0].estimation_method;
      } else if (!Array.isArray(d.cost_accounts)) {
        cost = Number(d.cost_accounts.budgeted_total);
        estimationMethod = d.cost_accounts.estimation_method;
      }
    }

    let directOkrId = undefined;
    let directOkrTitle = undefined;
    if (d.product_backlog_items && d.product_backlog_items.length > 0) {
      const pbi = d.product_backlog_items[0];
      if (pbi.okr) {
        directOkrId = pbi.okr.id;
        directOkrTitle = pbi.okr.title;
      }
    }

    return {
      id: d.id,
      projectId: d.project_id,
      parentId: d.parent_id,
      code: d.code,
      name: d.name,
      description: d.description,
      ownerId: d.owner_id,
      createdBy: d.created_by,
      deliverables: d.deliverables,
      deliverablesData: d.deliverables_data || [],
      acceptanceCriteria: d.acceptance_criteria,
      acceptanceCriteriaData: d.acceptance_criteria_data || [],
      status: d.status as WbsStatus,
      isWorkPackage: d.is_work_package,
      sortOrder: d.sort_order,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
      iterationId: d.iteration_id || null,
      priority: d.priority || null,
      userStories: d.user_stories || null,
      userStoriesData: typeof d.user_stories === 'string' ? JSON.parse(d.user_stories) : (d.user_stories || []),
      edgeCases: d.edge_cases || null,
      edgeCasesData: typeof d.edge_cases === 'string' ? JSON.parse(d.edge_cases) : (d.edge_cases || []),
      duration: d.activities ? Number(d.activities.duration) : undefined,
      story_points: d.story_points ? Number(d.story_points) : null,
      cost,
      estimationMethod,
      required_skills: d.required_skills || [],
      raciAssignments: d.raci_assignments?.map((r: any) => ({
        id: r.id,
        wbsElementId: r.wbs_element_id,
        stakeholderId: r.stakeholder_id,
        roleType: r.role_type,
        stakeholder: r.stakeholder
      })) || [],
      okrId: directOkrId,
      okrTitle: directOkrTitle,
    }
  })

  // Second pass: inherit OKRs from parents
  const idMap = new Map<string, WbsElement>(mapped.map(item => [item.id, item]));
  for (const item of mapped) {
    if (!item.okrId && item.parentId) {
      // Traverse up to find an OKR
      let current = idMap.get(item.parentId);
      while (current) {
        if (current.okrId) {
          item.okrId = current.okrId;
          item.okrTitle = current.okrTitle;
          break;
        }
        current = current.parentId ? idMap.get(current.parentId) : undefined;
      }
    }
  }

  return { ok: true, data: mapped }
}

export async function createWbsElement(
  projectId: string,
  parentId: string | null,
  name: string,
  sortOrder: number,
  initialData?: { status?: string; isWorkPackage?: boolean }
): Promise<CreateWbsResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'You must be signed in' }

  // Simple validation for name
  if (!name.trim()) return { ok: false, error: 'Name is required' }

  const insertPayload: any = {
    project_id: projectId,
    parent_id: parentId,
    name: name.trim(),
    sort_order: sortOrder,
    created_by: user.id,
  }

  if (initialData?.status) insertPayload.status = initialData.status
  if (initialData?.isWorkPackage !== undefined) insertPayload.is_work_package = initialData.isWorkPackage

  const { data, error } = await supabase
    .from('wbs_elements')
    .insert(insertPayload)
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

  if (initialData?.isWorkPackage) {
    await recalculateSchedule(projectId)
  }

    // Auto-assign the creator as Responsible so they can edit it
    const { data: stakeholder } = await supabase
      .from('stakeholders')
      .select('id')
      .eq('linked_user_id', user.id)
      .eq('project_id', projectId)
      .single()
      
    if (stakeholder) {
      const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
      const adminSupabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!
      )

      const { error: raciError } = await adminSupabase.from('raci_assignments').insert({
        project_id: projectId,
        wbs_element_id: data.id,
        stakeholder_id: stakeholder.id,
        role_type: 'Responsible'
      })
      if (raciError) console.error("Raci Auto Assign Error:", raciError);
    }

  await logProjectActivity(projectId, 'wbs_element', data.id, 'created', { name: name.trim() })

  await dispatchNotification({
    userId: user.id,
    triggerType: 'assignment',
    referenceEntityType: 'wbs',
    referenceEntityId: data.id,
    projectId,
    contentSummary: `New WBS Task Created: "${name.trim()}"`
  }).catch(err => console.error('Webhook notification failed:', err))

  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath('/dashboard')
  return { ok: true, id: data.id }
}

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

async function performCascadingWbsDelete(adminClient: any, targetIds: string[], projectId: string) {
  if (!targetIds || targetIds.length === 0) return

  // 1. Fetch all WBS elements for the project to recursively gather all child IDs
  const { data: allWbs } = await adminClient
    .from('wbs_elements')
    .select('id, parent_id')
    .eq('project_id', projectId)

  const allToDelete = new Set<string>(targetIds)
  let addedNew = true
  while (addedNew) {
    addedNew = false
    if (allWbs) {
      for (const item of allWbs) {
        if (item.parent_id && allToDelete.has(item.parent_id) && !allToDelete.has(item.id)) {
          allToDelete.add(item.id)
          addedNew = true
        }
      }
    }
  }

  const idsArray = Array.from(allToDelete)

  // 2. Unlink product backlog items (SET wbs_element_id = NULL)
  await adminClient
    .from('product_backlog_items')
    .update({ wbs_element_id: null })
    .in('wbs_element_id', idsArray)

  // 3. Find all activity IDs for these WBS elements
  const { data: acts } = await adminClient
    .from('activities')
    .select('id')
    .in('wbs_element_id', idsArray)

  if (acts && acts.length > 0) {
    const actIds = acts.map((a: any) => a.id)
    // Delete dependencies referencing these activities (as predecessor or successor)
    await adminClient.from('dependencies').delete().in('predecessor_id', actIds)
    await adminClient.from('dependencies').delete().in('successor_id', actIds)
    // Delete activities
    await adminClient.from('activities').delete().in('id', actIds)
  }

  // 4. Delete associated cost accounts
  await adminClient.from('cost_accounts').delete().in('wbs_element_id', idsArray)

  // 5. Delete RACI assignments
  await adminClient.from('raci_assignments').delete().in('wbs_element_id', idsArray)

  // 6. Delete WBS elements
  const { error: delErr } = await adminClient
    .from('wbs_elements')
    .delete()
    .in('id', idsArray)

  if (delErr) {
    console.error('Cascading WBS delete error:', delErr)
    throw new Error(delErr.message)
  }
}

export async function deleteWbsElement(id: string, projectId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { ok: false, error: 'You must be signed in' }

    const adminClient = createAdminClient()
    await performCascadingWbsDelete(adminClient, [id], projectId)

    // Recalculate schedule to update timelines after deletion
    await recalculateSchedule(projectId)

    await logProjectActivity(projectId, 'wbs_element', id, 'deleted', { id })

    revalidatePath(`/dashboard/projects/${projectId}`)
    revalidatePath('/dashboard')
    return { ok: true }
  } catch (err: any) {
    console.error('deleteWbsElement failed:', err)
    return { ok: false, error: err?.message || 'Could not delete WBS element' }
  }
}

export async function moveWbsElement(
  id: string,
  projectId: string,
  newParentId: string | null,
  newSortOrder: number
): Promise<ActionResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'You must be signed in' }

  const { error } = await supabase
    .from('wbs_elements')
    .update({
      parent_id: newParentId,
      sort_order: newSortOrder,
    })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { ok: true }
}

export async function updateWbsSortOrders(
  projectId: string,
  updates: { id: string; parentId: string | null; sortOrder: number }[]
): Promise<ActionResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'You must be signed in' }

  // Perform updates sequentially
  for (const item of updates) {
    const { error } = await supabase
      .from('wbs_elements')
      .update({
        parent_id: item.parentId,
        sort_order: item.sortOrder,
      })
      .eq('id', item.id)

    if (error) return { ok: false, error: error.message }
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { ok: true }
}

export async function bulkImportWbsElements(
  projectId: string,
  elements: any[]
): Promise<ActionResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'You must be signed in' }

  if (!elements || elements.length === 0) return { ok: true }

  const { error } = await supabase
    .from('wbs_elements')
    .insert(elements)

  if (error) return { ok: false, error: error.message }

  await recalculateSchedule(projectId)

  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath('/dashboard')
  return { ok: true }
}

export async function bulkDeleteWbsElements(
  ids: string[],
  projectId: string
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { ok: false, error: 'You must be signed in' }
    if (!ids || ids.length === 0) return { ok: true }

    const adminClient = createAdminClient()
    await performCascadingWbsDelete(adminClient, ids, projectId)

    await recalculateSchedule(projectId)

    revalidatePath(`/dashboard/projects/${projectId}`)
    revalidatePath('/dashboard')
    return { ok: true }
  } catch (err: any) {
    console.error('bulkDeleteWbsElements failed:', err)
    return { ok: false, error: err?.message || 'Could not delete WBS elements' }
  }
}

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

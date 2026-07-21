'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type DocumentExportRecord = {
  id: string
  project_id: string
  generated_document_id: string | null
  document_type: string
  format: 'pdf' | 'docx' | 'xlsx'
  file_name: string
  file_content?: string | null
  content_snapshot?: any
  exported_at: string
  exported_by?: string | null
  profiles?: { full_name: string | null; email: string | null }
}

/**
 * Natural hierarchical sort for WBS Codes (e.g. 1, 1.1, 1.2, 2, 2.1, 3, 3.1, 3.2, 4, 4.1, 4.2, 5)
 */
function sortWbsByCode<T extends { code: string }>(elements: T[]): T[] {
  return [...elements].sort((a, b) => {
    const partsA = (a.code || '').split('.').map((p) => parseInt(p, 10) || 0)
    const partsB = (b.code || '').split('.').map((p) => parseInt(p, 10) || 0)

    const len = Math.max(partsA.length, partsB.length)
    for (let i = 0; i < len; i++) {
      const valA = partsA[i] ?? -1
      const valB = partsB[i] ?? -1
      if (valA !== valB) {
        return valA - valB
      }
    }
    return 0
  })
}

/**
 * Fetch full, structured, and code-sorted export data for a project (WBS, Schedule, Cost, RACI, Risks)
 */
export async function getFullProjectExportData(projectId: string) {
  try {
    const supabase = await createClient()

    const [wbsRes, shRes, projRes, evmRes, riskRes, actRes, caRes] = await Promise.all([
      supabase
        .from('wbs_elements')
        .select(`
          *,
          raci_assignments(id, wbs_element_id, stakeholder_id, role_type, stakeholder:stakeholders(id, name, organization_type))
        `)
        .eq('project_id', projectId),
      supabase
        .from('stakeholders')
        .select('*')
        .eq('project_id', projectId)
        .order('name', { ascending: true }),
      supabase
        .from('projects')
        .select('name, currency, client_name, start_date, end_date')
        .eq('id', projectId)
        .single(),
      supabase
        .from('evm_snapshots')
        .select('*')
        .eq('project_id', projectId)
        .is('wbs_element_id', null)
        .order('snapshot_date', { ascending: false })
        .limit(1),
      supabase
        .from('risks')
        .select('*')
        .eq('project_id', projectId)
        .order('score', { ascending: false })
        .limit(5),
      supabase
        .from('activities')
        .select('*')
        .eq('project_id', projectId),
      supabase
        .from('cost_accounts')
        .select('*')
        .eq('project_id', projectId)
    ])

    if (wbsRes.error) {
      console.error('wbsRes error in getFullProjectExportData:', wbsRes.error)
    }

    const rawWbs = wbsRes.data || []
    const stakeholders = shRes.data || []
    const project = projRes.data || {}
    const evmData = (evmRes.data && evmRes.data.length > 0) ? evmRes.data[0] : null
    const topRisks = riskRes.data || []
    const activities = actRes.data || []
    const costAccounts = caRes.data || []

    const actMap = new Map()
    activities.forEach((a: any) => {
      if (a.wbs_element_id) actMap.set(a.wbs_element_id, a)
    })

    const caMap = new Map()
    costAccounts.forEach((c: any) => {
      if (c.wbs_element_id) caMap.set(c.wbs_element_id, c)
    })

    // Map WBS elements to camelCase & join schedule/cost data
    const mappedWbs = rawWbs.map((d: any) => {
      const act = actMap.get(d.id)
      const ca = caMap.get(d.id)

      const isWorkPackage = Boolean(d.is_work_package)
      const durationVal = act?.duration !== undefined && act?.duration !== null ? Number(act.duration) : undefined

      return {
        id: d.id,
        projectId: d.project_id,
        parentId: d.parent_id,
        code: d.code || '',
        name: d.name || '',
        description: d.description || '',
        status: d.status || 'Not Started',
        isWorkPackage,
        sortOrder: d.sort_order || 0,
        deliverables: (d.deliverables_data && d.deliverables_data.length > 0)
          ? d.deliverables_data.map((item: any) => item.text).join('; ')
          : (d.deliverables || ''),
        acceptanceCriteria: (d.acceptance_criteria_data && d.acceptance_criteria_data.length > 0)
          ? d.acceptance_criteria_data.map((item: any) => item.text).join('; ')
          : (d.acceptance_criteria || ''),
        start: act?.es || '—',
        finish: act?.ef || '—',
        duration: durationVal,
        float: act?.total_float !== null && act?.total_float !== undefined ? `${act.total_float}d` : '—',
        cost: ca?.budgeted_total !== undefined ? ca.budgeted_total : null,
        currency: ca?.currency || (project as any)?.currency || 'USD',
        raciAssignments: (d.raci_assignments || []).map((r: any) => ({
          id: r.id,
          wbsElementId: r.wbs_element_id,
          stakeholderId: r.stakeholder_id,
          roleType: r.role_type,
          stakeholder: r.stakeholder ? {
            id: r.stakeholder.id,
            name: r.stakeholder.name,
            organization_type: r.stakeholder.organization_type
          } : undefined
        }))
      }
    })

    // Sort hierarchically by WBS code
    const sortedWbs = sortWbsByCode(mappedWbs)

    // Compute schedule metrics
    let totalPlanned = activities.length
    let totalCompleted = activities.filter((a: any) => a.percent_complete === 100).length
    let totalCritical = activities.filter((a: any) => a.is_critical).length
    let criticalDelayed = activities.filter((a: any) => a.is_critical && a.percent_complete < 100).length

    const overallComplete = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0
    const criticalPathHealth = criticalDelayed > 0 ? 'At Risk' : 'On Track'

    const upcomingMilestones = sortedWbs
      .filter((el: any) => el.isWorkPackage && (el.duration === 0 || el.duration === '0d') && el.status !== 'Complete')
      .slice(0, 5)

    return {
      wbsElements: sortedWbs,
      stakeholders,
      project,
      evmData,
      topRisks,
      scheduleSummary: {
        totalPlanned,
        totalCompleted,
        overallComplete,
        criticalPathHealth,
        criticalDelayed,
        totalCritical,
        upcomingMilestones
      }
    }
  } catch (err: any) {
    console.error('Failed to get full project export data:', err)
    return {
      wbsElements: [],
      stakeholders: [],
      project: {},
      evmData: null,
      topRisks: [],
      scheduleSummary: {
        totalPlanned: 0,
        totalCompleted: 0,
        overallComplete: 0,
        criticalPathHealth: 'On Track',
        criticalDelayed: 0,
        totalCritical: 0,
        upcomingMilestones: []
      }
    }
  }
}

/**
 * Log a document export to the database and save the file content snapshot
 */
export async function logDocumentExport(payload: {
  projectId: string
  generatedDocumentId?: string | null
  documentType: string
  format: 'pdf' | 'docx' | 'xlsx'
  fileName: string
  fileContentBase64?: string
  contentSnapshot?: any
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { ok: false, error: 'Unauthorized' }
    }

    const { data, error } = await supabase
      .from('document_exports')
      .insert({
        project_id: payload.projectId,
        generated_document_id: payload.generatedDocumentId || null,
        document_type: payload.documentType,
        format: payload.format,
        file_name: payload.fileName,
        file_content: payload.fileContentBase64 || null,
        content_snapshot: payload.contentSnapshot || {},
        exported_by: user.id
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error logging document export:', error)
      return { ok: false, error: error.message }
    }

    revalidatePath(`/dashboard/projects/${payload.projectId}`)
    return { ok: true, id: data.id }
  } catch (err: any) {
    console.error('Failed to log document export:', err)
    return { ok: false, error: err.message || 'Export logging failed' }
  }
}

/**
 * Fetch unified document history (exports & status report snapshots) for a project
 */
export async function getProjectDocumentHistory(
  projectId: string,
  documentType?: string
): Promise<{
  exports: DocumentExportRecord[]
  snapshots: any[]
}> {
  try {
    const supabase = await createClient()

    // Query document exports
    let query = supabase
      .from('document_exports')
      .select('id, project_id, generated_document_id, document_type, format, file_name, content_snapshot, exported_at, exported_by, profiles(full_name, email)')
      .eq('project_id', projectId)
      .order('exported_at', { ascending: false })

    if (documentType) {
      query = query.eq('document_type', documentType)
    }

    const { data: exportsData, error: exportsErr } = await query

    if (exportsErr) {
      console.error('Error fetching export history:', exportsErr)
    }

    // Query status report snapshots
    let snapQuery = supabase
      .from('generated_documents')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_snapshot', true)
      .order('generated_at', { ascending: false })

    if (documentType) {
      snapQuery = snapQuery.eq('document_type', documentType)
    }

    const { data: snapshotsData, error: snapErr } = await snapQuery

    if (snapErr) {
      console.error('Error fetching snapshot history:', snapErr)
    }

    return {
      exports: (exportsData as any[]) || [],
      snapshots: snapshotsData || []
    }
  } catch (err) {
    console.error('Failed to load project document history:', err)
    return { exports: [], snapshots: [] }
  }
}

/**
 * Fetch stored file content for re-downloading exact past export
 */
export async function getExportFileContent(
  exportId: string
): Promise<{ ok: true; record: DocumentExportRecord } | { ok: false; error: string }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('document_exports')
      .select('*')
      .eq('id', exportId)
      .single()

    if (error || !data) {
      return { ok: false, error: error?.message || 'Export file not found' }
    }

    return { ok: true, record: data as any }
  } catch (err: any) {
    return { ok: false, error: err.message || 'Failed to fetch export file' }
  }
}

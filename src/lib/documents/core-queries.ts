'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { PRD_TEMPLATE_VARIANTS, getSyncDocumentTemplate } from './prd-templates'
import { STRATEGY_TEMPLATE_VARIANTS } from './strategy-templates'
import { DocumentTemplate, GeneratedDocument } from './types'

export async function getDocumentTemplate(documentType: string, templateId?: string): Promise<DocumentTemplate | null> {
  if (templateId && (PRD_TEMPLATE_VARIANTS[templateId] || STRATEGY_TEMPLATE_VARIANTS[templateId])) {
    return getSyncDocumentTemplate(documentType, templateId) as unknown as DocumentTemplate
  }

  if (templateId) {
    const supabase = await createClient()
    const { data: customTemplate, error: customError } = await supabase
      .from('custom_document_templates')
      .select('id, document_type, section_definitions, created_at')
      .eq('id', templateId)
      .maybeSingle()

    if (!customError && customTemplate) {
      return {
        id: customTemplate.id,
        document_type: customTemplate.document_type,
        section_definitions: (customTemplate.section_definitions as any) || [],
        created_at: customTemplate.created_at,
        is_custom: true,
      }
    }
  }

  return getSyncDocumentTemplate(documentType) as unknown as DocumentTemplate
}

export async function getGeneratedDocument(
  projectId: string,
  documentType: string,
  isSnapshot?: boolean,
  snapshotId?: string
): Promise<GeneratedDocument | null> {
  const supabase = await createClient()

  let query = supabase
    .from('generated_documents')
    .select('*')
    .eq('project_id', projectId)
    .eq('document_type', documentType)

  if (snapshotId) {
    query = query.eq('id', snapshotId)
  } else if (isSnapshot) {
    query = query.eq('is_snapshot', true)
  } else {
    query = query.eq('is_snapshot', false)
  }

  const { data, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle()

  if (error || !data) return null

  return {
    id: data.id,
    project_id: data.project_id,
    document_type: data.document_type,
    custom_template_id: data.custom_template_id,
    free_text_content: (data.free_text_content as Record<string, string>) || {},
    is_snapshot: data.is_snapshot,
    frozen_data: data.frozen_data,
    period_end: data.period_end,
    generated_at: data.generated_at,
    created_at: data.created_at,
    updated_at: data.updated_at,
  }
}

export async function getAvailableDocumentTypes() {
  return [
    { id: 'charter', name: 'Project Charter' },
    { id: 'wbs_dictionary', name: 'WBS Dictionary' },
    { id: 'raci', name: 'RACI Matrix' },
    { id: 'stakeholder_register', name: 'Stakeholder Register' },
    { id: 'risk_register', name: 'Risk Register' },
    { id: 'status_report', name: 'Status Report' },
    { id: 'closure_report', name: 'Closure Report' },
    { id: 'lessons_learned', name: 'Lessons Learned' },
    { id: 'handover_document', name: 'Handover Document' },
    { id: 'post_implementation_review', name: 'Post-Implementation Review' },
    { id: 'signoff_board', name: 'Sign-Off Board' },
    { id: 'business_case', name: 'Business Case' },
    { id: 'feasibility_study', name: 'Feasibility Study' },
    { id: 'scope_statement', name: 'Scope Statement' },
    { id: 'communication_plan', name: 'Communication Plan' },
    { id: 'quality_management_plan', name: 'Quality Management Plan' },
    { id: 'procurement_plan', name: 'Procurement Plan' },
  ]
}

export async function getProjectOrOrgMembers(projectId: string): Promise<{
  currentUserId?: string
  isAdmin?: boolean
  members: Array<{ userId: string; name: string; role: string; email?: string }>
}> {
  try {
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    const adminSupabase = createAdminClient()

    let organizationId: string | null = null
    try {
      const { data: proj } = await adminSupabase
        .from('projects')
        .select('organization_id')
        .eq('id', projectId)
        .maybeSingle()
      if (proj?.organization_id) organizationId = proj.organization_id
    } catch (e) {
      console.warn('Project org query error:', e)
    }

    const membersMap = new Map<string, { userId: string; name: string; role: string; email?: string }>()

    if (organizationId) {
      const { data: orgMembers } = await adminSupabase
        .from('organization_members')
        .select('user_id, role')
        .eq('organization_id', organizationId)
        .eq('is_active', true)

      if (orgMembers && orgMembers.length > 0) {
        const userIds = orgMembers.map((m: any) => m.user_id)
        const { data: profiles } = await adminSupabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds)

        const profilesMap = new Map((profiles || []).map((p: any) => [p.id, p]))

        for (const m of orgMembers) {
          const prof = profilesMap.get(m.user_id)
          membersMap.set(m.user_id, {
            userId: m.user_id,
            name: prof?.full_name || prof?.email || 'Team Member',
            role: m.role || 'Member',
            email: prof?.email,
          })
        }
      }
    }

    try {
      const { data: projMembers } = await adminSupabase
        .from('project_members')
        .select('user_id, project_role_title')
        .eq('project_id', projectId)

      if (projMembers && projMembers.length > 0) {
        const pUserIds = projMembers.map((m: any) => m.user_id)
        const { data: pProfiles } = await adminSupabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', pUserIds)

        const pProfilesMap = new Map((pProfiles || []).map((p: any) => [p.id, p]))

        for (const pm of projMembers) {
          if (!membersMap.has(pm.user_id)) {
            const prof = pProfilesMap.get(pm.user_id)
            membersMap.set(pm.user_id, {
              userId: pm.user_id,
              name: prof?.full_name || prof?.email || 'Project Member',
              role: pm.project_role_title || 'Contributor',
              email: prof?.email,
            })
          }
        }
      }
    } catch (e) {
      console.warn('Project members fallback fetch error:', e)
    }

    if (membersMap.size === 0) {
      const { data: allProfiles } = await adminSupabase
        .from('profiles')
        .select('id, full_name, email')
        .limit(20)

      if (allProfiles && allProfiles.length > 0) {
        for (const prof of allProfiles) {
          membersMap.set(prof.id, {
            userId: prof.id,
            name: prof.full_name || prof.email || 'Workspace Member',
            role: 'Team Member',
            email: prof.email,
          })
        }
      }
    }

    if (membersMap.size === 0) {
      try {
        const { data: authData } = await adminSupabase.auth.admin.listUsers()
        if (authData?.users) {
          for (const u of authData.users) {
            membersMap.set(u.id, {
              userId: u.id,
              name: u.user_metadata?.full_name || u.email || 'Team User',
              role: u.user_metadata?.role || 'Member',
              email: u.email,
            })
          }
        }
      } catch (e) {
        console.warn('Auth admin listUsers error:', e)
      }
    }

    if (currentUser && !membersMap.has(currentUser.id)) {
      membersMap.set(currentUser.id, {
        userId: currentUser.id,
        name: currentUser.user_metadata?.full_name || currentUser.email || 'Current User',
        role: 'Product Manager',
        email: currentUser.email,
      })
    }

    let isAdmin = false
    if (currentUser) {
      if (organizationId) {
        const { data: org } = await adminSupabase
          .from('organizations')
          .select('owner_id')
          .eq('id', organizationId)
          .maybeSingle()

        if (org?.owner_id === currentUser.id) {
          isAdmin = true
        } else {
          const { data: orgMem } = await adminSupabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', organizationId)
            .eq('user_id', currentUser.id)
            .maybeSingle()

          if (orgMem?.role === 'Admin' || orgMem?.role === 'PM' || orgMem?.role === 'Owner') {
            isAdmin = true
          }
        }
      }

      if (!isAdmin) {
        const { data: proj } = await adminSupabase
          .from('projects')
          .select('created_by')
          .eq('id', projectId)
          .maybeSingle()

        if (proj?.created_by === currentUser.id) {
          isAdmin = true
        }
      }
    }

    return {
      currentUserId: currentUser?.id,
      isAdmin,
      members: Array.from(membersMap.values()),
    }
  } catch (err) {
    console.error('Error in getProjectOrOrgMembers:', err)
    return { members: [] }
  }
}

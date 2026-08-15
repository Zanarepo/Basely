'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { logProjectActivity } from '@/lib/projects/activity-actions'
import { dispatchNotification } from '@/lib/notifications/actions'
import { checkProjectFeatureAccess } from '@/lib/organizations/tier-logic'
import { PRD_TEMPLATE_VARIANTS, getSyncDocumentTemplate } from './prd-templates'

export type DocumentSectionDef = {
  key: string
  title: string
  type: 'data_bound' | 'free_text'
  source?: string
  placeholder?: string
}

export type DocumentTemplate = {
  id: string
  document_type: string
  section_definitions: DocumentSectionDef[]
  created_at: string
  is_custom?: boolean
}

export type GeneratedDocument = {
  id: string
  project_id: string
  document_type: string
  custom_template_id?: string
  free_text_content: Record<string, string>
  is_snapshot: boolean
  frozen_data?: any
  period_end?: string
  generated_at: string
  created_at: string
  updated_at: string
}

function isUuid(val?: string | null): boolean {
  if (!val) return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(val)
}

export async function getDocumentTemplate(documentType: string, templateId?: string): Promise<DocumentTemplate | null> {
  if (templateId && PRD_TEMPLATE_VARIANTS[templateId]) {
    return getSyncDocumentTemplate(documentType, templateId)
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

  return getSyncDocumentTemplate(documentType)
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

  const { data, error } = await query.maybeSingle()

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

export async function saveGeneratedDocument(
  projectId: string,
  documentType: string,
  freeTextPayload: Record<string, string>,
  isSnapshot = false,
  frozenData?: any,
  periodEnd?: string,
  templateId?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const access = await checkProjectFeatureAccess(projectId, 'documentation.engine')
    if (!access.allowed) {
      const err = `Feature locked: Requires ${access.requiredTier} tier`
      console.error(`[Document Action Error] saveGeneratedDocument locked: ${err}`)
      return { ok: false, error: err }
    }

    const supabase = await createClient()
    const adminSupabase = createAdminClient()
    const now = new Date().toISOString()
    const validUuid = isUuid(templateId) ? templateId : null
    let docId = ''

    if (isSnapshot) {
      const { data: newDoc, error } = await adminSupabase
        .from('generated_documents')
        .insert({
          project_id: projectId,
          document_type: documentType,
          custom_template_id: validUuid,
          free_text_content: freeTextPayload,
          is_snapshot: true,
          frozen_data: frozenData,
          period_end: periodEnd,
          generated_at: now,
          updated_at: now,
        })
        .select('id')
        .single()

      if (error) {
        console.error('[Document Action Error] Failed to insert snapshot document:', error)
        return { ok: false, error: error.message }
      }
      docId = newDoc?.id || projectId
      await logProjectActivity(projectId, 'document', docId, 'published', { period_end: periodEnd, document_type: documentType })
    } else {
      // Drafts are upserted using adminSupabase to guarantee reviewer sign-offs persist regardless of user RLS role
      const { data: existing } = await adminSupabase
        .from('generated_documents')
        .select('id')
        .eq('project_id', projectId)
        .eq('document_type', documentType)
        .eq('is_snapshot', false)
        .maybeSingle()

      if (existing) {
        docId = existing.id
        const { error } = await adminSupabase
          .from('generated_documents')
          .update({
            custom_template_id: validUuid,
            free_text_content: freeTextPayload,
            updated_at: now,
          })
          .eq('id', existing.id)

        if (error) {
          console.error('[Document Action Error] Failed to update draft document:', error)
          return { ok: false, error: error.message }
        }
        await logProjectActivity(projectId, 'document', existing.id, 'updated', { document_type: documentType })
      } else {
        const { data: newDoc, error } = await adminSupabase
          .from('generated_documents')
          .insert({
            project_id: projectId,
            document_type: documentType,
            custom_template_id: validUuid,
            free_text_content: freeTextPayload,
            is_snapshot: false,
            generated_at: now,
            updated_at: now,
          })
          .select('id')
          .single()

        if (error) {
          console.error('[Document Action Error] Failed to insert draft document:', error)
          return { ok: false, error: error.message }
        }
        docId = newDoc?.id || projectId
        await logProjectActivity(projectId, 'document', docId, 'created', { document_type: documentType })
      }
    }

    const { data: authData } = await supabase.auth.getUser()
    if (authData?.user?.id) {
      dispatchNotification({
        userId: authData.user.id,
        projectId,
        triggerType: isSnapshot ? 'status_report' : 'document_change',
        referenceEntityType: 'document',
        referenceEntityId: docId || projectId,
        contentSummary: isSnapshot
          ? `Published status report snapshot for period ending ${periodEnd || 'now'}`
          : `Generated/updated ${documentType} document draft`
      }).catch(err => console.error('Webhook notification failed:', err))
    }

    return { ok: true }
  } catch (err: any) {
    console.error('[Document Action Exception] saveGeneratedDocument failed:', err)
    return { ok: false, error: err?.message || 'Failed to save document' }
  }
}

export async function updateDocumentTemplateId(
  projectId: string,
  documentType: string,
  templateId?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const access = await checkProjectFeatureAccess(projectId, 'documentation.engine')
    if (!access.allowed) {
      const err = `Feature locked: Requires ${access.requiredTier} tier`
      console.error(`[Document Action Error] updateDocumentTemplateId locked: ${err}`)
      return { ok: false, error: err }
    }

    const adminSupabase = createAdminClient()
    const now = new Date().toISOString()
    const validUuid = isUuid(templateId) ? templateId : null
    
    const { data: existing } = await adminSupabase
      .from('generated_documents')
      .select('id, free_text_content')
      .eq('project_id', projectId)
      .eq('document_type', documentType)
      .eq('is_snapshot', false)
      .maybeSingle()

    if (existing) {
      const freeText = (existing.free_text_content as Record<string, string>) || {}
      if (templateId && PRD_TEMPLATE_VARIANTS[templateId]) {
        const variant = PRD_TEMPLATE_VARIANTS[templateId]
        freeText['__prd_template_variant'] = templateId
        freeText['__section_order'] = JSON.stringify(variant.section_definitions.map((s) => s.key))
        delete freeText['__custom_sections']
        delete freeText['__deleted_section_keys']
        delete freeText['__removed_sections_meta']
      } else if (!templateId) {
        delete freeText['__prd_template_variant']
        delete freeText['__section_order']
        delete freeText['__custom_sections']
        delete freeText['__deleted_section_keys']
        delete freeText['__removed_sections_meta']
      }

      const { error } = await adminSupabase
        .from('generated_documents')
        .update({
          custom_template_id: validUuid,
          free_text_content: freeText,
          updated_at: now,
        })
        .eq('id', existing.id)

      if (error) {
        console.error('[Document Action Error] Failed to update document template ID:', error)
        return { ok: false, error: error.message }
      }
    } else {
      const freeText: Record<string, string> = {}
      if (templateId && PRD_TEMPLATE_VARIANTS[templateId]) {
        const variant = PRD_TEMPLATE_VARIANTS[templateId]
        freeText['__prd_template_variant'] = templateId
        freeText['__section_order'] = JSON.stringify(variant.section_definitions.map((s) => s.key))
      }

      const { error } = await adminSupabase
        .from('generated_documents')
        .insert({
          project_id: projectId,
          document_type: documentType,
          custom_template_id: validUuid,
          free_text_content: freeText,
          is_snapshot: false,
          generated_at: now,
          updated_at: now,
        })

      if (error) {
        console.error('[Document Action Error] Failed to insert document with template ID:', error)
        return { ok: false, error: error.message }
      }
    }
    
    return { ok: true }
  } catch (err: any) {
    console.error('[Document Action Exception] updateDocumentTemplateId failed:', err)
    return { ok: false, error: err?.message || 'Failed to update template ID' }
  }
}

export async function regenerateDocument(
  projectId: string,
  documentType: string,
  isSnapshot = false
): Promise<{ ok: boolean; error?: string }> {
  const access = await checkProjectFeatureAccess(projectId, 'documentation.engine')
  if (!access.allowed) return { ok: false, error: `Feature locked: Requires ${access.requiredTier} tier` }

  const adminSupabase = createAdminClient()
  const now = new Date().toISOString()

  if (isSnapshot) {
    return { ok: false, error: 'Cannot regenerate a snapshot directly this way' }
  }
  
  const { data: existing } = await adminSupabase
    .from('generated_documents')
    .select('id')
    .eq('project_id', projectId)
    .eq('document_type', documentType)
    .eq('is_snapshot', false)
    .maybeSingle()

  if (existing) {
    const { error } = await adminSupabase
      .from('generated_documents')
      .update({ generated_at: now, updated_at: now })
      .eq('id', existing.id)

    if (error) return { ok: false, error: error.message }
  } else {
    const { error } = await adminSupabase
      .from('generated_documents')
      .insert({
        project_id: projectId,
        document_type: documentType,
        free_text_content: {},
        is_snapshot: false,
        generated_at: now,
        updated_at: now,
      })

    if (error) return { ok: false, error: error.message }
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { ok: true }
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

    // 1. Fetch organization members directly
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

    // 2. Fetch project members
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

    // 3. Fallback: Query profiles table directly if list is still empty
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

    // 4. Fallback: Auth Users via admin API
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

    // 5. Always include current logged-in user
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

    const membersList = Array.from(membersMap.values())

    return {
      currentUserId: currentUser?.id,
      isAdmin,
      members: membersList,
    }
  } catch (err) {
    console.error('Error in getProjectOrOrgMembers:', err)
    return { members: [] }
  }
}

export async function dispatchReviewerAssignmentNotification(
  projectId: string,
  documentType: string,
  targetUserId: string,
  targetUserName: string,
  roleTitle: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const adminSupabase = createAdminClient()

    let projectName = 'Project Workspace'
    try {
      const { data: proj } = await adminSupabase
        .from('projects')
        .select('name')
        .eq('id', projectId)
        .maybeSingle()
      if (proj?.name) projectName = proj.name
    } catch (e) {
      console.warn('Project name fetch error for reviewer notification:', e)
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const actionUrl = `${siteUrl}/dashboard/projects/${projectId}?tab=documents`

    const emailContext = {
      subject: `[Prazaner PM] Document Reviewer Assignment: ${projectName}`,
      title: `You have been assigned as a Document Reviewer`,
      message: `Hello ${targetUserName},\n\nYou have been designated as a formal ${roleTitle} reviewer for "${projectName}". Please log into your dashboard to inspect the document and record your sign-off decision.`,
      actionUrl,
    }

    await dispatchNotification({
      userId: targetUserId,
      triggerType: 'assignment',
      referenceEntityType: 'document',
      referenceEntityId: projectId,
      projectId,
      contentSummary: `Assigned as ${roleTitle} document reviewer for ${projectName}`,
      emailContext,
    })

    return { ok: true }
  } catch (err: any) {
    console.error('Error dispatching reviewer assignment notification:', err)
    return { ok: false, error: err?.message || 'Failed to dispatch notification' }
  }
}

export async function dispatchStatusChangeNotificationToPM(
  projectId: string,
  documentType: string,
  reviewerName: string,
  roleTitle: string,
  newStatus: 'pending' | 'approved' | 'changes_requested'
): Promise<{ ok: boolean; error?: string }> {
  try {
    const adminSupabase = createAdminClient()

    const { data: proj } = await adminSupabase
      .from('projects')
      .select('name, created_by, organization_id')
      .eq('id', projectId)
      .maybeSingle()

    if (!proj) return { ok: false, error: 'Project not found' }

    let pmUserId = proj.created_by

    if (!pmUserId && proj.organization_id) {
      const { data: org } = await adminSupabase
        .from('organizations')
        .select('owner_id')
        .eq('id', proj.organization_id)
        .maybeSingle()
      if (org?.owner_id) pmUserId = org.owner_id
    }

    if (!pmUserId) return { ok: true }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const actionUrl = `${siteUrl}/dashboard/projects/${projectId}?tab=documents`
    const statusLabel = newStatus === 'approved' ? 'Approved 🟢' : newStatus === 'changes_requested' ? 'Changes Requested 🔴' : 'Pending Review 🟡'

    const emailContext = {
      subject: `[Prazaner PM] Sign-Off Update (${statusLabel}): ${proj.name}`,
      title: `Document Sign-Off Status Updated`,
      message: `Hello,\n\n${reviewerName} (${roleTitle}) has updated their sign-off status to "${statusLabel}" for the document in project "${proj.name}".\n\nPlease click the button below to inspect the updated document governance workspace.`,
      actionUrl,
    }

    await dispatchNotification({
      userId: pmUserId,
      triggerType: 'approval_update',
      referenceEntityType: 'document',
      referenceEntityId: projectId,
      projectId,
      contentSummary: `${reviewerName} (${roleTitle}) updated sign-off status to ${statusLabel} for ${proj.name}`,
      emailContext,
    })

    return { ok: true }
  } catch (err: any) {
    console.error('Error dispatching PM status change notification:', err)
    return { ok: false, error: err?.message || 'Failed to dispatch notification' }
  }
}

'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { dispatchNotification } from '@/lib/notifications/dispatch'

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

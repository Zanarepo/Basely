'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { logProjectActivity } from '@/lib/projects/activity-actions'
import { dispatchNotification, sendDirectEmail } from '@/lib/notifications/actions'
import { headers } from 'next/headers'

export interface ProjectSignoffRecord {
  id: string
  project_id: string
  signer_type: 'internal_user' | 'external_stakeholder'
  signer_name: string
  signer_email: string
  token: string | null
  expires_at: string | null
  signed_at: string | null
  signature_reference: string | null
  comments: string | null
  created_at: string
}

export interface SignoffTokenVerificationResult {
  ok: boolean
  error?: string
  signoff?: ProjectSignoffRecord
  project?: {
    id: string
    name: string
    client_name: string | null
    methodology: string
    lifecycle_status?: string
  }
}

async function getRequestOrigin(): Promise<string> {
  try {
    const headersList = await headers()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    return `${protocol}://${host}`
  } catch {
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  }
}

/**
 * Retrieves all sign-off invitations and completed acceptance records for a project.
 */
export async function getProjectSignoffs(projectId: string): Promise<ProjectSignoffRecord[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('project_signoffs')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to query project signoffs:', error)
    return []
  }

  return data as ProjectSignoffRecord[]
}

/**
 * Creates a new sign-off requirement for either an internal workspace member
 * or an unauthenticated external stakeholder with a secure UUID token.
 */
export async function createSignoffInvitation(
  projectId: string,
  signerName: string,
  signerEmail: string,
  signerType: 'internal_user' | 'external_stakeholder'
): Promise<{ ok: boolean; error?: string; token?: string; inviteUrl?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'Unauthorized: Sign in required.' }
  }

  let token: string | null = null
  let expires_at: string | null = null
  let inviteUrl: string | undefined = undefined
  const origin = await getRequestOrigin()

  if (signerType === 'external_stakeholder') {
    token = `sign_${crypto.randomUUID()}_${Date.now().toString(36)}`
    // Default expiration: 14 days
    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() + 14)
    expires_at = expirationDate.toISOString()
    inviteUrl = `${origin}/signoff?token=${encodeURIComponent(token)}`
  }

  const { error } = await supabase
    .from('project_signoffs')
    .insert([{
      project_id: projectId,
      signer_type: signerType,
      signer_name: signerName.trim(),
      signer_email: signerEmail.trim().toLowerCase(),
      token,
      expires_at
    }])

  if (error) {
    console.error('Failed to insert project sign-off record:', error)
    return { ok: false, error: error.message }
  }

  await logProjectActivity(projectId, 'project', projectId, 'created', {
    signoff_invitation: { signerName, signerEmail, signerType }
  })

  // Fetch project title for informative notifications & emails
  const { data: projData } = await supabase.from('projects').select('name').eq('id', projectId).maybeSingle()
  const projectName = projData?.name || 'Project Closure'

  if (signerType === 'external_stakeholder' && inviteUrl) {
    // Dedicated External Stakeholder workflow: custom invitation text & secure unauthenticated token portal link
    try {
      await sendDirectEmail(signerEmail.trim(), {
        subject: `[Basely PM] External Stakeholder Sign-Off & Acceptance: ${projectName}`,
        title: `Project Completion Deliverable Sign-Off`,
        message: `Hello ${signerName.trim()},\n\nThe project leadership team invites you to evaluate and execute formal completion sign-off for "${projectName}". As an external stakeholder or client sponsor, no account registration or login is required. Click the secure acceptance portal link below to review project completion details and record your digital acceptance signature.`,
        actionUrl: inviteUrl
      })
    } catch (err) {
      console.warn('External sign-off email delivery skipped or failed (check RESEND_API_KEY):', err)
    }
  } else {
    // Dedicated Internal User workflow: dashboard link & workspace notifications
    const internalUrl = `${origin}/dashboard/projects/${projectId}?tab=documents&doc=signoff_board`
    const adminClient = createAdminClient()
    const { data: targetProfile } = await adminClient
      .from('profiles')
      .select('id')
      .ilike('email', signerEmail.trim())
      .maybeSingle()

    const internalEmailContext = {
      subject: `[Basely PM] Internal Sign-Off Requested: ${projectName}`,
      title: `Internal Workspace Closure Sign-Off`,
      message: `Hello ${signerName.trim()},\n\nYou have been assigned as an internal reviewer to formally verify and sign off on project completion deliverables for "${projectName}". Please access your project workspace using the link below to confirm and execute your digital signature.`,
      actionUrl: internalUrl
    }

    if (targetProfile?.id) {
      // Dispatch comprehensive multi-channel alert: In-app badge + Slack webhook + automated email
      await dispatchNotification({
        userId: targetProfile.id,
        triggerType: 'approval_request',
        referenceEntityType: 'project',
        referenceEntityId: projectId,
        projectId,
        contentSummary: `You have been designated as a signer for "${projectName}". Formal closure sign-off requested.`,
        emailContext: internalEmailContext
      })
    } else {
      // If internal team member hasn't initialized their profile yet, dispatch email directly
      try {
        await sendDirectEmail(signerEmail.trim(), internalEmailContext)
      } catch (err) {
        console.warn('Internal sign-off email delivery skipped or failed (check RESEND_API_KEY):', err)
      }
    }
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { ok: true, token: token || undefined, inviteUrl }
}

/**
 * Verifies an external sign-off token without requiring a user account or login session.
 */
export async function verifySignoffToken(token: string): Promise<SignoffTokenVerificationResult> {
  if (!token || !token.trim()) {
    return { ok: false, error: 'No acceptance token provided.' }
  }

  const supabase = createAdminClient()
  
  const { data: signoff, error: signErr } = await supabase
    .from('project_signoffs')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  if (signErr || !signoff) {
    return { ok: false, error: 'Invalid or missing project closure acceptance link.' }
  }

  if (signoff.expires_at && new Date(signoff.expires_at) < new Date() && !signoff.signed_at) {
    return { ok: false, error: 'This sign-off link has expired. Please request a new acceptance URL from your Project Manager.' }
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, client_name, methodology, lifecycle_status')
    .eq('id', signoff.project_id)
    .maybeSingle()

  return {
    ok: true,
    signoff: signoff as ProjectSignoffRecord,
    project: project || undefined
  }
}

/**
 * Executes formal project sign-off and permanent acceptance signature stamping.
 * Uses admin bypass for valid tokens or standard auth for logged-in internal users.
 */
export async function submitProjectSignoff({
  signoffId,
  token,
  signatureReference,
  comments
}: {
  signoffId?: string
  token?: string
  signatureReference: string
  comments?: string
}): Promise<{ ok: boolean; error?: string }> {
  if (!signatureReference || !signatureReference.trim()) {
    return { ok: false, error: 'A typed signature or verification reference is required.' }
  }

  const timestamp = new Date().toISOString()

  // Case 1: Token-based external unauthenticated access
  if (token) {
    const supabase = createAdminClient()
    const { data: record, error: findErr } = await supabase
      .from('project_signoffs')
      .select('*')
      .eq('token', token)
      .maybeSingle()

    if (findErr || !record) return { ok: false, error: 'Invalid sign-off token.' }
    if (record.signed_at) return { ok: false, error: 'This acceptance record has already been formally executed and is locked against alteration.' }

    const { error: updErr } = await supabase
      .from('project_signoffs')
      .update({
        signed_at: timestamp,
        signature_reference: signatureReference.trim(),
        comments: comments?.trim() || null
      })
      .eq('id', record.id)

    if (updErr) return { ok: false, error: updErr.message }

    // Log background completion activity
    await logProjectActivity(record.project_id, 'project', record.project_id, 'approved', {
      signoff_completed: { by: record.signer_name, type: 'external_stakeholder', signature: signatureReference }
    })

    return { ok: true }
  }

  // Case 2: Internal authenticated platform user
  if (!signoffId) return { ok: false, error: 'Missing sign-off identifier.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Unauthorized: Sign in required.' }

  const { data: record, error: findErr } = await supabase
    .from('project_signoffs')
    .select('id, project_id, signed_at, signer_name')
    .eq('id', signoffId)
    .maybeSingle()

  if (findErr || !record) return { ok: false, error: 'Sign-off record not found.' }
  if (record.signed_at) return { ok: false, error: 'Record already signed and immutable.' }

  const { error: updErr } = await supabase
    .from('project_signoffs')
    .update({
      signed_at: timestamp,
      signature_reference: signatureReference.trim(),
      comments: comments?.trim() || null
    })
    .eq('id', signoffId)

  if (updErr) return { ok: false, error: updErr.message }

  await logProjectActivity(record.project_id, 'project', record.project_id, 'approved', {
    signoff_completed: { by: record.signer_name, type: 'internal_user', signature: signatureReference }
  })

  await dispatchNotification({
    userId: user.id,
    triggerType: 'approval_update',
    referenceEntityType: 'project',
    referenceEntityId: record.project_id,
    projectId: record.project_id,
    contentSummary: `Formal Project Sign-off completed by ${record.signer_name} (${signatureReference}).`
  })

  revalidatePath(`/dashboard/projects/${record.project_id}`)
  return { ok: true }
}

/**
 * Deletes a single project signoff card (internal or external).
 */
export async function deleteProjectSignoff(signoffId: string, projectId: string): Promise<{ ok: boolean; error?: string }> {
  if (!signoffId || !projectId) {
    return { ok: false, error: 'Missing required sign-off identification.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Unauthorized: Sign in required.' }

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('project_signoffs')
    .delete()
    .eq('id', signoffId)
    .eq('project_id', projectId)

  if (error) {
    console.error('Failed to delete signoff card:', error)
    return { ok: false, error: error.message }
  }

  await logProjectActivity(projectId, 'project', projectId, 'deleted', {
    signoff_deleted: { signoff_id: signoffId, deleted_by: user.email || user.id }
  })

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { ok: true }
}

/**
 * Performs bulk deletion of selected project signoff cards.
 */
export async function bulkDeleteProjectSignoffs(signoffIds: string[], projectId: string): Promise<{ ok: boolean; error?: string }> {
  if (!signoffIds || signoffIds.length === 0 || !projectId) {
    return { ok: false, error: 'No sign-off records selected for deletion.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Unauthorized: Sign in required.' }

  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('project_signoffs')
    .delete()
    .in('id', signoffIds)
    .eq('project_id', projectId)

  if (error) {
    console.error('Failed to perform bulk signoff card deletion:', error)
    return { ok: false, error: error.message }
  }

  await logProjectActivity(projectId, 'project', projectId, 'deleted', {
    signoffs_bulk_deleted: { count: signoffIds.length, deleted_by: user.email || user.id }
  })

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { ok: true }
}

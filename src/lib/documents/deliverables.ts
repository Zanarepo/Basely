'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { submitProjectSignoff } from '@/lib/projects/signoff-actions'
import { sendDirectEmail } from '@/lib/notifications/actions'

export type DeliverableItem = {
  id: string
  name: string
  signoff?: {
    id: string
    signed_by_type: 'internal_user' | 'external_stakeholder'
    signed_by_reference: string
    signed_at: string | null
    token: string | null
  }
}

export async function getDeliverables(projectId: string): Promise<DeliverableItem[]> {
  const supabase = await createClient()
  
  // Fetch WBS elements for this project that have a deliverable_name (or just all WBS elements)
  const { data: wbs, error } = await supabase
    .from('wbs_elements')
    .select('id, name, deliverable_signoffs(id, signed_by_type, signed_by_reference, signed_at, token)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching WBS elements:', error)
    return []
  }

  return (wbs || []).map((item: any) => ({
    id: item.id,
    name: item.name,
    signoff: item.deliverable_signoffs && item.deliverable_signoffs.length > 0 
      ? [...item.deliverable_signoffs].sort((a: any, b: any) => {
          // Prefer signed records over unsigned ones
          if (a.signed_at && !b.signed_at) return -1
          if (!a.signed_at && b.signed_at) return 1
          // Otherwise prefer the most recently created (we can use ID string comparison as a proxy if created_at isn't fetched, but let's just pick the last one)
          return 0
        })[0]
      : undefined
  }))
}

export async function generateDeliverableSignoffLink(wbsId: string, stakeholderId: string, options?: { skipEmail?: boolean, isInternal?: boolean }): Promise<{ ok: boolean, error?: string, inviteUrl?: string }> {
  const supabase = await createClient()
  
  // Fetch stakeholder details
  const { data: stakeholder } = await supabase
    .from('stakeholders')
    .select('name, email')
    .eq('id', stakeholderId)
    .single()

  if (!stakeholder) {
    return { ok: false, error: 'Stakeholder not found' }
  }

  // Generate token specific to deliverables
  const token = `sign_deliverable_${crypto.randomUUID()}_${Date.now().toString(36)}`
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const inviteUrl = `${origin}/signoff?token=${encodeURIComponent(token)}`

  // Insert a new deliverable_signoff record
  const { error } = await supabase
    .from('deliverable_signoffs')
    .insert({
      wbs_element_id: wbsId,
      signed_by_type: options?.isInternal ? 'internal_user' : 'external_stakeholder',
      signed_by_reference: stakeholder.email ? `${stakeholder.name} (${stakeholder.email})` : stakeholder.name,
      token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days expiry
    })

  if (error) {
    return { ok: false, error: error.message }
  }

  // Fetch project name and wbs name for email
  const { data: wbs } = await supabase
    .from('wbs_elements')
    .select('name, project_id, project:projects(name)')
    .eq('id', wbsId)
    .single()

  if (wbs?.project_id) {
    revalidatePath(`/dashboard/projects/${wbs.project_id}`)
  }

  // Auto-send email if requested and stakeholder has an email address
  if (!options?.skipEmail && stakeholder.email && wbs) {
    try {
      await sendDirectEmail(stakeholder.email, {
        subject: `Signature Requested: ${wbs.name}`,
        title: `Signature Requested for Deliverable: ${wbs.name}`,
        message: `You have been requested to review and sign-off on the deliverable "${wbs.name}" for the project "${(wbs.project as any)?.name || 'Project'}". Please click the link below to securely submit your digital signature.`,
        actionUrl: inviteUrl
      })
    } catch (emailErr) {
      console.error('Failed to auto-send email to stakeholder:', emailErr)
    }
  }

  return { ok: true, inviteUrl }
}

export async function getProjectStakeholders(projectId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stakeholders')
    .select('id, name, email')
    .eq('project_id', projectId)
    .eq('organization_type', 'external')
    .order('name')
  
  if (error) {
    console.error('Error fetching stakeholders:', error)
    return []
  }
  return data || []
}

export async function getProjectMembers(projectId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stakeholders')
    .select('id, name, email, role_title')
    .eq('project_id', projectId)
    .eq('organization_type', 'internal')
    .order('name')
  
  if (error) {
    console.error('Error fetching project members:', error)
    return []
  }
  return data || []
}

export async function initiateInternalDeliverableSignoff(wbsId: string, reference: string): Promise<{ ok: boolean, error?: string }> {
  const supabase = await createClient()

  // Insert an internal signoff record un-signed
  const { data: record, error } = await supabase
    .from('deliverable_signoffs')
    .insert({
      wbs_element_id: wbsId,
      signed_by_type: 'internal_user',
      signed_by_reference: reference,
    })
    .select('id')
    .single()

  if (error) {
    return { ok: false, error: error.message }
  }

  // Immediately use the exact signoff-actions.ts code path to complete the sign-off internally
  const result = await submitProjectSignoff({
    signoffId: record.id,
    signatureReference: reference,
    comments: 'Internal Deliverable Sign-off'
  })

  const { data: wbs } = await supabase.from('wbs_elements').select('project_id').eq('id', wbsId).single()
  if (wbs?.project_id) {
    revalidatePath(`/dashboard/projects/${wbs.project_id}`)
  }

  return result
}

export async function deleteSignoffs(signoffIds: string[]): Promise<{ ok: boolean, error?: string }> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('deliverable_signoffs')
    .delete()
    .in('id', signoffIds)
    
  if (error) {
    return { ok: false, error: error.message }
  }
  
  return { ok: true }
}

'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

import { dispatchNotification } from '@/lib/notifications/actions'

export type Comment = {
  id: string
  project_id: string
  entity_type: 'activity' | 'document' | 'risk' | 'issue'
  entity_id: string
  author_user_id: string
  body: string
  created_at: string
  edited_at: string | null
  deleted_at: string | null
  parent_id?: string | null
  author?: {
    id: string
    name: string
    avatar_url: string | null
  }
  mentions?: Mention[]
}

export type Mention = {
  id: string
  comment_id: string
  mentioned_stakeholder_id: string | null
  mentioned_user_id: string | null
  stakeholder?: { id: string, name: string }
  user?: { id: string, name: string }
}

export async function getComments(projectId: string, entityType: string, entityId: string): Promise<Comment[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      author:profiles!comments_author_user_id_fkey(id, name:full_name, avatar_url),
      mentions(
        *,
        stakeholder:stakeholders!mentions_mentioned_stakeholder_id_fkey(id, name),
        user:profiles!mentions_mentioned_user_id_fkey(id, name:full_name)
      )
    `)
    .eq('project_id', projectId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching comments:', error)
    return []
  }

  return data as any[]
}

export async function postComment(
  projectId: string,
  entityType: 'activity' | 'document' | 'risk' | 'issue' | 'wbs',
  entityId: string,
  body: string,
  mentionsToCreate: { stakeholderId?: string, userId?: string }[] = [],
  parentId?: string
): Promise<{ success: boolean; comment?: Comment; error?: string }> {
  const supabase = await createClient()

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) return { success: false, error: 'Unauthorized' }

  // 1. Insert comment
  const { data: newComment, error: commentError } = await supabase
    .from('comments')
    .insert({
      project_id: projectId,
      entity_type: entityType,
      entity_id: entityId,
      author_user_id: userData.user.id,
      body: body,
      parent_id: parentId || null
    })
    .select('*')
    .single()

  if (commentError) {
    console.error('Error posting comment:', commentError)
    return { success: false, error: commentError.message }
  }

  // 2. Insert mentions if any
  if (mentionsToCreate.length > 0) {
    const mentionInserts = mentionsToCreate.map(m => ({
      comment_id: newComment.id,
      mentioned_stakeholder_id: m.stakeholderId || null,
      mentioned_user_id: m.userId || null
    }))

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )

    const { error: mentionError } = await supabaseAdmin
      .from('mentions')
      .insert(mentionInserts)

    if (mentionError) {
      console.error('Error posting mentions:', mentionError)
    } else {
      // 3. Dispatch Notifications asynchronously for user mentions
      let urlHash = `tab=wbs&elementId=${entityId}`
      let entityName = 'an item'

      if (entityType === 'wbs') {
        const { data } = await supabaseAdmin.from('wbs_elements').select('name').eq('id', entityId).single()
        if (data) entityName = data.name
      } else if (entityType === 'risk') {
        urlHash = `tab=risks&riskId=${entityId}`
        const { data } = await supabaseAdmin.from('risks').select('title').eq('id', entityId).single()
        if (data) entityName = data.title
      } else if (entityType === 'issue') {
        urlHash = `tab=risks&issueId=${entityId}`
        const { data } = await supabaseAdmin.from('issues').select('title').eq('id', entityId).single()
        if (data) entityName = data.title
      } else if (entityType === 'document') {
        const { data } = await supabaseAdmin.from('generated_documents').select('document_type').eq('id', entityId).single()
        if (data) {
          entityName = data.document_type.charAt(0).toUpperCase() + data.document_type.slice(1).replace('_', ' ')
          urlHash = `tab=documents&doc=${data.document_type}`
        } else {
          urlHash = `tab=documents`
        }
      } else if (entityType === 'activity') {
        urlHash = `tab=wbs&elementId=${entityId}`
        const { data } = await supabaseAdmin.from('wbs_elements').select('name').eq('id', entityId).single()
        if (data) entityName = data.name
      }

      const { data: authorProfile } = await supabaseAdmin.from('profiles').select('full_name').eq('id', userData.user.id).single()
      const authorName = authorProfile?.full_name || 'Someone'

      const notifiedUserIds = new Set<string>()

      await Promise.all(mentionsToCreate.map(async m => {
        let targetUserId = m.userId
        if (!targetUserId && m.stakeholderId) {
          const { data: stData } = await supabaseAdmin.from('stakeholders').select('linked_user_id').eq('id', m.stakeholderId).single()
          if (stData?.linked_user_id) targetUserId = stData.linked_user_id
        }

        if (targetUserId && targetUserId !== userData.user.id && !notifiedUserIds.has(targetUserId)) {
          notifiedUserIds.add(targetUserId)
          // Remove the @mentions from the body snippet so it doesn't redundantly show the recipient's name
          const snippet = body.replace(/@[a-zA-Z0-9_\- ]+/g, '').trim() || 'left a comment'

          await dispatchNotification({
            userId: targetUserId,
            triggerType: 'mention',
            referenceEntityType: entityType,
            referenceEntityId: entityId,
            projectId: projectId,
            contentSummary: `${authorName} mentioned you in "${entityName}"`,
            emailContext: {
              subject: `You were mentioned in a ${entityType}`,
              title: `New Mention`,
              message: `<strong>${authorName}</strong> mentioned you in <strong>${entityName}</strong>:<br><br><em>"${snippet}"</em>`,
              actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/projects/${projectId}?${urlHash}`
            }
          })
        }
      }))

      // Automatically notify the Risk or Issue Owner if they weren't explicitly mentioned
      if (entityType === 'risk' || entityType === 'issue') {
        const table = entityType === 'risk' ? 'risks' : 'issues'
        const { data: entityData } = await supabaseAdmin.from(table).select('owner_stakeholder_id').eq('id', entityId).single()

        if (entityData?.owner_stakeholder_id) {
          const { data: stData } = await supabaseAdmin.from('stakeholders').select('linked_user_id').eq('id', entityData.owner_stakeholder_id).single()
          const ownerUserId = stData?.linked_user_id

          if (ownerUserId && ownerUserId !== userData.user.id && !notifiedUserIds.has(ownerUserId)) {
            const snippet = body.replace(/@[a-zA-Z0-9_\- ]+/g, '').trim() || 'left a comment'
            await dispatchNotification({
              userId: ownerUserId,
              triggerType: entityType === 'risk' ? 'risk_change' : 'issue_change' as any,
              referenceEntityType: entityType,
              referenceEntityId: entityId,
              projectId: projectId,
              contentSummary: `${authorName} commented on your ${entityType}: "${entityName}"`,
              emailContext: {
                subject: `New comment on your ${entityType}`,
                title: `New Comment`,
                message: `<strong>${authorName}</strong> commented on the ${entityType} you own (<strong>${entityName}</strong>):<br><br><em>"${snippet}"</em>`,
                actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/projects/${projectId}?${urlHash}`
              }
            })
          }
        }
      }
    }
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { success: true, comment: newComment as any }
}

export async function updateComment(
  commentId: string,
  body: string,
  mentionsToCreate: { stakeholderId?: string, userId?: string }[] = []
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // 1. Update comment body & edited_at
  const { error: updateError } = await supabase
    .from('comments')
    .update({
      body,
      edited_at: new Date().toISOString()
    })
    .eq('id', commentId)

  if (updateError) {
    console.error('Error updating comment:', updateError)
    return { success: false, error: updateError.message }
  }

  // 2. We could update mentions here, but typically editing a comment might involve wiping old mentions and recreating.
  // For simplicity in this sprint, we'll just append new mentions if any are passed, or just ignore mention updates.
  // A robust implementation would delta the mentions. We'll leave delta logic for later if needed.

  return { success: true }
}

export async function deleteComment(commentId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Soft delete
  const { error } = await supabase
    .from('comments')
    .update({
      deleted_at: new Date().toISOString()
    })
    .eq('id', commentId)

  if (error) {
    console.error('Error deleting comment:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

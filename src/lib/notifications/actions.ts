'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export type NotificationTriggerType = 'mention' | 'assignment' | 'risk_change' | 'cost_change' | 'schedule_change' | 'document_change' | 'status_report' | 'approval_request' | 'approval_update'

export interface NotificationPayload {
  userId: string
  triggerType: NotificationTriggerType
  referenceEntityType: string
  referenceEntityId: string
  projectId?: string
  contentSummary: string
  emailContext?: {
    subject: string
    title: string
    message: string
    actionUrl: string
  }
}

export type AppNotification = {
  id: string
  user_id: string
  trigger_type: NotificationTriggerType
  reference_entity_type: string
  reference_entity_id: string
  project_id: string | null
  content_summary: string
  read_at: string | null
  created_at: string
}

export type NotificationPreferences = {
  id: string
  user_id: string
  email_enabled: boolean
  slack_enabled: boolean
}

/**
 * Generic dispatcher for all platform notifications.
 * Routes to In-App, Email, and Slack based on user preferences.
 */
export async function dispatchNotification(payload: NotificationPayload) {
  // Use Admin Client to bypass RLS since users cannot insert notifications for others directly
  const supabase = createAdminClient()

  // 1. Fetch User Preferences
  const { data: prefsData } = await supabase
    .from('notification_preferences')
    .select('email_enabled, slack_enabled')
    .eq('user_id', payload.userId)
    .single()

  // If no preferences row exists yet, defaults are email=true, slack=false
  const emailEnabled = prefsData ? prefsData.email_enabled : true
  const slackEnabled = prefsData ? prefsData.slack_enabled : false

  // 2. In-App Notification (Always fires)
  const { error: insertError } = await supabase
    .from('notifications')
    .insert({
      user_id: payload.userId,
      trigger_type: payload.triggerType,
      reference_entity_type: payload.referenceEntityType,
      reference_entity_id: payload.referenceEntityId,
      project_id: payload.projectId || null,
      content_summary: payload.contentSummary,
    })

  if (insertError) {
    console.error('Failed to insert in-app notification', insertError)
  }

  // Fetch the target user's profile once to use across dispatchers
  const { data: userData } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', payload.userId)
    .single()

  // 3. Email Delivery
  if (emailEnabled && payload.emailContext) {
    if (userData && userData.email) {
      try {
        await sendEmail(userData.email, payload.emailContext)
      } catch (err) {
        console.error('Failed to dispatch email notification', err)
      }
    }
  }

  // 4. User-Level Personal Slack Delivery (Future)
  if (slackEnabled) {
    // TODO: When personal Slack DM integration is added, fetch user's Slack ID and dispatch.
    console.log(`[Slack Dispatch Stub] Would send personal slack notification to user ${payload.userId} for ${payload.triggerType}`)
  }

  // 5. Project-Level Webhook Deliveries (Slack & Microsoft Teams)
  if (payload.projectId) {
    const { data: projectData } = await supabase
      .from('projects')
      .select('name, slack_webhook_url, teams_webhook_url, google_chat_webhook_url')
      .eq('id', payload.projectId)
      .single()

    if (projectData) {
      // Slack Webhook Delivery
      if (projectData.slack_webhook_url) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const blocks: any[] = [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: `🚀 Update: ${projectData.name}`,
                emoji: true
              }
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: payload.contentSummary
              }
            },
            {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: `👤 *For:* ${userData?.full_name || 'A team member'}`
                }
              ]
            }
          ]

          if (payload.emailContext?.actionUrl) {
            blocks.push({
              type: "actions",
              elements: [
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "View Details",
                    emoji: true
                  },
                  url: payload.emailContext.actionUrl,
                  action_id: "view_action"
                }
              ]
            })
          }

          await fetch(projectData.slack_webhook_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: `Activity in ${projectData.name}: ${payload.contentSummary}`,
              blocks: blocks
            })
          })
        } catch (err) {
          console.error('Failed to dispatch project Slack webhook', err)
        }
      }

      // Microsoft Teams Webhook Delivery
      if (projectData.teams_webhook_url) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sections: any[] = [
            {
              activityTitle: `🚀 Update: ${projectData.name}`,
              activitySubtitle: payload.contentSummary,
              markdown: true,
              facts: [
                {
                  name: "For User",
                  value: userData?.full_name || 'A team member'
                }
              ]
            }
          ]

          const potentialAction = payload.emailContext?.actionUrl ? [
            {
              "@type": "OpenUri",
              "name": "View Details",
              "targets": [
                {
                  "os": "default",
                  "uri": payload.emailContext.actionUrl
                }
              ]
            }
          ] : []

          await fetch(projectData.teams_webhook_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              "@type": "MessageCard",
              "@context": "http://schema.org/extensions",
              "themeColor": "6264A7",
              "summary": `Activity in ${projectData.name}`,
              "sections": sections,
              "potentialAction": potentialAction
            })
          })
        } catch (err) {
          console.error('Failed to dispatch project Teams webhook', err)
        }
      }

      // Google Chat Webhook Delivery
      if (projectData.google_chat_webhook_url) {
        try {
          const detailUrl = payload.emailContext?.actionUrl ? `\n\n*View Details:* ${payload.emailContext.actionUrl}` : ''
          await fetch(projectData.google_chat_webhook_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: `🚀 *Update in ${projectData.name}*\n${payload.contentSummary}\n👤 *For:* ${userData?.full_name || 'A team member'}${detailUrl}`
            })
          })
        } catch (err) {
          console.error('Failed to dispatch project Google Chat webhook', err)
        }
      }
    }
  }
}

// Internal email sender mimicking the Sprint 1 invitation pattern
async function sendEmail(to: string, context: NonNullable<NotificationPayload['emailContext']>) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY is missing. Skipping email delivery.')
    return
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333;">${context.title}</h2>
      <p style="color: #555; line-height: 1.6;">${context.message}</p>
      <div style="margin-top: 30px;">
        <a href="${context.actionUrl}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          View Details
        </a>
      </div>
    </div>
  `

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.INVITE_EMAIL_FROM || process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: [to],
      subject: context.subject,
      html: html,
    }),

  })

  if (!response.ok) {
    throw new Error(`Resend API error: ${response.statusText}`)
  }
}

// ==========================================
// User Notification Management
// ==========================================

export async function getNotifications(): Promise<AppNotification[]> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return []

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching notifications:', error)
    return []
  }

  return data as AppNotification[]
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return 0

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userData.user.id)
    .is('read_at', null)

  if (error) return 0
  return count || 0
}

export async function markAsRead(notificationId: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return

  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userData.user.id)
}

export async function markAllAsRead() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return

  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userData.user.id)
    .is('read_at', null)
}

// ==========================================
// Preferences Management
// ==========================================

export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return null

  // Ensure row exists
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userData.user.id)
    .single()

  if (error && error.code === 'PGRST116') {
    // Create default row
    const { data: newData, error: insertError } = await supabase
      .from('notification_preferences')
      .insert({
        user_id: userData.user.id,
        email_enabled: true,
        slack_enabled: false
      })
      .select('*')
      .single()

    if (!insertError) return newData as NotificationPreferences
  }

  return data as NotificationPreferences
}

export async function updateNotificationPreferences(emailEnabled: boolean, slackEnabled: boolean) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return false

  const { error } = await supabase
    .from('notification_preferences')
    .upsert({
      user_id: userData.user.id,
      email_enabled: emailEnabled,
      slack_enabled: slackEnabled
    }, { onConflict: 'user_id' })

  if (error) {
    console.error('Error updating preferences:', error)
    return false
  }
  return true
}

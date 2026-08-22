'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import fs from 'fs'
import path from 'path'
import { NotificationPayload } from './types'

function getEmailLogoSrc(siteUrl: string): string {
  try {
    if (!siteUrl || siteUrl.includes('localhost') || siteUrl.includes('127.0.0.1')) {
      const logoPath = path.join(process.cwd(), 'public', 'prazaner_logo_transparent.png')
      if (fs.existsSync(logoPath)) {
        const b64 = fs.readFileSync(logoPath).toString('base64')
        return `data:image/png;base64,${b64}`
      }
    }
  } catch (err) {
    console.warn('Could not read local logo file for email base64 embedding:', err)
  }
  return `${siteUrl}/prazaner_logo_transparent.png`
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

  // Ensure reference_entity_id is a valid UUID for database column compatibility
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const validEntityId = uuidRegex.test(payload.referenceEntityId) 
    ? payload.referenceEntityId 
    : (payload.projectId || payload.userId || '00000000-0000-0000-0000-000000000000')

  // 2. In-App Notification (Always fires)
  const { error: insertError } = await supabase
    .from('notifications')
    .insert({
      user_id: payload.userId,
      trigger_type: payload.triggerType,
      reference_entity_type: payload.referenceEntityType,
      reference_entity_id: validEntityId,
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
        await sendDirectEmail(userData.email, payload.emailContext)
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
      .select('name, organization_id, slack_webhook_url, teams_webhook_url, google_chat_webhook_url')
      .eq('id', payload.projectId)
      .single()

    if (projectData) {
      // Slack Webhook Delivery
      if (projectData.slack_webhook_url) {
        try {
          const detailLink = payload.emailContext?.actionUrl ? `\n<${payload.emailContext.actionUrl}|*👉 View Details in Prazaner*>` : ''
          const slackText = `🚀 *New Update in ${projectData.name}*\n\n*Event:* \`${payload.triggerType}\`\n*Details:* ${payload.contentSummary}\n*For User:* ${userData?.full_name || 'Team member'}${detailLink}`

          const res = await fetch(projectData.slack_webhook_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: slackText
            })
          })
          if (!res.ok) {
            console.error(`Slack webhook rejected with status ${res.status}: ${await res.text()}`)
          } else {
            console.log(`✅ Successfully delivered real-time event to Project Slack Webhook`)
          }
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
            console.error('Failed to dispatch Google Chat notification', err)
          }
        }

        // 6. Organization-Level Developer Webhooks
        if (projectData.organization_id) {
          const { data: webhooks } = await supabase
            .from('webhook_subscriptions')
            .select('id, target_url, signing_secret')
            .eq('organization_id', projectData.organization_id)
            .eq('active', true)
            .in('event_type', [payload.triggerType, 'all', '*'])
          
          if (webhooks && webhooks.length > 0) {
            const webhookPayload = JSON.stringify({
              event: payload.triggerType,
              timestamp: new Date().toISOString(),
              data: {
                reference_entity_type: payload.referenceEntityType,
                reference_entity_id: payload.referenceEntityId,
                project_id: payload.projectId,
                content_summary: payload.contentSummary,
                title: payload.emailContext?.title || payload.contentSummary,
                description: payload.contentSummary,
                message: payload.contentSummary
              }
            })
            
            const encoder = new TextEncoder()
            
            for (const wh of webhooks) {
              try {
                const key = await crypto.subtle.importKey(
                  'raw',
                  encoder.encode(wh.signing_secret),
                  { name: 'HMAC', hash: 'SHA-256' },
                  false,
                  ['sign']
                )
                const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(webhookPayload))
                const signatureArray = Array.from(new Uint8Array(signatureBuffer))
                const signature = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('')

                const res = await fetch(wh.target_url, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': `sha256=${signature}`
                  },
                  body: webhookPayload
                })
                console.log(`Successfully dispatched ${payload.triggerType} webhook to ${wh.target_url} (status: ${res.status})`)
              } catch (err) {
                console.error(`Failed to dispatch developer webhook to ${wh.target_url}`, err)
              }
            }
          }
        }
      }
    }
}

// Internal and external email sender for platform invites & closure signoffs
export async function sendDirectEmail(to: string, context: { subject: string; title: string; message: string; actionUrl: string }) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY is missing. Skipping email delivery.')
    return
  }

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const logoSrc = getEmailLogoSrc(siteUrl)
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      </style>
    </head>
    <body style="font-family: 'Inter', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;">
      <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb;">
        <div style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 32px 24px; text-align: center;">
          <img src="${logoSrc}" alt="Prazaner" style="height: 42px; width: auto; max-width: 220px; display: inline-block; border: 0;" />
        </div>
        <div style="padding: 32px 24px;">
          <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin-top: 0; margin-bottom: 16px;">${context.title}</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 28px; white-space: pre-line;">${context.message}</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${context.actionUrl}" style="display: inline-block; background-color: #4f46e5; color: #ffffff !important; padding: 12px 26px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 8px;">
              <span style="color: #ffffff;">View Details</span>
            </a>
          </div>
          <div style="border-top: 1px solid #f3f4f6; padding-top: 24px; margin-top: 24px;">
            <p style="font-size: 14px; color: #6b7280; margin: 0;">Best regards,<br/><strong>The Prazaner Team</strong></p>
          </div>
        </div>
      </div>
      <div style="text-align: center; padding: 0 20px 30px;">
        <p style="font-size: 12px; color: #9ca3af; margin: 0;">&copy; ${new Date().getFullYear()} Prazaner Inc. All rights reserved.</p>
      </div>
    </body>
    </html>
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

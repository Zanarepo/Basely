'use server'

import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import type { InviteRole } from './constants'

export type InviteLinkResult =
  | {
      ok: true
      url: string
      expiresAt: string
      emailSent: boolean
      inviteeEmail?: string
      warning?: string
    }
  | { ok: false; error: string }

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function getRequestOrigin(): Promise<string> {
  const headersList = await headers()
  const host = headersList.get('x-forwarded-host') ?? headersList.get('host')
  const protocol = headersList.get('x-forwarded-proto') ?? 'http'
  if (!host) {
    return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  }
  return `${protocol}://${host}`
}

function normalizeInviteeEmail(email?: string) {
  const normalized = email?.trim().toLowerCase() ?? ''
  return normalized.length > 0 ? normalized : null
}

async function sendInviteEmail({
  to,
  inviteUrl,
  workspaceName,
  role,
  expiresAt,
}: {
  to: string
  inviteUrl: string
  workspaceName: string
  role: InviteRole
  expiresAt: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.INVITE_EMAIL_FROM

  if (!apiKey || !from) {
    return {
      sent: false,
      warning: 'Email delivery is not configured. Copy and send the link manually.',
    }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject: `You're invited to ${workspaceName}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
          <h1 style="font-size:20px;margin-bottom:12px">Join ${workspaceName}</h1>
          <p>You have been invited as <strong>${role}</strong>.</p>
          <p>This invitation expires on ${new Date(expiresAt).toLocaleString()}.</p>
          <p><a href="${inviteUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:12px 18px;border-radius:8px;text-decoration:none">Accept invitation</a></p>
          <p style="font-size:12px;color:#6b7280">If the button does not work, copy this URL: ${inviteUrl}</p>
        </div>
      `,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    return {
      sent: false,
      warning: detail || 'Email delivery failed. Copy and send the link manually.',
    }
  }

  return { sent: true }
}

export async function generateInviteLink(
  organizationId: string,
  role: InviteRole,
  inviteeEmail?: string
): Promise<InviteLinkResult> {
  const normalizedEmail = normalizeInviteeEmail(inviteeEmail)

  if (normalizedEmail && !emailPattern.test(normalizedEmail)) {
    return { ok: false, error: 'Enter a valid invitee email address' }
  }

  const supabase = await createClient()
  const rpcName = normalizedEmail
    ? 'create_email_invitation'
    : 'create_invitation_link'
  const rpcArgs = normalizedEmail
    ? {
        p_organization_id: organizationId,
        p_role: role,
        p_invitee_email: normalizedEmail,
      }
    : {
        p_organization_id: organizationId,
        p_role: role,
      }

  const { data, error } = await supabase.rpc(rpcName, rpcArgs)

  if (error) {
    return { ok: false, error: error.message }
  }

  const payload = data as {
    token?: string
    expires_at?: string
    invitee_email?: string
  } | null
  if (!payload?.token || !payload?.expires_at) {
    return { ok: false, error: 'Could not generate invitation link' }
  }

  const origin = await getRequestOrigin()
  const url = `${origin}/invite?token=${encodeURIComponent(payload.token)}`

  if (!normalizedEmail) {
    return { ok: true, url, expiresAt: payload.expires_at, emailSent: false }
  }

  const workspaceName = await supabase
    .from('organizations')
    .select('name')
    .eq('id', organizationId)
    .maybeSingle()

  const delivery = await sendInviteEmail({
    to: normalizedEmail,
    inviteUrl: url,
    workspaceName: workspaceName.data?.name ?? 'your workspace',
    role,
    expiresAt: payload.expires_at,
  })

  return {
    ok: true,
    url,
    expiresAt: payload.expires_at,
    inviteeEmail: normalizedEmail,
    emailSent: delivery.sent,
    warning: delivery.warning,
  }
}
'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import fs from 'fs'
import path from 'path'

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

export async function sendCustomPasswordResetEmail(email: string) {
  const adminClient = createAdminClient()
  
  // 1. Generate the recovery link
  // Redirect to /reset-password because /auth/callback isn't needed if we directly handle the token 
  // Wait, Supabase auth links generated via admin client have the token appended as #access_token=...
  // Usually, /reset-password expects to parse the hash or /auth/callback expects the code.
  // GenerateLink returns an action_link that points to the Supabase project URL which then redirects to the redirectTo URL.
  // Actually, we can just use the action_link directly.
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const { data, error } = await adminClient.auth.admin.generateLink({
    type: 'recovery',
    email,
  })

  if (error || !data?.properties?.hashed_token) {
    console.error('generateLink error:', error)
    return { ok: false, error: error?.message || 'Could not generate reset link' }
  }

  const customVerifyLink = `${siteUrl}/auth/verify?token_hash=${data.properties.hashed_token}&type=recovery&next=/reset-password`
  
  // Extract user's name if available, fallback to "there"
  const fullName = data.user?.user_metadata?.full_name || data.user?.user_metadata?.name || ''
  const firstName = fullName ? fullName.split(' ')[0] : 'there'

  // 2. Send via Resend
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.INVITE_EMAIL_FROM // Re-use the configured sender email

  if (!apiKey || !from) {
    return { ok: false, error: 'Email delivery is not configured.' }
  }

  const logoSrc = getEmailLogoSrc(siteUrl)

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: 'Reset your password for Prazaner',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          </style>
        </head>
        <body style="font-family: 'Inter', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;">
          <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb;">
            
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 36px 30px; text-align: center;">
              <img src="${logoSrc}" alt="Prazaner" style="height: 42px; width: auto; max-width: 220px; display: inline-block; border: 0;" />
            </div>
            
            <div style="padding: 40px 30px;">
              <p style="font-size: 20px; font-weight: 600; color: #111827; margin-top: 0; margin-bottom: 20px;">Hi ${firstName},</p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 30px; margin-top: 0;">
                We received a request to reset the password for your Prazaner account associated with <strong style="color: #111827;">${email}</strong>. 
                If you made this request, you can securely choose a new password by clicking the button below.
              </p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${customVerifyLink}" style="display: inline-block; background-color: #4f46e5; color: #ffffff !important; padding: 14px 28px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px;">
                  <span style="color: #ffffff;">Reset My Password</span>
                </a>
              </div>
              
              <p style="font-size: 14px; line-height: 1.6; color: #6b7280; margin-bottom: 0;">
                For security reasons, this link will expire in 24 hours. If you didn't request a password reset, you can safely ignore this email and your account will remain secure.
              </p>
              
              <div style="border-top: 1px solid #f3f4f6; padding-top: 30px; margin-top: 30px;">
                <p style="font-size: 16px; color: #111827; font-weight: 500; margin-bottom: 4px; margin-top: 0;">Best regards,</p>
                <p style="font-size: 14px; color: #6b7280; margin-top: 0;">The Prazaner Team</p>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; padding: 0 20px 40px;">
            <p style="font-size: 12px; color: #9ca3af; line-height: 1.5; margin: 0;">
              &copy; ${new Date().getFullYear()} Prazaner Inc. All rights reserved.<br>
              You are receiving this email because a password reset was requested for your account.
            </p>
          </div>
        </body>
        </html>
      `,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    console.error('Resend error:', errText)
    return { ok: false, error: 'Failed to send email' }
  }

  return { ok: true }
}

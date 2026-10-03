import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// We use the service role key to bypass RLS since this is a background cron job
// We initialize it inside the handler to prevent next.js build errors if the key is missing at build time
const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )
    // 1. Fetch projects where PIR is scheduled, date has passed, and not yet notified
    const now = new Date().toISOString()
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        id, 
        name,
        pir_scheduled_date,
        organization_id
      `)
      .not('pir_scheduled_date', 'is', null)
      .lte('pir_scheduled_date', now)
      .eq('pir_notified', false)

    if (error) {
      console.error('Error fetching due PIRs:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!projects || projects.length === 0) {
      return NextResponse.json({ message: 'No PIRs due for notification.' })
    }

    const results = []

    // 2. Send emails and update status
    for (const project of projects) {
      // Fetch organization members' user IDs
      const { data: members, error: membersError } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', project.organization_id)

      if (membersError || !members || members.length === 0) {
        console.error(`Failed to fetch members for org ${project.organization_id}`, membersError)
        continue
      }

      const userIds = members.map(m => m.user_id)

      // Fetch profiles for those users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .in('id', userIds)

      if (profilesError || !profiles) {
        console.error(`Failed to fetch profiles for org ${project.organization_id}`, profilesError)
        continue
      }

      const emailsSentTo = []

      for (const profile of profiles) {
        const email = profile?.email
        if (!email) continue

        const { data: emailData, error: emailError } = await resend.emails.send({
          from: 'Prazaner <onboarding@resend.dev>', // Use onboarding@resend.dev for testing if domain not verified
          to: [email],
          subject: `Reminder: Post-Implementation Review Due for ${project.name}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0;">
              <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
                <div style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 32px 24px; text-align: center;">
                  <img src="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/prazaner_logo_transparent.png" alt="Prazaner" style="height: 42px; width: auto; max-width: 220px; display: inline-block; border: 0;" />
                </div>
                <div style="padding: 32px 24px;">
                  <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin-top: 0;">Post-Implementation Review (PIR) Reminder</h2>
                  <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">Hi ${profile?.full_name || 'Stakeholder'},</p>
                  <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">This is an automated reminder that the scheduled post-closure period for your project <strong>${project.name}</strong> has completed.</p>
                  <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">Please log in to the project dashboard and navigate to the <strong>Closure Documents</strong> section to finalize the Post-Implementation Review and record the final ROI and lessons learned.</p>
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/projects/${project.id}?tab=documents&doc=post_implementation_review" style="display: inline-block; padding: 12px 26px; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: bold;">
                      <span style="color: #ffffff;">View Project Closure Dashboard</span>
                    </a>
                  </div>
                  <div style="border-top: 1px solid #f3f4f6; padding-top: 24px; margin-top: 24px;">
                    <p style="font-size: 14px; color: #6b7280; margin: 0;">Best regards,<br/><strong>The Prazaner Team</strong></p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `
        })

        if (emailError) {
          console.error(`Failed to send PIR email for project ${project.id} to ${email}:`, emailError)
        } else {
          emailsSentTo.push(email)
        }
      }

      // Update DB to mark as notified for the project
      const { error: updateError } = await supabase
        .from('projects')
        .update({ pir_notified: true })
        .eq('id', project.id)

      if (updateError) {
        console.error(`Failed to update pir_notified for project ${project.id}:`, updateError)
      }

      results.push({ projectId: project.id, status: 'processed', emailsSentTo })
    }

    return NextResponse.json({ message: 'Processed PIR reminders', results })
  } catch (error: any) {
    console.error('Unexpected error in PIR cron:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

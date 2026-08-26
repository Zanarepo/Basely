'use server'

import { createClient } from '@/utils/supabase/server'
import { checkFeatureAccess } from '@/lib/organizations/tier-logic'
import { revalidatePath } from 'next/cache'
import { useChangeRequestCreatedHook } from './change-request-hooks'
import { dispatchNotification, sendDirectEmail } from '@/lib/notifications/dispatch'
import { getCurrencySymbol } from '@/lib/utils'

export async function createStandaloneChangeRequest(
  projectId: string,
  description: string,
  rationale: string,
  outcome: 'pending' | 'pending_sponsor_approval' | 'approved' | 'rejected' | 'withdrawn' = 'pending',
  costImpact: number = 0,
  scheduleImpactDays: number = 0
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  
  let finalOutcome = outcome

  const { data: project } = await supabase
    .from('projects')
    .select('organization_id, name, currency')
    .eq('id', projectId)
    .single()

  const { data: { user } } = await supabase.auth.getUser()

  // Fetch Change Management Plan to check thresholds
  const { data: plan } = await supabase
    .from('change_management_plans')
    .select('cr_cost_threshold, cr_schedule_threshold_days')
    .eq('project_id', projectId)
    .single()

  const costThresh = plan?.cr_cost_threshold ?? 5000
  const scheduleThresh = plan?.cr_schedule_threshold_days ?? 3

  let requiresSponsor = false
  if (costImpact > costThresh || scheduleImpactDays > scheduleThresh) {
    requiresSponsor = true
    finalOutcome = 'pending_sponsor_approval'
  } else {
    // If organizational policy requires PM approval but not sponsor
    finalOutcome = 'pending'
  }

  // Create the log entry first
  const { data: logEntry, error } = await supabase
    .from('change_request_log_entries')
    .insert({
      project_id: projectId,
      description,
      rationale,
      outcome: finalOutcome,
      cost_impact: costImpact,
      schedule_impact_days: scheduleImpactDays,
      created_by_user_id: user?.id,
      source: 'standalone'
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating change request:', error)
    return { success: false, error: error.message }
  }

  // Handle Governance Routing & Emails
  if (project && logEntry) {
    const { data: activePolicies } = await supabase
      .from('approval_policies')
      .select('*')
      .eq('organization_id', project.organization_id)
      .eq('enabled', true)

    let routedToWorkflow = false

    if (activePolicies && activePolicies.length > 0) {
      const crPolicy = activePolicies.find(p => p.action_type === 'change_request')
      
      if (crPolicy && requiresSponsor) {
        // Governance is ON, and threshold exceeded. Route to Executive Sponsor via Workflows.
        const { error: insertErr } = await supabase.from('approval_requests').insert({
          policy_id: crPolicy.id,
          requested_by_user_id: user?.id,
          status: 'pending',
          payload: {
            type: 'change_request',
            project_id: projectId,
            log_entry_id: logEntry.id,
            description,
            rationale,
            cost_impact: costImpact,
            schedule_impact_days: scheduleImpactDays,
            currency: project.currency,
            sponsor_emails: []
          }
        })
        if (!insertErr) {
          routedToWorkflow = true
        }

        // Send email to Executive Sponsor if requiresSponsor is true
        if (requiresSponsor && !insertErr) {
          const { data: sponsors } = await supabase
            .from('stakeholders')
            .select('name, email, linked_user_id, role_title')
            .eq('project_id', projectId)
            .ilike('role_title', '%Sponsor%')
          
          if (sponsors && sponsors.length > 0) {
            // Update payload to include sponsor_emails
            const sponsorEmails = sponsors.map(s => s.email).filter(Boolean)
            if (sponsorEmails.length > 0) {
              await supabase.from('approval_requests')
                .update({ payload: { 
                  type: 'change_request',
                  project_id: projectId,
                  log_entry_id: logEntry.id,
                  description,
                  rationale,
                  cost_impact: costImpact,
                  schedule_impact_days: scheduleImpactDays,
                  currency: project.currency,
                  sponsor_emails: sponsorEmails 
                } })
                .eq('policy_id', crPolicy.id)
                .eq('requested_by_user_id', user?.id)
            }
          }
        }
      }
    }

    // Send email to Executive Sponsor if requiresSponsor is true
    if (requiresSponsor) {
      const { data: sponsors } = await supabase
        .from('stakeholders')
        .select('name, email, linked_user_id, role_title')
        .eq('project_id', projectId)
        .ilike('role_title', '%Sponsor%')
      
      if (sponsors && sponsors.length > 0) {
        for (const sponsor of sponsors) {
          const sponsorName = sponsor.name || 'Executive Sponsor'
          const sym = getCurrencySymbol(project.currency || 'USD')
          
          let actionUrl = routedToWorkflow ? `/dashboard/approvals` : `/dashboard/projects/${projectId}?tab=documents`

          if (!sponsor.linked_user_id && sponsor.email) {
            // They aren't on the platform. Generate an invitation link so they join the correct workspace!
            const { data: inviteData, error: inviteErr } = await supabase.rpc('create_email_invitation', {
              p_organization_id: project.organization_id,
              p_role: 'Sponsor', // Sponsor role
              p_invitee_email: sponsor.email
            })

            if (inviteErr) {
              console.error('Failed to create invitation:', inviteErr)
            }

            if (inviteData?.token) {
              actionUrl = `/invite?token=${inviteData.token}&next=${encodeURIComponent(actionUrl)}`
            }
          }

          const context = {
            subject: 'Action Required: Change Request Escalation',
            title: 'Change Request Escalation',
            message: `Hi ${sponsorName},\n\nA new Change Request for project ${project.name || 'your project'} has exceeded the baseline thresholds and requires your review.\n\nCost Impact: ${sym}${costImpact.toLocaleString()}\nSchedule Delay: ${scheduleImpactDays} days\n\nDescription:\n${description}`,
            actionUrl: actionUrl
          }

          if (sponsor.linked_user_id) {
            dispatchNotification({
              userId: sponsor.linked_user_id,
              triggerType: 'approval_update',
              referenceEntityType: 'change_request',
              referenceEntityId: logEntry.id,
              projectId,
              contentSummary: `Executive Sponsor Approval Required for Change Request`,
              emailContext: context
            }).catch(err => {
              console.error('Failed to dispatch in-app notification:', err)
            })
          } else if (sponsor.email) {
            sendDirectEmail(sponsor.email, context).catch(err => {
              console.error('Failed to send sponsor email via Resend:', err)
            })
          }
        }
      }
    }
  }

  // Dispatch side-effects (Notifications)
  useChangeRequestCreatedHook(projectId, description, rationale).catch(console.error)

  revalidatePath(`/dashboard/projects/${projectId}`)
  return { success: true }
}

export async function updateStandaloneChangeRequest(
  id: string,
  updates: { description?: string, rationale?: string, outcome?: 'pending' | 'pending_sponsor_approval' | 'approved' | 'rejected' | 'withdrawn' }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get the change request to know who created it and which project it belongs to
  const { data: cr } = await supabase
    .from('change_request_log_entries')
    .select('project_id, created_by_user_id, description, outcome, projects(name)')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('change_request_log_entries')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('Error updating change request:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function deleteStandaloneChangeRequest(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('change_request_log_entries')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting change request:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function escalateRiskToChangeRequest(
  projectId: string,
  riskId: string,
  riskTitle: string,
  riskMitigation: string
): Promise<{ success: boolean; error?: string }> {
  const description = `Risk Mitigation: ${riskTitle}`
  const rationale = `Automatically escalated from Risk.\n\nRisk Mitigation Strategy:\n${riskMitigation || 'No specific strategy provided.'}`
  
  return await createStandaloneChangeRequest(projectId, description, rationale, 'pending')
}

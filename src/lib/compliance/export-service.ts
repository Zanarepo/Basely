import { createAdminClient } from '@/utils/supabase/admin'

export interface DataExportChecklist {
  organization: boolean
  members: boolean
  subscriptions: boolean
  projects: boolean
  wbsElements: boolean
  risks: boolean
  supportTickets: boolean
  activities: boolean
}

export async function compileOrganizationDataExport(organizationId: string) {
  const supabase = createAdminClient()
  const exportData: Record<string, any> = {}
  
  const checklist: DataExportChecklist = {
    organization: false,
    members: false,
    subscriptions: false,
    projects: false,
    wbsElements: false,
    risks: false,
    supportTickets: false,
    activities: false,
  }

  try {
    // Core Org Data
    const { data: org } = await supabase.from('organizations').select('*').eq('id', organizationId).single()
    exportData.organization = org
    checklist.organization = !!org

    const { data: members } = await supabase.from('organization_members').select('*').eq('organization_id', organizationId)
    exportData.members = members
    checklist.members = true

    const { data: sub } = await supabase.from('organization_subscriptions').select('*').eq('organization_id', organizationId).single()
    exportData.subscription = sub
    checklist.subscriptions = true

    // Support Data
    const { data: tickets } = await supabase.from('support_tickets').select('*').eq('organization_id', organizationId)
    exportData.supportTickets = tickets
    checklist.supportTickets = true

    // Projects Data
    const { data: projects } = await supabase.from('projects').select('*').eq('organization_id', organizationId)
    exportData.projects = projects || []
    checklist.projects = true

    if (projects && projects.length > 0) {
      const projectIds = projects.map(p => p.id)
      
      const { data: wbs } = await supabase.from('wbs_elements').select('*').in('project_id', projectIds)
      exportData.wbsElements = wbs
      checklist.wbsElements = true

      const { data: risks } = await supabase.from('risk_issue_register').select('*').in('project_id', projectIds)
      exportData.risks = risks
      checklist.risks = true
      
      const { data: activities } = await supabase.from('project_activity_logs').select('*').in('project_id', projectIds)
      exportData.activities = activities
      checklist.activities = true
    } else {
      checklist.wbsElements = true
      checklist.risks = true
      checklist.activities = true
    }

    return {
      success: true,
      data: exportData,
      checklist
    }
  } catch (error: any) {
    console.error('Export compilation failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

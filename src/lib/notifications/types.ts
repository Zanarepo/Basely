export type NotificationTriggerType = 'mention' | 'assignment' | 'risk_change' | 'cost_change' | 'schedule_change' | 'document_change' | 'status_report' | 'approval_request' | 'approval_update' | 'erp_sync_failure'

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

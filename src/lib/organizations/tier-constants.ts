import { TierId } from './tier-types'

export const FEATURE_TO_MIN_TIER: Record<string, TierId> = {
  // Free Tier (Foundation & Planning Core)
  'foundation.workspace': 'free',
  'planning.wbs': 'free',

  // Premium Tier (Starter & Business Modules)
  'cost.evm_engine': 'premium',
  'cost.resource_rates': 'premium',
  'cost.actuals_tracking': 'premium',
  'accountability.raci': 'premium',
  'accountability.risks': 'premium',
  'documentation.engine': 'premium',
  'documentation.status_reports': 'premium',
  'documentation.custom_templates': 'premium',
  'collaboration.realtime': 'premium',
  'collaboration.notifications': 'premium',
  'reporting.analytics': 'premium',
  'product.roadmap_gtm': 'premium',
  'product.backlog_prioritization': 'premium',
  'pm.adr_skills_raid': 'premium',
  'releases.management': 'premium',

  // Enterprise Tier (Governance & Integrations)
  'governance.granular_rbac': 'enterprise',
  'governance.approval_workflows': 'enterprise',
  'governance.audit_logs': 'enterprise',
  'governance.sso': 'enterprise',
  'integrations.api_webhooks': 'enterprise',
  'integrations.cloud_calendar': 'enterprise',
  'integrations.erp_connector': 'enterprise',
}

export const LEGACY_FEATURE_MAP: Record<string, string> = {
  'approval_workflows': 'governance.approval_workflows',
  'change_requests': 'governance.approval_workflows',
  'risks': 'accountability.risks',
  'wbs': 'planning.wbs',
  'actual_costs': 'cost.actuals_tracking',
  'activities': 'reporting.analytics',
  'calendar': 'integrations.cloud_calendar',
}

export const TIER_HIERARCHY: Record<TierId, number> = {
  'free': 1,
  'premium': 2,
  'enterprise': 3,
}

export const USAGE_LIMITS: Record<TierId, Record<string, number>> = {
  'free': { max_seats: 3, max_active_projects: 2, max_workspaces: 1 },
  'premium': { max_seats: -1, max_active_projects: -1, max_workspaces: -1 },
  'enterprise': { max_seats: -1, max_active_projects: -1, max_workspaces: -1 },
}

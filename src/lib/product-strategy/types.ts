export interface Persona {
  id: string
  organization_id: string
  project_id: string | null
  name: string
  role_title: string
  avatar_color: string
  demographics: string | null
  jtbd_statement: string | null
  motivations: string | null
  pain_points: string | null
  preferred_tools: string | null
  custom_attributes?: Record<string, string>
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface StrategicPillar {
  id: string
  title: string
  description: string
  target_metric?: string
}

export interface CompetitiveMoat {
  id: string
  category: 'technology' | 'network_effects' | 'brand' | 'switching_costs' | 'scale' | 'other'
  title: string
  description: string
  strength: 'high' | 'medium' | 'low'
}

export interface ProductStrategy {
  id: string
  organization_id: string
  project_id: string
  vision_statement: string | null
  target_market: string | null
  value_proposition: string | null
  strategic_pillars: StrategicPillar[]
  competitive_moats: CompetitiveMoat[]
  custom_attributes?: Record<string, string>
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ProductKpi {
  id: string
  organization_id: string
  project_id: string | null
  name: string
  category: 'north_star' | 'acquisition' | 'activation' | 'retention' | 'revenue' | 'efficiency' | string
  current_value: string
  target_value: string
  unit: 'percentage' | 'currency' | 'numeric' | 'ratio' | string
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | string
  trend_direction: 'up' | 'down' | 'neutral'
  status: 'on_track' | 'at_risk' | 'behind'
  custom_attributes?: Record<string, string>
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface OkrKeyResult {
  id: string
  objective_id: string
  title: string
  baseline_value: string
  target_value: string
  current_value: string
  progress: number
  confidence_score: number
  unit: string
  status: 'on_track' | 'at_risk' | 'behind'
  custom_attributes?: Record<string, string>
  created_at: string
  updated_at: string
}

export interface OkrObjective {
  id: string
  organization_id: string
  project_id: string | null
  title: string
  description: string | null
  pillar_id: string | null
  wbs_element_id: string | null
  owner: string | null
  timeframe: string
  progress: number
  status: 'on_track' | 'at_risk' | 'behind'
  custom_attributes?: Record<string, string>
  key_results?: OkrKeyResult[]
  created_by: string | null
  created_at: string
  updated_at: string
}

// ─── Sprint 50: Discovery Insights & PRD Studio ───

export interface DiscoveryInsight {
  id: string
  organization_id: string
  project_id: string | null
  title: string
  description: string | null
  source: 'customer_interview' | 'support_ticket' | 'sales_call' | 'user_research' | 'survey' | 'analytics' | 'other'
  severity: 'low' | 'medium' | 'high' | 'critical'
  frequency: number
  persona_id: string | null
  persona?: Persona
  status: 'new' | 'triaged' | 'in_review' | 'converted' | 'archived'
  tags: string[]
  metadata: Record<string, any>
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ProductRequirementsDoc {
  id: string
  document_id: string | null
  organization_id: string
  project_id: string | null
  primary_okr_id: string | null
  target_persona_id: string | null
  figma_url: string | null
  telemetry_requirements: any[]
  scope_in: string[]
  scope_out: string[]
  acceptance_criteria: string[]
  prd_status: 'draft' | 'in_review' | 'approved' | 'deprecated'
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface DiscoveryChangeRequestLink {
  id: string
  discovery_insight_id: string
  change_request_id: string
  link_type: 'converted_from' | 'supporting_context'
  created_at: string
}

export interface DiscoveryRiskLink {
  id: string
  discovery_insight_id: string
  risk_id: string
  link_type: 'supporting_context'
  created_at: string
}

// ─── Sprint 51: Feature Prioritization & Backlog Scoring Engine ───

export interface ProductBacklogItem {
  id: string
  project_id: string
  organization_id: string
  title: string
  description: string | null
  persona_id: string | null
  primary_okr_id: string | null
  
  reach: number
  impact: number
  confidence: number
  effort: number
  rice_score: number
  
  moscow_status: 'Must' | 'Should' | 'Could' | 'Wont' | null
  kano_category: 'Basic' | 'Performance' | 'Excitement' | 'Indifferent' | null
  
  wbs_element_id: string | null
  
  horizon: 'Now' | 'Next' | 'Later' | null
  theme: string | null
  release_id: string | null
  
  created_at: string
  updated_at: string
}

// ─── Sprint 52: Outcome-Driven Roadmap & GTM Feature Rollouts ───

export interface ReleaseRolloutPhase {
  id: string
  release_id: string
  phase_name: string
  target_percentage: number
  status: 'planned' | 'active' | 'complete'
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
}

export interface ReleaseFeatureFlag {
  id: string
  release_id: string
  flag_key: string
  description: string | null
  is_enabled: boolean
  created_at: string
  updated_at: string
}

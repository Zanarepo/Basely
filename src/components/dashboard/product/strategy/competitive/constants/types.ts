export type CompetitorStatus = 'leading' | 'partial' | 'gap' | 'moat'

export interface CompetitorFeature {
  id: string
  featureName: string
  ourProduct: CompetitorStatus
  competitorA: CompetitorStatus
  competitorB: CompetitorStatus
  notes?: string
}

export interface CompetitiveIntelligenceDashboardProps {
  projectId: string
  organizationId: string
  hasEditAccess?: boolean
}

export interface CompetitorPricingItem {
  id: string
  dimensionName: string // e.g., Pricing Model, Starting Price, Average ACV
  ourProduct: string
  competitorA: string
  competitorB: string
}

export interface CompetitorStrategyItem {
  id: string
  dimensionName: string // e.g., Primary UVP, Target ICP Focus, Go-To-Market Motion
  ourProduct: string
  competitorA: string
  competitorB: string
}

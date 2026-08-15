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

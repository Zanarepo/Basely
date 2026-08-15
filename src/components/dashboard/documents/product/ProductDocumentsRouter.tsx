'use client'

import React from 'react'
import { StrategyCanvas } from '@/components/dashboard/product/strategy/StrategyCanvas'
import { PersonasDashboard } from '@/components/dashboard/product/personas/PersonasDashboard'
import { NorthStarDashboard } from '@/components/dashboard/product/okrs/NorthStarDashboard'
import { OkrDashboard } from '@/components/dashboard/product/okrs/OkrDashboard'
import { DiscoveryInbox } from '@/components/dashboard/product/discovery/DiscoveryInbox'
import { PrioritizationDashboard } from '@/components/dashboard/product/prioritization/PrioritizationDashboard'
import { RoadmapDashboard } from '@/components/dashboard/product/roadmap/RoadmapDashboard'
import { CompetitiveIntelligenceDashboard } from '@/components/dashboard/product/strategy/CompetitiveIntelligenceDashboard'
import { ReleasesWorkspace } from '@/components/dashboard/releases/ReleasesWorkspace'

export interface ProductDocumentsRouterProps {
  documentType: string
  projectId: string
  projectContext: any
  hasEditAccess: boolean
}

export function ProductDocumentsRouter({
  documentType,
  projectId,
  projectContext,
  hasEditAccess
}: ProductDocumentsRouterProps) {
  const organizationId = projectContext?.organization_id || ''

  if (documentType === 'strategy_canvas_workspace') {
    return (
      <div className="h-full overflow-y-auto pr-2">
        <StrategyCanvas
          projectId={projectId}
          organizationId={organizationId}
          hasEditAccess={hasEditAccess}
        />
      </div>
    )
  }

  if (documentType === 'personas_workspace') {
    return (
      <div className="h-full overflow-y-auto pr-2">
        <PersonasDashboard
          projectId={projectId}
          organizationId={organizationId}
          hasEditAccess={hasEditAccess}
        />
      </div>
    )
  }

  if (documentType === 'north_star_kpis_workspace') {
    return (
      <div className="h-full overflow-y-auto pr-2">
        <NorthStarDashboard
          projectId={projectId}
          organizationId={organizationId}
          hasEditAccess={hasEditAccess}
        />
      </div>
    )
  }

  if (documentType === 'okrs_workspace') {
    return (
      <div className="h-full overflow-y-auto pr-2">
        <OkrDashboard
          projectId={projectId}
          organizationId={organizationId}
          hasEditAccess={hasEditAccess}
        />
      </div>
    )
  }

  if (documentType === 'voc_discovery_workspace' || documentType === 'discovery_insights_document') {
    return (
      <div className="h-full overflow-y-auto pr-2">
        <DiscoveryInbox
          projectId={projectId}
          organizationId={organizationId}
          hasEditAccess={hasEditAccess}
        />
      </div>
    )
  }

  if (documentType === 'prioritization_workspace') {
    return (
      <div className="h-full overflow-y-auto pr-2">
        <PrioritizationDashboard
          projectId={projectId}
          organizationId={organizationId}
        />
      </div>
    )
  }

  if (documentType === 'roadmap_workspace') {
    return (
      <div className="h-full overflow-y-auto pr-2">
        <RoadmapDashboard
          projectId={projectId}
        />
      </div>
    )
  }

  if (documentType === 'competitive_analysis_workspace' || documentType === 'competitive_benchmarking_matrix') {
    return (
      <div className="h-full overflow-y-auto pr-2">
        <CompetitiveIntelligenceDashboard
          projectId={projectId}
          organizationId={organizationId}
          hasEditAccess={hasEditAccess}
        />
      </div>
    )
  }

  if (documentType === 'release_checklist_workspace') {
    return (
      <div className="h-full overflow-y-auto pr-2">
        <ReleasesWorkspace
          projectId={projectId}
          hasEditAccess={hasEditAccess}
        />
      </div>
    )
  }

  return null
}

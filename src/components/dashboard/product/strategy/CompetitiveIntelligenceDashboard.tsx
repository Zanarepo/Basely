'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'
import { CompetitiveHeaderBanner } from './competitive/components/CompetitiveHeaderBanner'
import { CompetitiveFeatureTable } from './competitive/components/CompetitiveFeatureTable'
import { CompetitorPricingMatrix } from './competitive/components/CompetitorPricingMatrix'
import { CompetitorStrategyMatrix } from './competitive/components/CompetitorStrategyMatrix'
import { useCompetitiveIntelligence } from './competitive/hooks/useCompetitiveIntelligence'
import { CompetitiveIntelligenceDashboardProps } from './competitive/constants/types'
import { MoatMatrix } from './MoatMatrix'

export function CompetitiveIntelligenceDashboard({
  projectId,
  organizationId,
  hasEditAccess = true,
}: CompetitiveIntelligenceDashboardProps) {
  const {
    loading,
    saving,
    setIsDirty,
    competitorAName,
    setCompetitorAName,
    competitorBName,
    setCompetitorBName,
    moats,
    setMoats,
    features,
    setFeatures,
    handleSave,
    handleAddFeature,
    handleDeleteFeature,
    autoGenerateMatrix,
    generating,
    pricing,
    setPricing,
    strategies,
    setStrategies,
  } = useCompetitiveIntelligence({ projectId, organizationId })

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Loading Competitive Intelligence Studio...
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <CompetitiveHeaderBanner
        hasEditAccess={hasEditAccess}
        saving={saving}
        onSave={handleSave}
      />

      {/* Feature Parity & Matrix Table Card */}
      <CompetitiveFeatureTable
        features={features}
        competitorAName={competitorAName}
        setCompetitorAName={setCompetitorAName}
        competitorBName={competitorBName}
        setCompetitorBName={setCompetitorBName}
        hasEditAccess={hasEditAccess}
        onAddFeature={handleAddFeature}
        onDeleteFeature={handleDeleteFeature}
        onUpdateFeature={setFeatures}
        setIsDirty={setIsDirty}
        onAutoGenerate={autoGenerateMatrix}
        generating={generating}
      />

      <CompetitorPricingMatrix
        pricing={pricing}
        competitorAName={competitorAName}
        competitorBName={competitorBName}
        hasEditAccess={hasEditAccess}
        onUpdate={setPricing}
        setIsDirty={setIsDirty}
      />

      <CompetitorStrategyMatrix
        strategies={strategies}
        competitorAName={competitorAName}
        competitorBName={competitorBName}
        hasEditAccess={hasEditAccess}
        onUpdate={setStrategies}
        setIsDirty={setIsDirty}
      />

      {/* Competitive Moat & Defensibility Matrix */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <MoatMatrix
          moats={moats}
          onChange={(nextMoats) => {
            setMoats(nextMoats)
            setIsDirty(true)
          }}
        />
      </div>
    </div>
  )
}

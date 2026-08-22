'use client'

import { useState, useEffect } from 'react'
import { getProductStrategy, saveProductStrategy } from '@/lib/product-strategy/strategy-actions'
import type { CompetitiveMoat } from '@/lib/product-strategy/types'
import { CompetitorFeature } from '../constants/types'
import { DEFAULT_COMPETITIVE_FEATURES } from '../constants/defaultFeatures'

interface UseCompetitiveIntelligenceProps {
  projectId: string
  organizationId: string
}

export function useCompetitiveIntelligence({
  projectId,
  organizationId,
}: UseCompetitiveIntelligenceProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  const [competitorAName, setCompetitorAName] = useState('Competitor Alpha')
  const [competitorBName, setCompetitorBName] = useState('Competitor Beta')
  const [moats, setMoats] = useState<CompetitiveMoat[]>([])
  const [features, setFeatures] = useState<CompetitorFeature[]>(DEFAULT_COMPETITIVE_FEATURES)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const strategy = await getProductStrategy(projectId, organizationId)
        if (strategy) {
          if (strategy.competitive_moats && Array.isArray(strategy.competitive_moats)) {
            setMoats(strategy.competitive_moats)
          }
          if ((strategy as any).competitive_features && Array.isArray((strategy as any).competitive_features)) {
            setFeatures((strategy as any).competitive_features)
          }
          if ((strategy as any).competitor_a_name) {
            setCompetitorAName((strategy as any).competitor_a_name)
          }
          if ((strategy as any).competitor_b_name) {
            setCompetitorBName((strategy as any).competitor_b_name)
          }
        }
      } catch (err) {
        console.error('[Competitive Intelligence Load Error]:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [projectId, organizationId])

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveProductStrategy(projectId, organizationId, {
        competitive_moats: moats,
        competitive_features: features,
        competitor_a_name: competitorAName,
        competitor_b_name: competitorBName,
      } as any)
      setIsDirty(false)
    } catch (err) {
      console.error('[Competitive Intelligence Save Error]:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleAddFeature = () => {
    const newF: CompetitorFeature = {
      id: `f_${Date.now()}`,
      featureName: 'New Feature Dimension',
      ourProduct: 'leading',
      competitorA: 'partial',
      competitorB: 'gap',
      notes: 'Add feature positioning details...',
    }
    setFeatures([...features, newF])
    setIsDirty(true)
  }

  const handleDeleteFeature = (id: string) => {
    setFeatures(features.filter((f) => f.id !== id))
    setIsDirty(true)
  }

  return {
    loading,
    saving,
    isDirty,
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
  }
}

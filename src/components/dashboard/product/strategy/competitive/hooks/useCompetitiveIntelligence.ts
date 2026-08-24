'use client'

import { useState, useEffect } from 'react'
import { getProductStrategy, saveProductStrategy } from '@/lib/product-strategy/strategy-actions'
import { generateCompetitiveMatrix } from '@/lib/product-strategy/competitive-actions'
import type { CompetitiveMoat } from '@/lib/product-strategy/types'
import { CompetitorFeature, CompetitorPricingItem, CompetitorStrategyItem } from '../constants/types'
import { DEFAULT_COMPETITIVE_FEATURES, DEFAULT_COMPETITIVE_PRICING, DEFAULT_COMPETITIVE_STRATEGY } from '../constants/defaultFeatures'

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
  const [generating, setGenerating] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  const [competitorAName, setCompetitorAName] = useState('Competitor Alpha')
  const [competitorBName, setCompetitorBName] = useState('Competitor Beta')
  const [moats, setMoats] = useState<CompetitiveMoat[]>([])
  const [features, setFeatures] = useState<CompetitorFeature[]>(DEFAULT_COMPETITIVE_FEATURES)
  const [pricing, setPricing] = useState<CompetitorPricingItem[]>(DEFAULT_COMPETITIVE_PRICING)
  const [strategies, setStrategies] = useState<CompetitorStrategyItem[]>(DEFAULT_COMPETITIVE_STRATEGY)

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
          if ((strategy as any).custom_attributes) {
            const custom = (strategy as any).custom_attributes
            if (custom.competitive_pricing && Array.isArray(custom.competitive_pricing)) {
              setPricing(custom.competitive_pricing)
            }
            if (custom.competitive_strategy_uvp && Array.isArray(custom.competitive_strategy_uvp)) {
              setStrategies(custom.competitive_strategy_uvp)
            }
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
        competitor_a_name: competitorAName,
        competitor_b_name: competitorBName,
        custom_attributes: {
          competitive_features: features,
          competitive_pricing: pricing,
          competitive_strategy_uvp: strategies
        }
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

  const autoGenerateMatrix = async () => {
    setGenerating(true)
    try {
      const result = await generateCompetitiveMatrix(projectId, organizationId)
      if (result.success && result.features) {
        if (result.competitorA) setCompetitorAName(result.competitorA)
        if (result.competitorB) setCompetitorBName(result.competitorB)
        setFeatures(result.features)
        
        if (result.pricing) setPricing(result.pricing)
        if (result.strategy) setStrategies(result.strategy)
        if (result.moats) setMoats(result.moats)
        
        // Auto-save the AI generated data so it persists on refresh
        await saveProductStrategy(projectId, organizationId, {
          competitor_a_name: result.competitorA || competitorAName,
          competitor_b_name: result.competitorB || competitorBName,
          custom_attributes: {
            competitive_features: result.features,
            competitive_pricing: result.pricing || pricing,
            competitive_strategy_uvp: result.strategy || strategies
          },
          competitive_moats: result.moats || moats
        } as any)
        
        setIsDirty(false)
      } else {
        throw new Error(result.error || 'Failed to auto-generate matrix')
      }
    } catch (err) {
      console.error('[Competitive Intelligence Auto-Generate Error]:', err)
      throw err // Allow UI to catch and show toast
    } finally {
      setGenerating(false)
    }
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
    autoGenerateMatrix,
    generating,
    pricing,
    setPricing,
    strategies,
    setStrategies,
  }
}

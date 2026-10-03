'use client'

import { Sparkles, Globe, Zap } from 'lucide-react'
import StructuredEditableField from '@/components/dashboard/documents/components/StructuredEditableField'
import type { ProductStrategy } from '@/lib/product-strategy/types'

interface CoreStrategyFieldsProps {
  strategy: ProductStrategy
  handleFieldChange: (field: keyof ProductStrategy, value: any) => void
  hasEditAccess: boolean
}

export function CoreStrategyFields({ strategy, handleFieldChange, hasEditAccess }: CoreStrategyFieldsProps) {
  return (
    <>
      <div className="space-y-6">
        {/* North Star Vision */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-3">
          <div>
            <div className="flex items-center space-x-2 text-violet-600 dark:text-violet-400 font-bold text-sm uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>North Star Vision Statement</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 mb-3">
              What transformative future are we engineering over the next 3 to 5 years?
            </p>
            <StructuredEditableField
              value={strategy.vision_statement || ''}
              onChange={(val) => handleFieldChange('vision_statement', val)}
              title="North Star Vision"
              hasEditAccess={hasEditAccess}
              placeholder="e.g. To revolutionize Enterprise delivery by creating an AI-agentic ecosystem..."
            />
          </div>
        </div>

        {/* Target Market Segmentation */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-3">
          <div>
            <div className="flex items-center space-x-2 text-violet-600 dark:text-violet-400 font-bold text-sm uppercase tracking-wider">
              <Globe className="w-4 h-4" />
              <span>Target Market Segmentation</span>
            </div>
            <p className="text-xs text-slate-400 mt-1 mb-3">
              Which high-value customer tiers (TAM/SAM) are we aggressively serving?
            </p>
            <StructuredEditableField
              value={strategy.target_market || ''}
              onChange={(val) => handleFieldChange('target_market', val)}
              title="Target Market Segmentation"
              hasEditAccess={hasEditAccess}
              placeholder="e.g. Enterprise PMOs and SaaS technology firms managing cross-functional technical teams..."
            />
          </div>
        </div>
      </div>

      {/* Value Proposition Band */}
      <div className="bg-gradient-to-r from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20 rounded-2xl border border-violet-200 dark:border-violet-900/40 p-6 shadow-sm">
        <div className="flex items-center space-x-2 text-violet-700 dark:text-violet-300 font-bold text-sm uppercase tracking-wider">
          <Zap className="w-4 h-4 fill-violet-600 text-violet-600 dark:fill-violet-400 dark:text-violet-400" />
          <span>Core Value Proposition & Differentiating Advantage</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3">
          Why do customers choose this solution over established market alternatives? What is our unmatched competitive leverage?
        </p>
        <StructuredEditableField
          value={strategy.value_proposition || ''}
          onChange={(val) => handleFieldChange('value_proposition', val)}
          title="Value Proposition"
          hasEditAccess={hasEditAccess}
          placeholder="e.g. Traditional project software separates product strategy from engineering tasks. Our solution unifies discovery and execution..."
        />
      </div>
    </>
  )
}

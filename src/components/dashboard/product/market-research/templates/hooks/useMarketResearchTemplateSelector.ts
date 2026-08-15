import { useState, useMemo } from 'react'
import { MARKET_RESEARCH_TEMPLATE_VARIANTS, MarketResearchTemplateVariant } from '../constants/marketResearchTemplates'

export type MarketResearchCategoryFilter =
  | 'all'
  | 'master_spec'
  | 'competitive'
  | 'market_sizing'
  | 'customer_icp'
  | 'discovery'
  | 'win_loss'
  | 'opportunity'
  | 'positioning'
  | 'trends'
  | 'pricing'
  | 'voc'

export function useMarketResearchTemplateSelector() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<MarketResearchCategoryFilter>('all')

  const filteredTemplates = useMemo(() => {
    const allVariants = Object.values(MARKET_RESEARCH_TEMPLATE_VARIANTS)

    return allVariants.filter((variant: MarketResearchTemplateVariant) => {
      const matchesCategory =
        selectedCategory === 'all' || variant.category === selectedCategory

      const query = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !query ||
        variant.name.toLowerCase().includes(query) ||
        variant.subtitle.toLowerCase().includes(query) ||
        variant.bestFor.toLowerCase().includes(query) ||
        variant.section_definitions.some((s) => s.title.toLowerCase().includes(query))

      return matchesCategory && matchesSearch
    })
  }, [searchQuery, selectedCategory])

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    filteredTemplates,
    totalCount: Object.keys(MARKET_RESEARCH_TEMPLATE_VARIANTS).length,
  }
}

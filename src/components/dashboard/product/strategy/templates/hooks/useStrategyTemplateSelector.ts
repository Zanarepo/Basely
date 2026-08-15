'use client'

import { useState, useMemo } from 'react'
import { STRATEGY_TEMPLATE_VARIANTS, StrategyTemplateVariant } from '../constants/strategyTemplates'

export function useStrategyTemplateSelector() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const variants = useMemo(() => Object.values(STRATEGY_TEMPLATE_VARIANTS), [])

  const filteredVariants = useMemo(() => {
    return variants.filter((v) => {
      const matchesCategory = selectedCategory === 'all' || v.category === selectedCategory
      const matchesSearch =
        searchQuery === '' ||
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.bestFor.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesCategory && matchesSearch
    })
  }, [variants, selectedCategory, searchQuery])

  return {
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    filteredVariants,
  }
}

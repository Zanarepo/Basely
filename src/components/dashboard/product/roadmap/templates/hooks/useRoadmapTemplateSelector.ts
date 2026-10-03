import { useState, useMemo } from 'react'
import { ROADMAP_TEMPLATE_VARIANTS, RoadmapTemplateVariant } from '../constants/roadmapTemplates'

export type RoadmapCategoryFilter =
  | 'all'
  | 'master_spec'
  | 'exec_board'
  | 'theme'
  | 'timeline'
  | 'outcome'
  | 'lean_kanban'
  | 'gist'
  | 'okr_linked'
  | 'portfolio'
  | 'public'

export function useRoadmapTemplateSelector() {
  const [selectedCategory, setSelectedCategory] = useState<RoadmapCategoryFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const variantsList = useMemo(() => {
    return Object.values(ROADMAP_TEMPLATE_VARIANTS)
  }, [])

  const filteredVariants = useMemo(() => {
    return variantsList.filter((variant: RoadmapTemplateVariant) => {
      // Category filter
      if (selectedCategory !== 'all' && variant.category !== selectedCategory) {
        return false
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchName = variant.name.toLowerCase().includes(query)
        const matchSubtitle = variant.subtitle.toLowerCase().includes(query)
        const matchBestFor = variant.bestFor.toLowerCase().includes(query)
        const matchSection = variant.section_definitions.some((s) =>
          s.title.toLowerCase().includes(query)
        )
        return matchName || matchSubtitle || matchBestFor || matchSection
      }

      return true
    })
  }, [variantsList, selectedCategory, searchQuery])

  return {
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    filteredVariants,
    totalCount: variantsList.length,
  }
}

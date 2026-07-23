import { useState, useCallback } from 'react'
import { DocumentSectionDef } from '@/lib/documents/actions'

export function useTemplateBuilder(initialSections: DocumentSectionDef[] = []) {
  const [sections, setSections] = useState<DocumentSectionDef[]>(initialSections)

  const addSection = useCallback((section: DocumentSectionDef) => {
    setSections(prev => [...prev, section])
  }, [])

  const updateSection = useCallback((index: number, updates: Partial<DocumentSectionDef>) => {
    setSections(prev => prev.map((sec, i) => i === index ? { ...sec, ...updates } : sec))
  }, [])

  const removeSection = useCallback((index: number) => {
    setSections(prev => prev.filter((_, i) => i !== index))
  }, [])

  const moveSection = useCallback((fromIndex: number, toIndex: number) => {
    setSections(prev => {
      const result = Array.from(prev)
      const [removed] = result.splice(fromIndex, 1)
      result.splice(toIndex, 0, removed)
      return result
    })
  }, [])

  const resetSections = useCallback((newSections: DocumentSectionDef[]) => {
    setSections(newSections)
  }, [])

  return {
    sections,
    addSection,
    updateSection,
    removeSection,
    moveSection,
    resetSections
  }
}

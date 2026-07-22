import { useState, useCallback } from 'react'

export function useCollapsibleSections(initialState: Record<string, boolean> = {}) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => ({
    members: true,
    sso: true,
    ...initialState,
  }))

  const toggleSection = useCallback((sectionKey: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }))
  }, [])

  const isSectionOpen = useCallback(
    (sectionKey: string) => openSections[sectionKey] ?? true,
    [openSections]
  )

  return {
    openSections,
    toggleSection,
    isSectionOpen,
  }
}

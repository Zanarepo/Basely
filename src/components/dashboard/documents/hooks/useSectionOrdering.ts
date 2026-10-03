import { TransitionStartFunction } from 'react'

interface UseSectionOrderingParams {
  freeText: Record<string, string>
  setFreeText: React.Dispatch<React.SetStateAction<Record<string, string>>>
  allSections: Array<{ key: string; title: string; [key: string]: any }>
  setIsDirty: (dirty: boolean) => void
  onShowToast: (type: 'success' | 'error', msg: string) => void
  startTransition: TransitionStartFunction
  newSectionTitle?: string
  setNewSectionTitle?: (title: string) => void
}

export function useSectionOrdering({
  freeText,
  setFreeText,
  allSections,
  setIsDirty,
  onShowToast,
  startTransition,
  newSectionTitle = '',
  setNewSectionTitle
}: UseSectionOrderingParams) {
  // Move section UP in section order array (Instant synchronous re-ordering)
  const handleMoveSectionUp = (sectionKey: string) => {
    // Always use current visual section order as baseline
    const visualKeys = allSections.map((s) => s.key)
    const idx = visualKeys.indexOf(sectionKey)

    if (idx > 0) {
      const updatedKeys = [...visualKeys]
      const temp = updatedKeys[idx - 1]
      updatedKeys[idx - 1] = updatedKeys[idx]
      updatedKeys[idx] = temp

      setFreeText((prev) => ({
        ...prev,
        '__section_order': JSON.stringify(updatedKeys)
      }))
      setIsDirty(true)
    }
  }

  // Move section DOWN in section order array (Instant synchronous re-ordering)
  const handleMoveSectionDown = (sectionKey: string) => {
    // Always use current visual section order as baseline
    const visualKeys = allSections.map((s) => s.key)
    const idx = visualKeys.indexOf(sectionKey)

    if (idx !== -1 && idx < visualKeys.length - 1) {
      const updatedKeys = [...visualKeys]
      const temp = updatedKeys[idx + 1]
      updatedKeys[idx + 1] = updatedKeys[idx]
      updatedKeys[idx] = temp

      setFreeText((prev) => ({
        ...prev,
        '__section_order': JSON.stringify(updatedKeys)
      }))
      setIsDirty(true)
    }
  }

  // Insert a new custom section at targetIndex with optional initial content
  const handleAddSection = (
    titleOverride?: string,
    targetIndex?: number,
    initialContent?: string
  ) => {
    const sectionTitle = (titleOverride || newSectionTitle).trim()
    if (!sectionTitle) return
    const sectionKey =
      'custom_sec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)

    setFreeText((prev) => {
        const next = { ...prev }
        const currentCustom = (() => {
          try {
            return prev['__custom_sections'] ? JSON.parse(prev['__custom_sections']) : []
          } catch {
            return []
          }
        })()
        const updatedCustom = [...currentCustom, { key: sectionKey, title: sectionTitle }]
        next['__custom_sections'] = JSON.stringify(updatedCustom)
        next[sectionKey] = initialContent || ''

        // Compute current section keys order array
        const currentOrder: string[] = (() => {
          try {
            if (prev['__section_order']) return JSON.parse(prev['__section_order'])
          } catch {
            // fallback
          }
          return allSections.map((s) => s.key)
        })()

        if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= currentOrder.length) {
          currentOrder.splice(targetIndex, 0, sectionKey)
        } else {
          currentOrder.push(sectionKey)
        }

      next['__section_order'] = JSON.stringify(currentOrder)
      return next
    })
    if (!titleOverride && setNewSectionTitle) setNewSectionTitle('')
    setIsDirty(true)
    onShowToast('success', `Added new custom section "${sectionTitle}"`)
  }

  // Duplicate a section and its text content directly below it
  const handleDuplicateSection = (sourceKey: string) => {
    const targetSection = allSections.find((s) => s.key === sourceKey)
    const sourceTitleOverrides = (() => {
      try {
        return JSON.parse(freeText['__section_title_overrides'] || '{}')
      } catch {
        return {}
      }
    })()

    const originalTitle = sourceTitleOverrides[sourceKey] || targetSection?.title || 'Section'
    const newTitle = `${originalTitle} (Copy)`
    const newKey = 'custom_sec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)
    const contentToCopy = freeText[sourceKey] || ''

    setFreeText((prev) => {
      const next = { ...prev }

        // 1. Add to custom sections registry
        const currentCustom = (() => {
          try {
            return prev['__custom_sections'] ? JSON.parse(prev['__custom_sections']) : []
          } catch {
            return []
          }
        })()

        const updatedCustom = [...currentCustom, { key: newKey, title: newTitle, type: 'free_text', isCustom: true }]
        next['__custom_sections'] = JSON.stringify(updatedCustom)
        next[newKey] = contentToCopy

        // 2. Set title override for guaranteed title rendering
        const currentTitleOverrides = (() => {
          try {
            return prev['__section_title_overrides'] ? JSON.parse(prev['__section_title_overrides']) : {}
          } catch {
            return {}
          }
        })()
        currentTitleOverrides[newKey] = newTitle
        next['__section_title_overrides'] = JSON.stringify(currentTitleOverrides)

        // 3. Position directly after the source section in __section_order
        const currentOrder: string[] = (() => {
          try {
            if (prev['__section_order']) return JSON.parse(prev['__section_order'])
          } catch {
            // fallback
          }
          return allSections.map((s) => s.key)
        })()

        const sourceIndex = currentOrder.indexOf(sourceKey)
        if (sourceIndex !== -1) {
          currentOrder.splice(sourceIndex + 1, 0, newKey)
        } else {
          currentOrder.push(newKey)
        }

        next['__section_order'] = JSON.stringify(currentOrder)
        return next
    })
    setIsDirty(true)
    onShowToast('success', `Duplicated "${originalTitle}"`)
  }

  // Soft-remove a section with 24-hour expiration metadata (Instant execution)
  const handleRemoveSection = (key: string) => {
    const targetSec = allSections.find((s) => s.key === key)
    const sourceTitleOverrides = (() => {
      try {
        return JSON.parse(freeText['__section_title_overrides'] || '{}')
      } catch {
        return {}
      }
    })()
    const sectionTitle = sourceTitleOverrides[key] || targetSec?.title || 'Section'
    const isCustom = Boolean(targetSec?.isCustom || key.startsWith('custom_sec_'))

    setFreeText((prev) => {
      const next = { ...prev }

        // 1. Save into __removed_sections_meta with timestamp for 24hr auto-purge
        const currentMeta: Record<string, any> = (() => {
          try {
            return prev['__removed_sections_meta'] ? JSON.parse(prev['__removed_sections_meta']) : {}
          } catch {
            return {}
          }
        })()

        currentMeta[key] = {
          key,
          title: sectionTitle,
          isCustom,
          removedAt: Date.now()
        }
        next['__removed_sections_meta'] = JSON.stringify(currentMeta)

        // 2. Mark in __deleted_section_keys
        const currentDeleted: string[] = (() => {
          try {
            return prev['__deleted_section_keys'] ? JSON.parse(prev['__deleted_section_keys']) : []
          } catch {
            return []
          }
        })()
        if (!currentDeleted.includes(key)) {
          next['__deleted_section_keys'] = JSON.stringify([...currentDeleted, key])
        }

        // 3. Remove text content and clean up custom sections registry if applicable
        delete next[key]
        if (isCustom && next['__custom_sections']) {
          try {
            const currentCustom = JSON.parse(next['__custom_sections']) as any[]
            const updatedCustom = currentCustom.filter((c) => c.key !== key)
            next['__custom_sections'] = JSON.stringify(updatedCustom)
          } catch {
            // ignore
          }
        }

        // 4. Remove from __section_order array
        try {
          if (prev['__section_order']) {
            const currentOrder: string[] = JSON.parse(prev['__section_order'])
            const updatedOrder = currentOrder.filter((k) => k !== key)
            next['__section_order'] = JSON.stringify(updatedOrder)
          }
        } catch {
          // ignore error
        }

        return next
    })
    setIsDirty(true)
    onShowToast('success', `Moved "${sectionTitle}" to Removed Sections (Restorable for 24h)`)
  }

  // Rename a section header title
  const handleSectionTitleChange = (key: string, newTitle: string) => {
    setFreeText((prev) => {
      const next = { ...prev }
        const currentOverrides = (() => {
          try {
            return prev['__section_title_overrides']
              ? JSON.parse(prev['__section_title_overrides'])
              : {}
          } catch {
            return {}
          }
        })()

        currentOverrides[key] = newTitle
      next['__section_title_overrides'] = JSON.stringify(currentOverrides)
      return next
    })
    setIsDirty(true)
    onShowToast('success', 'Section title updated')
  }

  // Restore a soft-removed section
  const handleRestoreSection = (key: string) => {
    setFreeText((prev) => {
      const next = { ...prev }

        // Remove from __deleted_section_keys
        try {
          if (prev['__deleted_section_keys']) {
            const current: string[] = JSON.parse(prev['__deleted_section_keys'])
            const updated = current.filter((k) => k !== key)
            next['__deleted_section_keys'] = JSON.stringify(updated)
          }
        } catch {
          delete next['__deleted_section_keys']
        }

        // Remove from __removed_sections_meta
        try {
          if (prev['__removed_sections_meta']) {
            const currentMeta: Record<string, any> = JSON.parse(prev['__removed_sections_meta'])
            delete currentMeta[key]
            next['__removed_sections_meta'] = JSON.stringify(currentMeta)
          }
        } catch {
          delete next['__removed_sections_meta']
        }

        return next
    })
    setIsDirty(true)
    onShowToast('success', 'Section restored')
  }

  // Permanently delete a section from trash immediately
  const handlePermanentDeleteSection = (key: string) => {
    setFreeText((prev) => {
      const next = { ...prev }

        // If custom section, delete its text content and custom registry entry
        delete next[key]
        try {
          if (next['__custom_sections']) {
            const currentCustom = JSON.parse(next['__custom_sections']) as any[]
            const updatedCustom = currentCustom.filter((c) => c.key !== key)
            if (updatedCustom.length > 0) {
              next['__custom_sections'] = JSON.stringify(updatedCustom)
            } else {
              delete next['__custom_sections']
            }
          }
        } catch {
          delete next['__custom_sections']
        }

        // Clean up from __removed_sections_meta
        try {
          if (prev['__removed_sections_meta']) {
            const currentMeta: Record<string, any> = JSON.parse(prev['__removed_sections_meta'])
            delete currentMeta[key]
            next['__removed_sections_meta'] = JSON.stringify(currentMeta)
          }
        } catch {
          delete next['__removed_sections_meta']
        }

        return next
    })
    setIsDirty(true)
    onShowToast('success', 'Permanently deleted section')
  }

  // Clear all soft-removed sections from trash immediately
  const handleClearAllRemovedSections = () => {
    setFreeText((prev) => {
      const next = { ...prev }
      delete next['__removed_sections_meta']
      return next
    })
    setIsDirty(true)
    onShowToast('success', 'Cleared all removed sections')
  }

  // Reset section order and layout back to master template defaults
  const handleResetToDefaultLayout = (defaultSections: Array<{ key: string }>) => {
    const defaultKeys = defaultSections.map((s) => s.key)
    setFreeText((prev) => {
      const next = { ...prev }
      next['__section_order'] = JSON.stringify(defaultKeys)
      delete next['__deleted_section_keys']
      delete next['__removed_sections_meta']
      delete next['__custom_sections']
      delete next['__section_title_overrides']
      return next
    })
    setIsDirty(true)
    onShowToast('success', 'Reset document layout to template default')
  }

  return {
    handleMoveSectionUp,
    handleMoveSectionDown,
    handleAddSection,
    handleDuplicateSection,
    handleRemoveSection,
    handleSectionTitleChange,
    handleRestoreSection,
    handlePermanentDeleteSection,
    handleClearAllRemovedSections,
    handleResetToDefaultLayout
  }
}

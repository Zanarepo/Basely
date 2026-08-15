import { DocumentTemplate } from '@/lib/documents/actions'

interface UseDocumentSectionsParams {
  template: DocumentTemplate
  freeText: Record<string, string>
}

export interface DocumentSectionItem {
  key: string
  title: string
  type: string
  source?: string
  placeholder?: string
  isCustom?: boolean
}

export interface RemovedSectionItem {
  key: string
  title: string
  isCustom: boolean
  removedAt: number
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

export function useDocumentSections({ template, freeText }: UseDocumentSectionsParams) {
  // Compute custom sections stored inside freeText
  const customSections: DocumentSectionItem[] = (() => {
    try {
      if (freeText['__custom_sections']) {
        const parsed = JSON.parse(freeText['__custom_sections'])
        if (Array.isArray(parsed)) {
          return parsed.map((sec: any) => ({ ...sec, type: 'free_text', isCustom: true }))
        }
      }
    } catch (e) {
      console.error('Failed to parse custom document sections:', e)
    }
    return []
  })()

  // Track deleted section keys
  const deletedSectionKeys: string[] = (() => {
    try {
      if (freeText['__deleted_section_keys']) {
        const parsed = JSON.parse(freeText['__deleted_section_keys'])
        if (Array.isArray(parsed)) return parsed
      }
    } catch (e) {
      console.error('Failed to parse deleted section keys:', e)
    }
    return []
  })()

  // Compute section order array from freeText
  const sectionOrder: string[] = (() => {
    try {
      if (freeText['__section_order']) {
        return JSON.parse(freeText['__section_order'])
      }
    } catch (e) {
      console.error('Failed to parse section order:', e)
    }
    return []
  })()

  // Standard & Custom sections soft-removed with 24-hour expiration filter
  const removedSectionsMeta: Record<string, RemovedSectionItem> = (() => {
    try {
      if (freeText['__removed_sections_meta']) {
        return JSON.parse(freeText['__removed_sections_meta'])
      }
    } catch {
      // fallback
    }
    return {}
  })()

  const now = Date.now()

  // Compute active soft-removed sections (filtering out items removed > 24 hours ago)
  const removedSectionsList = Object.values(removedSectionsMeta).filter(
    (item) => item && typeof item.removedAt === 'number' && now - item.removedAt < TWENTY_FOUR_HOURS_MS
  )

  // Compute all active sections (filtering out deleted and soft-removed ones)
  const activeUnsortedSections = [...template.section_definitions, ...customSections].filter(
    (sec) => !deletedSectionKeys.includes(sec.key) && !removedSectionsMeta[sec.key]
  )

  const sectionOrderMap = new Map<string, number>()
  if (sectionOrder && sectionOrder.length > 0) {
    sectionOrder.forEach((key, idx) => sectionOrderMap.set(key, idx))
  }

  const allSections: DocumentSectionItem[] = [...activeUnsortedSections].sort((a, b) => {
    const orderA = sectionOrderMap.has(a.key) ? sectionOrderMap.get(a.key)! : 9999
    const orderB = sectionOrderMap.has(b.key) ? sectionOrderMap.get(b.key)! : 9999
    if (orderA !== orderB) return orderA - orderB
    return activeUnsortedSections.indexOf(a) - activeUnsortedSections.indexOf(b)
  })

  const legacyRemovedSections = [...template.section_definitions, ...customSections]
    .filter((sec) => deletedSectionKeys.includes(sec.key) && !removedSectionsMeta[sec.key])
    .map((sec) => ({
      key: sec.key,
      title: sec.title,
      isCustom: 'isCustom' in sec ? Boolean(sec.isCustom) : false,
      removedAt: Date.now()
    }))

  const allRemovedSections = [...removedSectionsList, ...legacyRemovedSections]

  // Compute section title overrides stored inside freeText
  const sectionTitleOverrides: Record<string, string> = (() => {
    try {
      if (freeText['__section_title_overrides']) {
        return JSON.parse(freeText['__section_title_overrides'])
      }
    } catch (e) {
      console.error('Failed to parse section title overrides:', e)
    }
    return {}
  })()

  return {
    allSections,
    allRemovedSections,
    sectionTitleOverrides,
    customSections
  }
}

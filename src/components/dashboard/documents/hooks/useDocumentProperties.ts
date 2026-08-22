'use client'

import { useState, useEffect } from 'react'
import { getProjectOrOrgMembers } from '@/lib/documents/core-queries'
import { saveGeneratedDocument } from '@/lib/documents/core-mutations'
import { fetchProjectReleasesData } from '@/lib/releases/release-actions'

export interface DocumentProperties {
  status: 'draft' | 'in_review' | 'approved' | 'changes_requested' | 'archived'
  ownerId?: string
  ownerName?: string
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  targetRelease?: string
  targetSprint?: string
  targetDate?: string
  tags: string[]
}

const DEFAULT_PROPERTIES: DocumentProperties = {
  status: 'draft',
  priority: 'P2',
  targetRelease: 'Release 0',
  targetSprint: 'Sprint 1',
  targetDate: '',
  tags: ['Engineering', 'Product'],
}

interface UseDocumentPropertiesProps {
  projectId: string
  documentType: string
  freeText: Record<string, string>
  setFreeText: React.Dispatch<React.SetStateAction<Record<string, string>>>
  setIsDirty: (dirty: boolean) => void
  onShowToast: (type: 'success' | 'error', msg: string) => void
  isSnapshot?: boolean
}

export function useDocumentProperties({
  projectId,
  documentType,
  freeText,
  setFreeText,
  setIsDirty,
  onShowToast,
  isSnapshot = false,
}: UseDocumentPropertiesProps) {
  const [members, setMembers] = useState<Array<{ userId: string; name: string; role: string; email?: string }>>([])
  const [currentUserId, setCurrentUserId] = useState<string | undefined>()
  const [projectReleases, setProjectReleases] = useState<Array<{ id: string; name: string; versionTag?: string; status: string }>>([])
  const [projectIterations, setProjectIterations] = useState<Array<{ id: string; name: string; status: string }>>([])

  useEffect(() => {
    let isMounted = true
    async function loadMembersAndReleases() {
      if (!projectId) return
      
      const resMembers = await getProjectOrOrgMembers(projectId)
      if (isMounted) {
        setMembers(resMembers.members || [])
        setCurrentUserId(resMembers.currentUserId)
      }

      const resReleases = await fetchProjectReleasesData(projectId)
      if (isMounted && resReleases.ok) {
        if (resReleases.releases) {
          setProjectReleases(resReleases.releases.map(r => ({ id: r.id, name: r.name, versionTag: (r as any).versionTag || (r as any).version || '', status: r.status })))
        }
        if (resReleases.iterations) {
          setProjectIterations(resReleases.iterations.map(i => ({ id: i.id, name: i.name, status: (i as any).status || '' })))
        }
      }
    }
    loadMembersAndReleases()
    return () => {
      isMounted = false
    }
  }, [projectId])

  // Parse properties from freeText
  const properties: DocumentProperties = (() => {
    try {
      if (freeText['__document_properties']) {
        const parsed = JSON.parse(freeText['__document_properties'])
        return { ...DEFAULT_PROPERTIES, ...parsed }
      }
    } catch (e) {
      console.error('Failed to parse document properties:', e)
    }
    return DEFAULT_PROPERTIES
  })()

  const saveProperties = (updated: DocumentProperties) => {
    const jsonStr = JSON.stringify(updated)
    setFreeText((prev) => {
      const next = { ...prev, '__document_properties': jsonStr }
      if (projectId && documentType && !isSnapshot) {
        setTimeout(() => {
          saveGeneratedDocument(projectId, documentType, next, false).catch((err) => {
            console.error('[Document Properties Save Error]:', err)
          })
        }, 0)
      }
      return next
    })
    setIsDirty(true)
  }

  const updateProperty = <K extends keyof DocumentProperties>(key: K, value: DocumentProperties[K]) => {
    const updated = { ...properties, [key]: value }
    saveProperties(updated)
    onShowToast('success', `Updated ${String(key)} property`)
  }

  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (!trimmed || properties.tags.includes(trimmed)) return
    const updated = { ...properties, tags: [...properties.tags, trimmed] }
    saveProperties(updated)
    onShowToast('success', `Added tag "${trimmed}"`)
  }

  const removeTag = (tagToRemove: string) => {
    const updated = { ...properties, tags: properties.tags.filter((t) => t !== tagToRemove) }
    saveProperties(updated)
    onShowToast('success', `Removed tag "${tagToRemove}"`)
  }

  return {
    properties,
    members,
    currentUserId,
    projectReleases,
    projectIterations,
    updateProperty,
    addTag,
    removeTag,
  }
}

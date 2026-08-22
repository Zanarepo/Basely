import { useState, useEffect } from 'react'
import { getWbsElements } from '@/lib/wbs/core-actions'
import { getRaidEntries, type RaidLogEntry } from '@/lib/raid/actions'
import type { WbsElement } from '@/lib/wbs/constants'

interface UseWbsDependenciesListProps {
  projectId?: string
  wbsElementId?: string
  onDependenciesChanged?: () => void
}

export function useWbsDependenciesList({
  projectId,
  wbsElementId,
  onDependenciesChanged
}: UseWbsDependenciesListProps) {
  const [loadingRaid, setLoadingRaid] = useState(false)
  const [directRaidItems, setDirectRaidItems] = useState<{ item: RaidLogEntry }[]>([])
  const [inheritedRaidItems, setInheritedRaidItems] = useState<{ item: RaidLogEntry; parentCode: string; parentName: string }[]>([])
  const [showClosedRaid, setShowClosedRaid] = useState(false)
  const [isAutoLinking, setIsAutoLinking] = useState(false)

  const handleAutoLinkDependencies = async () => {
    if (!projectId) return
    setIsAutoLinking(true)
    try {
      const { autoGenerateProjectDependenciesWithAi } = await import('@/lib/schedule/actions/dependencies')
      const res = await autoGenerateProjectDependenciesWithAi(projectId)
      if (res.ok) {
        // Refetch scheduling data in-place so checkboxes update instantly without page reload
        if (onDependenciesChanged) {
          onDependenciesChanged()
        }
      } else {
        console.error('Failed to auto-link dependencies:', res.error)
      }
    } catch (err) {
      console.error('Auto-link dependencies error:', err)
    } finally {
      setIsAutoLinking(false)
    }
  }

  useEffect(() => {
    if (!projectId || !wbsElementId) return
    let isMounted = true

    const fetchGovernanceBridge = async () => {
      setLoadingRaid(true)
      try {
        const [wbsRes, raidRes] = await Promise.all([
          getWbsElements(projectId),
          getRaidEntries(projectId, 'all')
        ])

        if (!isMounted) return

        if (wbsRes.ok && wbsRes.data && raidRes.ok && raidRes.data) {
          const allWbs = wbsRes.data
          const allRaid = raidRes.data

          // 1. Build set of ancestor IDs for hierarchical inheritance
          const ancestorIds = new Set<string>()
          const ancestorMap = new Map<string, WbsElement>()
          let currentId: string | undefined = wbsElementId
          while (currentId) {
            const el = allWbs.find((w: WbsElement) => w.id === currentId)
            if (!el || !el.parentId) break
            ancestorIds.add(el.parentId)
            const parent = allWbs.find((w: WbsElement) => w.id === el.parentId)
            if (parent) ancestorMap.set(parent.id, parent)
            currentId = el.parentId
          }

          // 2. Classify RAID items as direct or inherited
          const direct: { item: RaidLogEntry }[] = []
          const inherited: { item: RaidLogEntry; parentCode: string; parentName: string }[] = []

          allRaid.forEach((item: RaidLogEntry) => {
            if (!item.linked_wbs_element_id) return
            const linkedIds = item.linked_wbs_element_id.split(',').map((s: string) => s.trim()).filter(Boolean)

            if (linkedIds.includes(wbsElementId)) {
              direct.push({ item })
            } else {
              // Check if any of our ancestors are linked to this RAID item
              for (const id of linkedIds) {
                if (ancestorIds.has(id)) {
                  const p = ancestorMap.get(id) || allWbs.find((w: WbsElement) => w.id === id)
                  inherited.push({
                    item,
                    parentCode: p?.code || 'Parent',
                    parentName: p?.name || 'Folder'
                  })
                  break // avoid duplicates
                }
              }
            }
          })

          setDirectRaidItems(direct)
          setInheritedRaidItems(inherited)
        }
      } catch (err) {
        console.error('Error calculating hierarchical RAID governance bridge:', err)
      } finally {
        if (isMounted) setLoadingRaid(false)
      }
    }

    fetchGovernanceBridge()
    return () => { isMounted = false }
  }, [projectId, wbsElementId])

  return {
    loadingRaid,
    directRaidItems,
    inheritedRaidItems,
    showClosedRaid,
    setShowClosedRaid,
    isAutoLinking,
    handleAutoLinkDependencies
  }
}

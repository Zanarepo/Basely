import { useMemo } from 'react'
import type { WbsElement } from '@/lib/wbs/constants'

export type TreeNode = {
  element: WbsElement
  children: TreeNode[]
}

export function useWbsTreeData(
  elements: WbsElement[],
  searchQuery: string,
  setExpandedNodeIds: React.Dispatch<React.SetStateAction<Set<string>>>
) {

  const recalculateClientCodes = (flatList: WbsElement[]): WbsElement[] => {
    const list = [...flatList]

    const recurse = (parentId: string | null, parentCode: string) => {
      const children = list
        .filter((el) => el.parentId === parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder)

      children.forEach((child, index) => {
        const computedCode = parentCode === '' ? `${index + 1}` : `${parentCode}.${index + 1}`
        child.code = computedCode
        recurse(child.id, computedCode)
      })
    }

    recurse(null, '')
    return list
  }

  // Search logic: If node matches, keep it and all its ancestor parents visible
  const searchFilterMap = useMemo(() => {
    if (!searchQuery.trim()) return null

    const q = searchQuery.toLowerCase()
    const matches = new Set<string>()
    const ancestorsToKeep = new Set<string>()

    // Find direct matches
    elements.forEach((el) => {
      if (el.name.toLowerCase().includes(q) || el.code.includes(q)) {
        matches.add(el.id)
        // Climb parents and add to keep path
        let parentId = el.parentId
        while (parentId) {
          ancestorsToKeep.add(parentId)
          const pNode = elements.find((x) => x.id === parentId)
          parentId = pNode ? pNode.parentId : null
        }
      }
    })

    // Auto-expand all ancestors when searching
    if (ancestorsToKeep.size > 0) {
      setExpandedNodeIds((prev) => {
        const next = new Set(prev)
        ancestorsToKeep.forEach((id) => next.add(id))
        return next
      })
    }

    return { matches, ancestorsToKeep }
  }, [searchQuery, elements, setExpandedNodeIds])

  const treeNodes = useMemo(() => {
    const buildTree = (flat: WbsElement[]): TreeNode[] => {
      const nodeMap = new Map<string, TreeNode>()
      const roots: TreeNode[] = []

      flat.forEach((el) => {
        nodeMap.set(el.id, { element: el, children: [] })
      })

      flat.forEach((el) => {
        const node = nodeMap.get(el.id)!
        if (el.parentId && nodeMap.has(el.parentId)) {
          nodeMap.get(el.parentId)!.children.push(node)
        } else if (!el.parentId) {
          roots.push(node)
        }
      })

      // Sorting children recursively
      nodeMap.forEach((node) => {
        node.children.sort((a, b) => a.element.sortOrder - b.element.sortOrder)
      })

      roots.sort((a, b) => a.element.sortOrder - b.element.sortOrder)

      return roots
    }

    // Filter elements list if search filter matches
    let processedElements = elements
    if (searchFilterMap) {
      processedElements = elements.filter(
        (el) => searchFilterMap.matches.has(el.id) || searchFilterMap.ancestorsToKeep.has(el.id)
      )
    }

    return buildTree(processedElements)
  }, [elements, searchFilterMap])

  return {
    recalculateClientCodes,
    treeNodes,
    searchFilterMap
  }
}

import type { WbsElement } from '@/lib/wbs/constants'

export type TreeNode = {
  element: WbsElement
  children: TreeNode[]
}

export type WbsTreeProps = {
  treeNodes: TreeNode[]
  expandedNodeIds: Set<string>
  onToggleExpand: (id: string) => void
  activeElementId: string | null
  onSelect: (id: string) => void
  onAddChild: (element: WbsElement) => void
  onAddSibling: (element: WbsElement) => void
  onDelete: (element: WbsElement) => void
  onRename: (id: string, newName: string) => void
  onMove: (draggedId: string, targetId: string, position: 'before' | 'after' | 'inside') => void
  hasEditAccess: boolean
  draggedNodeId: string | null
  setDraggedNodeId: (id: string | null) => void
  workspaceMembers: { userId: string; name: string; email: string; role?: string }[]
  getElementProgress: (id: string) => number
  selectedIds: string[]
  toggleSelection: (id: string) => void
  selectAll: () => void
  clearSelection: () => void
}

export type WbsNodeRowProps = {
  node: TreeNode
  depth: number
  expandedNodeIds: Set<string>
  onToggleExpand: (id: string) => void
  activeElementId: string | null
  onSelect: (id: string) => void
  onAddChild: (element: WbsElement) => void
  onAddSibling: (element: WbsElement) => void
  onDelete: (element: WbsElement) => void
  onRename: (id: string, newName: string) => void
  onMove: (draggedId: string, targetId: string, position: 'before' | 'after' | 'inside') => void
  hasEditAccess: boolean
  draggedNodeId: string | null
  setDraggedNodeId: (id: string | null) => void
  workspaceMembers: { userId: string; name: string; email: string; role?: string }[]
  getElementProgress: (id: string) => number
  selectedIds: string[]
  toggleSelection: (id: string) => void
}

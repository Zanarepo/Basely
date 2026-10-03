import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import type { WbsElement } from '@/lib/wbs/constants'
import { useWbsGridData } from './workspace/useWbsGridData'
import { TerminologyDict } from '@/utils/terminology'
import { useUserPersona } from '@/hooks/use-user-persona'

import { useWbsGridMetrics } from './grid/hooks/useWbsGridMetrics'
import { WbsGridMobileCards } from './grid/WbsGridMobileCards'
import { WbsGridDesktopTable } from './grid/WbsGridDesktopTable'
import { WbsGridColumnMenu } from './grid/WbsGridColumnMenu'

type WbsGridViewProps = {
  projectId: string
  elements: WbsElement[]
  workspaceMembers: { userId: string; name: string; email: string }[]
  onSelect: (id: string) => void
  selectedIds?: string[]
  toggleSelection?: (id: string) => void
  selectAll?: () => void
  clearSelection?: () => void
  expandedNodeIds?: Set<string>
  onToggleExpand?: (id: string, e: React.MouseEvent) => void
  terms: TerminologyDict
}

export function WbsGridView({ projectId, elements, workspaceMembers, onSelect, selectedIds = [], toggleSelection, selectAll, clearSelection, expandedNodeIds = new Set(), onToggleExpand, terms }: WbsGridViewProps) {
  const { showBudgetControls } = useUserPersona()
  const { gridData, loading } = useWbsGridData(projectId, elements)
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set())

  // Load preferences from local storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`basepro_grid_columns_${projectId}`)
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as string[]
          setHiddenCols(new Set(parsed))
        } catch (e) {
          // ignore error
        }
      }
    }
  }, [projectId])

  const toggleColumn = (key: string) => {
    setHiddenCols(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      if (typeof window !== 'undefined') {
        localStorage.setItem(`basepro_grid_columns_${projectId}`, JSON.stringify(Array.from(next)))
      }
      return next
    })
  }

  const metrics = useWbsGridMetrics(gridData)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 min-h-[300px]">
        <Loader2 className="h-6 w-6 text-violet-500 animate-spin" />
        <span className="ml-2 text-sm text-app-muted">Loading schedule data...</span>
      </div>
    )
  }

  const visibleGridData: typeof gridData = []
  const elementLevels = new Map<string, number>()
  const parentVisible = new Map<string, boolean>()

  // Filter out milestones (duration 0) — they only appear on Gantt and Status Report
  const nonMilestoneGridData = gridData.filter((el) => {
    if (!el.isWorkPackage) return true // summary elements always show
    return el.duration !== '0d'
  })

  nonMilestoneGridData.forEach((el) => {
    let isVisible = true
    let lvl = 0

    if (el.parentId) {
      const pVisible = parentVisible.get(el.parentId) ?? true
      const pExpanded = expandedNodeIds.has(el.parentId)
      isVisible = pVisible && pExpanded
      lvl = (elementLevels.get(el.parentId) || 0) + 1
    }

    elementLevels.set(el.id, lvl)
    parentVisible.set(el.id, isVisible)

    if (isVisible) {
      visibleGridData.push(el)
    }
  })

  const isAllSelected = visibleGridData.length > 0 && visibleGridData.every((item) => selectedIds.includes(item.id))


  return (
    <div className="h-[600px] overflow-auto w-full">
      {/* Mobile Stacked Cards Layout */}
      {(selectAll || clearSelection) && visibleGridData.length > 0 && (
        <div className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 border-b border-app-border bg-app-surface-solid text-xs font-semibold shadow-sm">
          <label className="flex items-center gap-2.5 cursor-pointer text-app-fg">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={(e) => {
                if (e.target.checked) {
                  if (selectAll) selectAll()
                } else {
                  if (clearSelection) clearSelection()
                }
              }}
              className="w-4 h-4 rounded border-app-border text-violet-500 focus:ring-violet-500 bg-app-surface cursor-pointer"
            />
            Select All ({visibleGridData.length} items)
          </label>
          {selectedIds.length > 0 && (
            <span className="text-violet-500 font-bold">{selectedIds.length} selected</span>
          )}
        </div>
      )}

      <div className="md:hidden space-y-3.5 p-4">
        <WbsGridMobileCards
          visibleGridData={visibleGridData}
          elementLevels={elementLevels}
          elements={elements}
          selectedIds={selectedIds}
          toggleSelection={toggleSelection}
          onSelect={onSelect}
          onToggleExpand={onToggleExpand}
          expandedNodeIds={expandedNodeIds}
          terms={terms}
          showBudgetControls={showBudgetControls}
        />
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block p-5">
        <WbsGridColumnMenu
          hiddenCols={hiddenCols}
          toggleColumn={toggleColumn}
          showBudgetControls={showBudgetControls}
        />

        <WbsGridDesktopTable
          visibleGridData={visibleGridData}
          elementLevels={elementLevels}
          elements={elements}
          selectedIds={selectedIds}
          toggleSelection={toggleSelection}
          selectAll={selectAll}
          clearSelection={clearSelection}
          isAllSelected={isAllSelected}
          onSelect={onSelect}
          onToggleExpand={onToggleExpand}
          expandedNodeIds={expandedNodeIds}
          hiddenCols={hiddenCols}
          showBudgetControls={showBudgetControls}
          terms={terms}
          metrics={metrics}
        />
      </div>
    </div>
  )
}

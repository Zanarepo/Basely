'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'

import { GanttTimelineCanvas } from './GanttTimelineCanvas'
import { CpmNetworkMapModal } from './CpmNetworkMapModal'
import { GanttToolbar } from './GanttToolbar'
import { GanttSidebar } from './GanttSidebar'
import { ScheduleSheetModal } from './ScheduleSheetModal'
import { useGanttData } from '@/lib/schedule/useGanttData'
import { useGanttPresence } from './useGanttPresence'
import { LiveCursorsOverlay } from '../wbs/workspace/LiveCursorsOverlay'
import { WbsElementSidePanel } from '../wbs/WbsElementSidePanel'
import { updateWbsElement } from '@/lib/wbs/actions'
import { getTerminology } from '@/utils/terminology'
import type { WbsElement } from '@/lib/wbs/constants'
import type { Iteration } from '@/lib/releases/types'
import { createClient } from '@/utils/supabase/client'

type GanttWorkspaceProps = {
  projectId: string
  hasEditAccess: boolean
  workspaceMembers: any[]
  currentUserId: string
  currentUserName: string
  methodology?: string | null
}

const ROW_HEIGHT = 48

export default function GanttWorkspace({
  projectId,
  hasEditAccess,
  workspaceMembers,
  currentUserId,
  currentUserName,
  methodology = 'Agile',
}: GanttWorkspaceProps) {
  const {
    loading,
    error,
    elements,
    activities,
    dependencies,
    baselines,
    pendingBaselines,
    baselineSnapshots,
    hudMessage,
    expandedNodeIds,
    selectedBaselineId,
    setSelectedBaselineId,
    timelineDates,
    visibleElements,
    wbsCodes,
    elementLevels,
    handleMoveActivity,
    handleResizeActivity,
    handleCreateDependency,
    handleDeleteDependency,
    handleToggleExpand,
    handleCreateBaseline,
    handleDeleteBaseline,
    handleRenameBaseline,
    refetchData,
  } = useGanttData(projectId)

  const terms = getTerminology(methodology)
  const [activeElementId, setActiveElementId] = useState<string | null>(null)
  const activeElement = elements.find((el) => el.id === activeElementId) || null

  // Navigation & Control States
  const [zoom, setZoom] = useState<'day' | 'week' | 'month' | 'quarter'>('week')
  const [showBaseline, setShowBaseline] = useState(false)
  const [isCpmModalOpen, setIsCpmModalOpen] = useState(false)
  const [isScheduleSheetOpen, setIsScheduleSheetOpen] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [scopeFilter, setScopeFilter] = useState<string>('all')
  const [iterations, setIterations] = useState<Iteration[]>([])

  useEffect(() => {
    const fetchIterations = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('iterations')
        .select('*')
        .eq('project_id', projectId)
        .order('sequence_number', { ascending: true })

      if (data) {
        setIterations(
          data.map((i: any) => ({
            id: i.id,
            projectId: i.project_id,
            name: i.name,
            sequenceNumber: i.sequence_number,
            startDate: i.start_date,
            endDate: i.end_date,
            labelOverride: i.label_override || null,
            createdAt: i.created_at,
            updatedAt: i.updated_at,
          }))
        )
      }
    }
    fetchIterations()
  }, [projectId])

  const activeIteration = useMemo(() => {
    if (!iterations || iterations.length === 0) return null
    const now = new Date()
    const current = iterations.find((i) => new Date(i.startDate) <= now && new Date(i.endDate) >= now)
    return current || iterations[0]
  }, [iterations])

  const [hideCompleted, setHideCompleted] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`gantt_hide_completed_${projectId}`)
      return saved ? JSON.parse(saved) : false
    }
    return false
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`gantt_hide_completed_${projectId}`, JSON.stringify(hideCompleted))
    }
  }, [projectId, hideCompleted])

  const isCompletedStatus = (status?: string | null) => {
    if (!status) return false
    const s = status.toLowerCase()
    return s === 'complete' || s === 'completed' || s === 'done'
  }

  const completedCount = useMemo(() => {
    return elements.filter((e) => isCompletedStatus(e.status)).length
  }, [elements])

  // Filter visibleElements based on scopeFilter & hideCompleted
  const scopedVisibleElements = useMemo(() => {
    let baseList = visibleElements

    if (scopeFilter !== 'all') {
      const matchSet = new Set<string>()

      if (scopeFilter === 'active') {
        if (activeIteration) {
          elements.forEach((e) => {
            if (e.iterationId === activeIteration.id || e.iteration_id === activeIteration.id) {
              matchSet.add(e.id)
            }
          })
        }
      } else if (scopeFilter === 'backlog') {
        elements.forEach((e) => {
          if (!e.iterationId && !e.iteration_id) matchSet.add(e.id)
        })
      } else if (scopeFilter === 'lookahead') {
        const now = new Date()
        const cutoff = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000)
        elements.forEach((e) => {
          if (!e.createdAt || new Date(e.createdAt) <= cutoff) matchSet.add(e.id)
        })
      } else {
        elements.forEach((e) => {
          if (e.iterationId === scopeFilter || e.iteration_id === scopeFilter) matchSet.add(e.id)
        })
      }

      // Include ancestors of matching nodes to preserve tree structure
      const includedIds = new Set<string>()
      matchSet.forEach((id) => {
        let curr: string | null = id
        while (curr) {
          includedIds.add(curr)
          const node = elements.find((el) => el.id === curr)
          curr = node?.parentId || null
        }
      })

      baseList = visibleElements.filter((el) => includedIds.has(el.id))
    }

    if (hideCompleted) {
      baseList = baseList.filter((el) => !isCompletedStatus(el.status))
    }

    return baseList
  }, [visibleElements, elements, scopeFilter, activeIteration, hideCompleted])

  // Filter elements and activities passed to canvas to match scopedVisibleElements
  const scopedElements = useMemo(() => {
    const visibleIds = new Set(scopedVisibleElements.map(e => e.id))
    return elements.filter(e => visibleIds.has(e.id))
  }, [elements, scopedVisibleElements])

  const scopedActivities = useMemo(() => {
    const visibleIds = new Set(scopedVisibleElements.map(e => e.id))
    return activities.filter(a => visibleIds.has(a.wbsElementId) || visibleIds.has(a.id))
  }, [activities, scopedVisibleElements])

  // Scroll Sync Refs
  const leftScrollRef = useRef<HTMLDivElement>(null)
  const rightScrollRef = useRef<HTMLDivElement>(null)

  // Sync scroll handler
  const handleTimelineScroll = () => {
    if (rightScrollRef.current && leftScrollRef.current) {
      leftScrollRef.current.scrollTop = rightScrollRef.current.scrollTop
    }
  }

  const handleExportSnap = () => {
    window.print()
  }

  const {
    activeUsers,
    showCursors,
    toggleCursors,
    lockedActivities,
    acquireLock,
    releaseLock,
  } = useGanttPresence(projectId, currentUserId, currentUserName)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        <span className="text-sm text-app-subtle mt-4">Loading Gantt schedule timeline...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] border border-red-200 bg-red-50 rounded-2xl p-6">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <span className="text-sm font-semibold text-red-800 mt-4">Failed to load schedule</span>
        <span className="text-xs text-red-600 mt-2 text-center max-w-md">{error}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-app-bg text-app-fg p-6 gap-6 relative">
      {/* HUD Message Notifications overlay */}
      {hudMessage && (
        <div className="fixed top-4 right-4 z-50 shadow-lg flex items-center gap-3 px-4 py-3 rounded-2xl animate-fade-in border bg-app-surface-solid border-app-border">
          {hudMessage.type === 'info' && <Loader2 className="w-4 h-4 animate-spin text-violet-500" />}
          {hudMessage.type === 'success' && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
          {hudMessage.type === 'error' && <span className="w-2.5 h-2.5 rounded-full bg-red-500" />}
          <span className="text-xs font-bold text-app-fg">{hudMessage.text}</span>
        </div>
      )}

      {/* Live Cursors Overlay */}
      <LiveCursorsOverlay activeUsers={activeUsers} showCursors={showCursors} />

      {/* Gantt Header Toolbar */}
      <GanttToolbar
        zoom={zoom}
        setZoom={setZoom}
        baselines={baselines}
        pendingBaselines={pendingBaselines}
        showBaseline={showBaseline}
        setShowBaseline={setShowBaseline}
        selectedBaselineId={selectedBaselineId}
        setSelectedBaselineId={setSelectedBaselineId}
        hasEditAccess={hasEditAccess}
        onSaveBaseline={handleCreateBaseline}
        onDeleteBaseline={handleDeleteBaseline}
        onRenameBaseline={handleRenameBaseline}
        onOpenNetworkMap={() => setIsCpmModalOpen(true)}
        onOpenScheduleSheet={() => setIsScheduleSheetOpen(true)}
        onExportChart={handleExportSnap}
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        iterations={iterations}
        scopeFilter={scopeFilter}
        setScopeFilter={setScopeFilter}
        methodology={methodology}
        filteredCount={scopedVisibleElements.filter((e) => e.isWorkPackage).length}
        workPackagesTerm={terms.workPackages}
        hideCompleted={hideCompleted}
        onToggleHideCompleted={() => setHideCompleted((prev) => !prev)}
        completedCount={completedCount}
      />

      {/* Unified Gantt Board Panel (Split view) */}
      <div className="flex flex-1 border border-app-border rounded-3xl bg-app-surface-solid overflow-hidden min-h-[500px]">
        {/* Left Side: WBS Tree list columns */}
        {showSidebar && (
          <GanttSidebar
            visibleElements={scopedVisibleElements}
            wbsCodes={wbsCodes}
            elementLevels={elementLevels}
            expandedNodeIds={expandedNodeIds}
            workspaceMembers={workspaceMembers}
            onToggleExpand={handleToggleExpand}
            onSelectElement={setActiveElementId}
            scrollRef={leftScrollRef}
            rowHeight={ROW_HEIGHT}
          />
        )}

        {/* Right Side: Timeline scrolling canvas */}
        <div
          ref={rightScrollRef}
          onScroll={handleTimelineScroll}
          className="flex-1 overflow-x-auto overflow-y-auto"
        >
          <GanttTimelineCanvas
            elements={scopedElements}
            activities={scopedActivities}
            dependencies={dependencies}
            timelineStart={timelineDates.start}
            timelineEnd={timelineDates.end}
            zoom={zoom}
            showBaseline={showBaseline}
            baselineSnapshots={baselineSnapshots}
            onMoveActivity={handleMoveActivity}
            onResizeActivity={handleResizeActivity}
            onCreateDependency={handleCreateDependency}
            onDeleteDependency={handleDeleteDependency}
            hasEditAccess={hasEditAccess}
            expandedNodeIds={expandedNodeIds}
            lockedActivities={lockedActivities}
            acquireLock={acquireLock}
            releaseLock={releaseLock}
            onSelectElement={setActiveElementId}
          />
        </div>
      </div>

      <CpmNetworkMapModal
        isOpen={isCpmModalOpen}
        onClose={() => setIsCpmModalOpen(false)}
        activities={activities}
        dependencies={dependencies}
        elements={elements}
      />

      <ScheduleSheetModal
        isOpen={isScheduleSheetOpen}
        onClose={() => setIsScheduleSheetOpen(false)}
        elements={elements}
        activities={activities}
        dependencies={dependencies}
        wbsCodes={wbsCodes}
        elementLevels={elementLevels}
      />

      <WbsElementSidePanel
        element={activeElement}
        workspaceMembers={workspaceMembers}
        onClose={() => setActiveElementId(null)}
        onSave={async (id: string, updates: Partial<WbsElement>) => {
          try {
            const res = await updateWbsElement(id, projectId, updates)
            if (res.ok) {
              await refetchData(true)
              return true
            }
            return false
          } catch (err) {
            console.error('Failed to update element:', err)
            return false
          }
        }}
        onAssignmentChanged={() => refetchData(true)}
        hasEditAccess={hasEditAccess}
        canAssignMembers={hasEditAccess}
        customStatuses={['Not Started', 'In Progress', 'Complete', 'On Hold']}
        onAddCustomStatus={() => {}}
        onShowToast={() => {}}
        callerRole="PM"
        callerUserId={currentUserId}
        currency="USD"
        terms={getTerminology(null)}
        organizationId="default_org"
        tier="premium"
        aiEnabled={true}
      />
    </div>
  )
}

'use client'

import { useState, useRef } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'

import { GanttTimelineCanvas } from './GanttTimelineCanvas'
import { CpmNetworkMapModal } from './CpmNetworkMapModal'
import { GanttToolbar } from './GanttToolbar'
import { GanttSidebar } from './GanttSidebar'
import { ScheduleSheetModal } from './ScheduleSheetModal'
import { useGanttData } from '@/lib/schedule/useGanttData'

type GanttWorkspaceProps = {
  projectId: string
  hasEditAccess: boolean
  workspaceMembers: any[]
}

const ROW_HEIGHT = 48

export default function GanttWorkspace({
  projectId,
  hasEditAccess,
  workspaceMembers,
}: GanttWorkspaceProps) {
  const {
    loading,
    error,
    elements,
    activities,
    dependencies,
    baselines,
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
  } = useGanttData(projectId)

  // Navigation & Control States
  const [zoom, setZoom] = useState<'day' | 'week' | 'month' | 'quarter'>('week')
  const [showBaseline, setShowBaseline] = useState(false)
  const [isCpmModalOpen, setIsCpmModalOpen] = useState(false)
  const [isScheduleSheetOpen, setIsScheduleSheetOpen] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)

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
    // We keep this simple logic in the workspace component
    window.print()
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
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
          {hudMessage.type === 'info' && <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />}
          {hudMessage.type === 'success' && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
          {hudMessage.type === 'error' && <span className="w-2.5 h-2.5 rounded-full bg-red-500" />}
          <span className="text-xs font-bold text-app-fg">{hudMessage.text}</span>
        </div>
      )}

      {/* Gantt Header Toolbar */}
      <GanttToolbar
        zoom={zoom}
        setZoom={setZoom}
        baselines={baselines}
        showBaseline={showBaseline}
        setShowBaseline={setShowBaseline}
        selectedBaselineId={selectedBaselineId}
        setSelectedBaselineId={setSelectedBaselineId}
        hasEditAccess={hasEditAccess}
        onSaveBaseline={handleCreateBaseline}
        onOpenNetworkMap={() => setIsCpmModalOpen(true)}
        onOpenScheduleSheet={() => setIsScheduleSheetOpen(true)}
        onExportChart={handleExportSnap}
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
      />

      {/* Unified Gantt Board Panel (Split view) */}
      <div className="flex flex-1 border border-app-border rounded-3xl bg-app-surface-solid overflow-hidden min-h-[500px]">
        {/* Left Side: WBS Tree list columns */}
        {showSidebar && (
          <GanttSidebar
            visibleElements={visibleElements}
            wbsCodes={wbsCodes}
            elementLevels={elementLevels}
            expandedNodeIds={expandedNodeIds}
            workspaceMembers={workspaceMembers}
            onToggleExpand={handleToggleExpand}
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
            elements={elements}
            activities={activities}
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
    </div>
  )
}

import { useScheduleData } from './hooks/useScheduleData'
import { useWbsTree } from './hooks/useWbsTree'
import { useScheduleActions } from './hooks/useScheduleActions'
import { useBaselineActions } from './hooks/useBaselineActions'

/**
 * Orchestrates all Gantt chart data and actions by composing focused sub-hooks.
 *
 * Sub-hooks:
 * - useScheduleData:     Data fetching, realtime subscriptions, core state
 * - useWbsTree:          WBS levels, codes, visibility, timeline bounds
 * - useScheduleActions:  Move, resize, create/delete dependency (CPM)
 * - useBaselineActions:  Create, delete, rename baselines
 */
export function useGanttData(projectId: string) {
  const scheduleData = useScheduleData(projectId)
  
  const {
    elements,
    activities,
    setActivities,
    dependencies,
    setDependencies,
    expandedNodeIds,
    setExpandedNodeIds,
    selectedBaselineId,
    setSelectedBaselineId,
    setLoading,
    showHud,
    fetchData,
  } = scheduleData

  const wbsTree = useWbsTree(elements, activities, expandedNodeIds, setExpandedNodeIds)

  const scheduleActions = useScheduleActions({
    projectId,
    activities,
    setActivities,
    dependencies,
    setDependencies,
    timelineStart: wbsTree.timelineDates.start,
    showHud,
    fetchData,
  })

  const baselineActions = useBaselineActions({
    projectId,
    selectedBaselineId,
    setSelectedBaselineId,
    setLoading,
    showHud,
    fetchData,
  })

  return {
    // State
    loading: scheduleData.loading,
    error: scheduleData.error,
    elements,
    activities,
    dependencies,
    baselines: scheduleData.baselines,
    pendingBaselines: scheduleData.pendingBaselines,
    baselineSnapshots: scheduleData.baselineSnapshots,
    hudMessage: scheduleData.hudMessage,
    expandedNodeIds,
    selectedBaselineId,
    setSelectedBaselineId,

    // WBS Tree
    timelineDates: wbsTree.timelineDates,
    visibleElements: wbsTree.visibleElements,
    wbsCodes: wbsTree.wbsCodes,
    elementLevels: wbsTree.elementLevels,
    handleToggleExpand: wbsTree.handleToggleExpand,

    // Schedule Actions
    handleMoveActivity: scheduleActions.handleMoveActivity,
    handleResizeActivity: scheduleActions.handleResizeActivity,
    handleCreateDependency: scheduleActions.handleCreateDependency,
    handleDeleteDependency: scheduleActions.handleDeleteDependency,

    // Baseline Actions
    handleCreateBaseline: baselineActions.handleCreateBaseline,
    handleDeleteBaseline: baselineActions.handleDeleteBaseline,
    handleRenameBaseline: baselineActions.handleRenameBaseline,

    // Utilities
    refetchData: fetchData,
  }
}

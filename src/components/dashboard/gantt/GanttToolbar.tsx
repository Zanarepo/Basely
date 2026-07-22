import { Calendar, ZoomIn, ZoomOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { GanttToolbarMoreMenu } from './GanttToolbarMoreMenu'

type GanttToolbarProps = {
  zoom: 'day' | 'week' | 'month' | 'quarter'
  setZoom: React.Dispatch<React.SetStateAction<'day' | 'week' | 'month' | 'quarter'>>
  baselines: any[]
  pendingBaselines: any[]
  showBaseline: boolean
  setShowBaseline: React.Dispatch<React.SetStateAction<boolean>>
  selectedBaselineId: string
  setSelectedBaselineId: (id: string) => void
  hasEditAccess: boolean
  onSaveBaseline: () => void
  onOpenNetworkMap: () => void
  onOpenScheduleSheet: () => void
  onExportChart: () => void
  showSidebar: boolean
  setShowSidebar: React.Dispatch<React.SetStateAction<boolean>>
}

export function GanttToolbar({
  zoom,
  setZoom,
  baselines,
  pendingBaselines,
  showBaseline,
  setShowBaseline,
  selectedBaselineId,
  setSelectedBaselineId,
  hasEditAccess,
  onSaveBaseline,
  onOpenNetworkMap,
  onOpenScheduleSheet,
  onExportChart,
  showSidebar,
  setShowSidebar,
}: GanttToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-app-surface-solid border border-app-border rounded-3xl p-4">
      {/* Left Side: Scheduling status */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowSidebar((prev) => !prev)}
          className="p-2 bg-app-muted-surface hover:bg-app-surface border border-app-border rounded-2xl transition-colors"
          title={showSidebar ? "Hide details sidebar" : "Show details sidebar"}
        >
          {showSidebar ? <PanelLeftClose className="w-5 h-5 text-indigo-500" /> : <PanelLeftOpen className="w-5 h-5 text-indigo-500" />}
        </button>
        <Calendar className="w-6 h-6 text-indigo-500 hidden sm:block" />
        <div>
          <h2 className="text-base font-bold">Interactive Gantt Timeline</h2>
          <p className="text-[11px] text-app-subtle">
            CPM Forward/Backward passes auto-calculated on each bar movement.
          </p>
        </div>
      </div>

      {/* Right Side: Toolbar controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Zoom controls */}
        <div className="flex items-center bg-app-muted-surface border border-app-border rounded-2xl p-1">
          <button
            onClick={() => setZoom((z) => (z === 'quarter' ? 'month' : z === 'month' ? 'week' : 'day'))}
            disabled={zoom === 'day'}
            className="p-1.5 rounded-xl hover:bg-app-surface border border-transparent disabled:opacity-30"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold px-3 text-app-fg capitalize">{zoom} view</span>
          <button
            onClick={() => setZoom((z) => (z === 'day' ? 'week' : z === 'week' ? 'month' : 'quarter'))}
            disabled={zoom === 'quarter'}
            className="p-1.5 rounded-xl hover:bg-app-surface border border-transparent disabled:opacity-30"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* Baseline Toggle Panel */}
        {(baselines.length > 0 || pendingBaselines.length > 0) && (
          <div className="flex items-center bg-app-muted-surface border border-app-border rounded-2xl px-3 py-1.5 transition-colors hover:bg-app-surface">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-app-fg">
              <input
                type="checkbox"
                checked={showBaseline}
                onChange={(e) => setShowBaseline(e.target.checked)}
                className="rounded text-indigo-500 focus:ring-indigo-500/50 cursor-pointer border-app-border bg-app-surface"
              />
              Baseline:
            </label>
            <select
              value={selectedBaselineId}
              onChange={(e) => setSelectedBaselineId(e.target.value)}
              className="bg-transparent border-0 py-0 pl-2 pr-6 text-xs font-bold text-indigo-500 focus:ring-0 cursor-pointer disabled:opacity-50"
              disabled={!showBaseline}
            >
              {baselines.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
              {pendingBaselines.map((pb) => (
                <option key={pb.id} value="" disabled className="text-amber-500">
                  (Pending) {pb.payload?.baseline?.name || 'Unnamed Baseline'}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* More Actions Menu */}
        <GanttToolbarMoreMenu 
          hasEditAccess={hasEditAccess}
          onSaveBaseline={onSaveBaseline}
          onOpenNetworkMap={onOpenNetworkMap}
          onOpenScheduleSheet={onOpenScheduleSheet}
          onExportChart={onExportChart}
        />
      </div>
    </div>
  )
}

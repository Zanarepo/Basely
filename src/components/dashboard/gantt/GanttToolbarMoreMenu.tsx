import { useState, useRef, useEffect } from 'react'
import { MoreHorizontal, Save, Network, Download, Table } from 'lucide-react'

type GanttToolbarMoreMenuProps = {
  hasEditAccess: boolean
  onSaveBaseline: () => void
  onOpenNetworkMap: () => void
  onExportChart: () => void
  onOpenScheduleSheet: () => void
}

export function GanttToolbarMoreMenu({
  hasEditAccess,
  onSaveBaseline,
  onOpenNetworkMap,
  onExportChart,
  onOpenScheduleSheet
}: GanttToolbarMoreMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 border rounded-2xl transition-all duration-200 ${
          isOpen
            ? 'bg-app-surface border-indigo-500/50 text-indigo-500 shadow-sm'
            : 'bg-app-muted-surface border-app-border hover:bg-app-surface text-app-fg'
        }`}
        title="More Actions"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-app-surface border border-app-border rounded-2xl shadow-xl z-50 overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-1.5 flex flex-col gap-0.5">
            {hasEditAccess && (
              <button
                onClick={() => {
                  onSaveBaseline()
                  setIsOpen(false)
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-app-fg hover:bg-app-hover rounded-xl transition-colors text-left"
              >
                <Save className="w-4 h-4 text-emerald-500" />
                <span>Save Baseline</span>
              </button>
            )}
            
            <button
              onClick={() => {
                onOpenScheduleSheet()
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-app-fg hover:bg-app-hover rounded-xl transition-colors text-left"
            >
              <Table className="w-4 h-4 text-indigo-500" />
              <span>Schedule Sheet</span>
            </button>

            <button
              onClick={() => {
                onOpenNetworkMap()
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-app-fg hover:bg-app-hover rounded-xl transition-colors text-left"
            >
              <Network className="w-4 h-4 text-blue-500" />
              <span>Network Map</span>
            </button>

            <div className="h-px w-full bg-app-border/60 my-1" />

            <button
              onClick={() => {
                onExportChart()
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-indigo-100 bg-indigo-500 hover:bg-indigo-600 rounded-xl transition-colors text-left group shadow-sm"
            >
              <Download className="w-4 h-4 text-white" />
              <span className="text-white">Export to PDF/PNG</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

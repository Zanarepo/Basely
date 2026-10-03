import { useState, useEffect, useRef } from 'react'
import { SlidersHorizontal, Check } from 'lucide-react'

type WbsGridColumnMenuProps = {
  hiddenCols: Set<string>
  toggleColumn: (key: string) => void
  showBudgetControls: boolean
}

export function WbsGridColumnMenu({
  hiddenCols,
  toggleColumn,
  showBudgetControls
}: WbsGridColumnMenuProps) {
  const [isColMenuOpen, setIsColMenuOpen] = useState(false)
  const colMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (colMenuRef.current && !colMenuRef.current.contains(event.target as Node)) {
        setIsColMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [setIsColMenuOpen])

  return (
    <div className="flex justify-end mb-3 relative" ref={colMenuRef}>
      <button
        type="button"
        onClick={() => setIsColMenuOpen(!isColMenuOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-app-muted hover:text-app-fg bg-app-surface border border-app-border hover:border-app-border-hover rounded-xl shadow-xs transition-colors cursor-pointer"
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        Customize Columns
      </button>

      {isColMenuOpen && (
        <div className="absolute right-0 top-9 z-50 w-68 bg-app-surface-solid border border-app-border shadow-2xl rounded-2xl overflow-hidden p-2 animate-fade-in">
          <div className="px-3 py-2 flex items-center justify-between border-b border-app-border/60 pb-2 mb-1 shrink-0">
            <span className="text-xs font-black text-app-fg uppercase tracking-wider">
              Customize Columns
            </span>
            <button
              type="button"
              onClick={() => setIsColMenuOpen(false)}
              className="text-xs text-violet-500 font-extrabold hover:underline cursor-pointer px-2.5 py-1 bg-violet-500/10 hover:bg-violet-500/20 rounded-md transition-colors"
            >
              Done
            </button>
          </div>

          <div className="space-y-1 overflow-y-auto max-h-[320px] pr-1 py-1">
            {[
              { key: 'Tag', label: 'Tag (Parent Element)' },
              { key: 'RACI', label: 'RACI Owner' },
              { key: 'Start', label: 'Start Date' },
              { key: 'Finish', label: 'Finish Date' },
              { key: 'ES', label: 'ES (Early Start)' },
              { key: 'EF', label: 'EF (Early Finish)' },
              { key: 'LS', label: 'LS (Late Start)' },
              { key: 'LF', label: 'LF (Late Finish)' },
              { key: 'Duration', label: 'Duration' },
              { key: 'Float', label: 'Float / CPM' },
              ...(showBudgetControls ? [{ key: 'Cost', label: 'Cost Amount' }] : []),
              { key: 'Status', label: 'Status' },
            ].map((col) => {
              const isVisible = !hiddenCols.has(col.key)
              return (
                <button
                  key={col.key}
                  type="button"
                  onClick={() => toggleColumn(col.key)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer hover:bg-app-bg"
                >
                  <span className={`truncate text-left ${isVisible ? 'text-app-fg font-bold' : 'text-app-muted font-normal'}`}>
                    {col.label}
                  </span>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                    isVisible 
                      ? 'bg-violet-600 border-violet-500 text-white shadow-xs' 
                      : 'border-app-border bg-app-surface text-transparent hover:border-violet-500/50'
                  }`}>
                    <Check className="w-3.5 h-3.5" />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

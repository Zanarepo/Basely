import { Loader2 } from 'lucide-react'
import type { WbsElement } from '@/lib/wbs/constants'
import { useWbsGridData } from './workspace/useWbsGridData'

type WbsGridViewProps = {
  projectId: string
  elements: WbsElement[]
  workspaceMembers: { userId: string; name: string; email: string }[]
  onSelect: (id: string) => void
  selectedIds?: string[]
  toggleSelection?: (id: string) => void
  selectAll?: () => void
  clearSelection?: () => void
}

export function WbsGridView({ projectId, elements, workspaceMembers, onSelect, selectedIds = [], toggleSelection, selectAll, clearSelection }: WbsGridViewProps) {
  const { gridData, loading } = useWbsGridData(projectId, elements)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 min-h-[300px]">
        <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
        <span className="ml-2 text-sm text-app-muted">Loading schedule data...</span>
      </div>
    )
  }

  return (
    <div className="p-5 h-[600px] overflow-auto w-full">
      <table className="w-full text-xs border-separate border-spacing-0">
        <thead>
          <tr className="text-left text-app-muted font-medium">
            <th className="px-3 py-2 border-b-2 border-app-border bg-app-muted-surface sticky top-0 first:rounded-tl-lg last:rounded-tr-lg z-10 whitespace-nowrap w-8">
              {selectAll && (
                <input
                  type="checkbox"
                  checked={selectedIds.length === gridData.length && gridData.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      if (selectAll) selectAll()
                    } else {
                      if (clearSelection) clearSelection()
                    }
                  }}
                  className="w-3.5 h-3.5 rounded border-app-border text-indigo-500 focus:ring-indigo-500 bg-app-surface cursor-pointer"
                />
              )}
            </th>
            {['WBS', 'Task Name', 'Tag', 'Owner', 'Start', 'Finish', 'Duration', 'Float', 'Cost', 'Status'].map(h => (
              <th key={h} className="px-3 py-2 border-b-2 border-app-border bg-app-muted-surface sticky top-0 first:rounded-tl-lg last:rounded-tr-lg z-10 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {gridData.map((r) => {
            const owner = workspaceMembers.find((m) => m.userId === r.ownerId)
            const ownerInitials = owner?.name ? owner.name.substring(0, 2).toUpperCase() : null

            // Get the parent element name for the tag
            const parentElement = r.parentId ? elements.find(e => e.id === r.parentId) : null
            const tagText = parentElement ? parentElement.name : 'Work Package'

            return (
              <tr 
                key={r.id} 
                className={`group hover:bg-app-hover cursor-pointer transition-colors ${selectedIds.includes(r.id) ? 'bg-indigo-500/5' : ''}`}
                onClick={() => onSelect(r.id)}
              >
                <td className="px-3 py-2.5 border-b border-app-border w-8" onClick={(e) => e.stopPropagation()}>
                  {toggleSelection && (
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(r.id)}
                      onChange={() => toggleSelection(r.id)}
                      className={`w-3.5 h-3.5 rounded border-app-border text-indigo-500 focus:ring-indigo-500 bg-app-surface cursor-pointer transition-opacity duration-200 ${selectedIds.length > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'}`}
                    />
                  )}
                </td>
                <td className="px-3 py-2.5 border-b border-app-border text-app-subtle font-mono text-[10px] whitespace-nowrap">
                  {r.code}
                </td>
                <td className="px-3 py-2.5 border-b border-app-border text-app-fg font-medium">
                  <span className="truncate">{r.name}</span>
                </td>
                <td className="px-3 py-2.5 border-b border-app-border">
                  <span 
                    className="text-[9px] font-semibold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded truncate max-w-[120px] inline-block"
                    title={tagText}
                  >
                    {tagText}
                  </span>
                </td>
                <td className="px-3 py-2.5 border-b border-app-border">
                  {ownerInitials ? (
                    <div 
                      className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-white text-[8px] flex items-center justify-center font-semibold"
                      title={owner?.name}
                    >
                      {ownerInitials}
                    </div>
                  ) : (
                    <span className="text-app-subtle">—</span>
                  )}
                </td>
                {/* Data from the hook */}
                <td className="px-3 py-2.5 border-b border-app-border text-app-subtle whitespace-nowrap">{r.start}</td>
                <td className="px-3 py-2.5 border-b border-app-border text-app-subtle whitespace-nowrap">{r.finish}</td>
                <td className="px-3 py-2.5 border-b border-app-border text-app-subtle whitespace-nowrap">{r.duration}</td>
                <td className="px-3 py-2.5 border-b border-app-border whitespace-nowrap">
                  {r.float === '—' ? (
                    <span className="text-app-subtle">—</span>
                  ) : (() => {
                    const floatNum = parseFloat(r.float)
                    const colorClass = floatNum === 0
                      ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
                      : floatNum <= 3
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                    return (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>
                        {r.float}
                      </span>
                    )
                  })()}
                </td>
                {/* Render fetched cost data */}
                <td 
                  className="px-3 py-2.5 border-b border-app-border text-app-subtle whitespace-nowrap font-mono text-[11px]"
                  title={r.cost !== null && r.currency ? new Intl.NumberFormat('en-US', { style: 'currency', currency: r.currency }).format(r.cost) : undefined}
                >
                  {r.cost !== null && r.currency 
                    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: r.currency, notation: 'compact', maximumFractionDigits: 2 }).format(r.cost) 
                    : '—'}
                </td>
                <td className="px-3 py-2.5 border-b border-app-border whitespace-nowrap">
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      r.status === 'Complete'
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : r.status === 'In Progress'
                        ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                        : r.status === 'On Hold'
                        ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                        : 'bg-app-muted-surface text-app-muted'
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

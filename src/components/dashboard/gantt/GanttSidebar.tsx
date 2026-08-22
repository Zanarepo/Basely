import { ChevronRight, ChevronDown } from 'lucide-react'
import type { WbsElement } from '@/lib/wbs/constants'

type GanttSidebarProps = {
  visibleElements: WbsElement[]
  wbsCodes: Map<string, string>
  elementLevels: Map<string, number>
  expandedNodeIds: Set<string>
  workspaceMembers: any[]
  onToggleExpand: (id: string, e: React.MouseEvent) => void
  onSelectElement?: (id: string) => void
  scrollRef: React.RefObject<HTMLDivElement | null>
  rowHeight: number
  approvedCRDescriptions?: string[]
}

export function GanttSidebar({
  visibleElements,
  wbsCodes,
  elementLevels,
  expandedNodeIds,
  workspaceMembers,
  onToggleExpand,
  onSelectElement,
  scrollRef,
  rowHeight,
  approvedCRDescriptions = [],
}: GanttSidebarProps) {
  return (
    <div className="w-[340px] border-r border-app-border flex flex-col shrink-0 select-none">
      {/* Header Row */}
      <div className="h-14 bg-app-muted-surface border-b border-app-border flex items-center px-4 shrink-0">
        <span className="text-[11px] font-bold text-app-subtle w-16">WBS Code</span>
        <span className="text-[11px] font-bold text-app-subtle flex-1 pl-3">Element Name</span>
      </div>

      {/* List Scrolling area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-hidden"
        style={{ height: `${visibleElements.length * rowHeight + 24}px` }}
      >
        <div className="py-0">
          {visibleElements.map((el) => {
            const lvl = elementLevels.get(el.id) || 0
            const isSummary = !el.isWorkPackage
            const code = wbsCodes.get(el.id) || ''
            const member = el.ownerId ? workspaceMembers.find((m) => m.id === el.ownerId) : null
            
            // Fuzzy match: check if the CR description contains the first 20 chars of the normalized name
            const normalizedName = el.name.toLowerCase().replace(/\s+/g, ' ').trim()
            const matchQuery = normalizedName.length > 20 ? normalizedName.substring(0, 20) : normalizedName
            const hasCRBadge = approvedCRDescriptions.some((desc) =>
              desc.toLowerCase().replace(/\s+/g, ' ').includes(matchQuery)
            )

            return (
              <div
                key={el.id}
                onClick={() => onSelectElement?.(el.id)}
                className="h-12 flex items-center px-4 border-b border-app-border/40 hover:bg-violet-500/10 dark:hover:bg-violet-500/15 cursor-pointer transition-all group"
              >
                {/* WBS Code Column */}
                <span className="text-xs font-bold text-app-subtle w-16 truncate">
                  {code}
                </span>

                {/* Element Indented Name Column */}
                <div
                  className="flex-1 flex items-center gap-2 overflow-hidden"
                  style={{ paddingLeft: `${lvl * 16}px` }}
                >
                  {/* Collapse/Expand chevron if summary */}
                  {isSummary ? (
                    <button
                      onClick={(e) => onToggleExpand(el.id, e)}
                      className="p-0.5 rounded-lg hover:bg-app-border/50 text-app-subtle shrink-0 transition-colors"
                    >
                      {expandedNodeIds.has(el.id) ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  ) : (
                    // Tiny task activity indicator badge
                    <div className="w-4 h-4 flex items-center justify-center shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500/80" />
                    </div>
                  )}

                  <span className={`text-xs truncate ${isSummary ? 'font-bold' : 'text-app-fg'}`}>
                    {el.name}
                  </span>

                  {/* Approved CR badge */}
                  {hasCRBadge && (
                    <span
                      title="This task has an approved Change Request"
                      className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold tracking-wider uppercase bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30 shrink-0"
                    >
                      CR
                    </span>
                  )}
                </div>

                {/* Assignee initials visual badge */}
                {member && (
                  <div
                    className="w-5 h-5 rounded-full bg-violet-600 border border-violet-700 flex items-center justify-center shrink-0 text-[10px] font-bold text-white shadow-sm"
                    title={`Assigned to: ${member.email}`}
                  >
                    {member.email.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

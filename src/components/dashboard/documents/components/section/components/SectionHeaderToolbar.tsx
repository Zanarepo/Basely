import React from 'react'
import {
  GripVertical,
  ChevronDown,
  ChevronRight,
  Pencil,
  Copy,
  Check,
  CopyPlus,
  ChevronUp,
  Trash2,
  Loader2,
  RefreshCw,
} from 'lucide-react'

interface SectionHeaderToolbarProps {
  sectionKey: string
  currentTitle: string
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  isEditingTitle: boolean
  setIsEditingTitle: (editing: boolean) => void
  editedTitle: string
  setEditedTitle: (title: string) => void
  handleTitleSubmit: () => void
  hasEditAccess: boolean
  isSnapshot: boolean
  isCopied: boolean
  handleCopySection: (e: React.MouseEvent) => void
  onDuplicateSection?: (key: string) => void
  onMoveSectionUp?: (key: string) => void
  onMoveSectionDown?: (key: string) => void
  isFirstSection?: boolean
  isLastSection?: boolean
  onRemoveSection?: (key: string) => void
  isRemoving: boolean
  handleRemoveClick: (e: React.MouseEvent) => void
  hasSource: boolean
  isAutoFilling: boolean
  handleAutoFillClick: (e: React.MouseEvent) => void
}

export function SectionHeaderToolbar({
  sectionKey,
  currentTitle,
  isCollapsed,
  setIsCollapsed,
  isEditingTitle,
  setIsEditingTitle,
  editedTitle,
  setEditedTitle,
  handleTitleSubmit,
  hasEditAccess,
  isSnapshot,
  isCopied,
  handleCopySection,
  onDuplicateSection,
  onMoveSectionUp,
  onMoveSectionDown,
  isFirstSection,
  isLastSection,
  onRemoveSection,
  isRemoving,
  handleRemoveClick,
  hasSource,
  isAutoFilling,
  handleAutoFillClick,
}: SectionHeaderToolbarProps) {
  return (
    <div className="flex items-center justify-between border-b border-app-border/60 pb-2">
      <div className="flex items-center gap-1.5">
        {/* Notion-style 6-Dot Drag Handle Accent */}
        {hasEditAccess && !isSnapshot && (
          <div
            className="p-0.5 text-app-muted opacity-0 group-hover:opacity-100 hover:text-violet-600 transition-opacity cursor-grab shrink-0"
            title="Section handle"
          >
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        {/* Section Accordion Expand / Collapse Toggle */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{ cursor: 'pointer' }}
          className="p-1 rounded-lg hover:bg-app-hover text-app-muted hover:text-violet-600 transition-colors cursor-pointer shrink-0"
          title={isCollapsed ? 'Expand section (▼)' : 'Collapse section (►)'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-app-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-violet-500" />
          )}
        </button>

        {isEditingTitle && hasEditAccess && !isSnapshot ? (
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSubmit()
              if (e.key === 'Escape') {
                setEditedTitle(currentTitle)
                setIsEditingTitle(false)
              }
            }}
            className="text-base font-bold text-app-fg bg-app-bg border border-violet-500 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-sm"
            autoFocus
          />
        ) : (
          <h3
            onClick={() => {
              if (hasEditAccess && !isSnapshot) setIsEditingTitle(true)
            }}
            onDoubleClick={() => {
              if (hasEditAccess && !isSnapshot) setIsEditingTitle(true)
            }}
            className={`text-base font-bold text-app-fg flex items-center gap-2 group/title ${
              hasEditAccess && !isSnapshot
                ? 'cursor-pointer hover:text-violet-600 dark:hover:text-violet-400 transition-colors'
                : ''
            }`}
            title={hasEditAccess && !isSnapshot ? 'Double-click or click to edit section header' : undefined}
          >
            {currentTitle}
            {hasEditAccess && !isSnapshot && (
              <Pencil className="w-3.5 h-3.5 opacity-0 group-hover/title:opacity-100 text-app-muted transition-opacity" />
            )}
          </h3>
        )}

        {isCollapsed && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-app-muted bg-app-muted-surface px-2 py-0.5 rounded-full border border-app-border">
            Collapsed
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Copy Section Markdown Button */}
        <button
          type="button"
          onClick={handleCopySection}
          style={{ cursor: 'pointer' }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-app-surface text-app-muted hover:text-violet-600 border border-app-border hover:border-violet-500/40 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer shadow-2xs"
          title="Copy section header & contents in Markdown format"
        >
          {isCopied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Section</span>
            </>
          )}
        </button>

        {/* Duplicate Section Button */}
        {hasEditAccess && !isSnapshot && onDuplicateSection && (
          <button
            type="button"
            onClick={() => onDuplicateSection(sectionKey)}
            style={{ cursor: 'pointer' }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-app-surface text-app-muted hover:text-violet-600 border border-app-border hover:border-violet-500/40 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer shadow-2xs"
            title="Duplicate this section and its contents directly below"
          >
            <CopyPlus className="w-3.5 h-3.5 text-violet-500" />
            <span>Duplicate</span>
          </button>
        )}

        {/* Quick Up/Down Section Reordering Controls */}
        {hasEditAccess && !isSnapshot && (onMoveSectionUp || onMoveSectionDown) && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-app-surface border border-app-border rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              disabled={isFirstSection}
              onClick={() => onMoveSectionUp?.(sectionKey)}
              style={{ cursor: isFirstSection ? 'not-allowed' : 'pointer' }}
              className="p-1 rounded text-app-muted hover:text-violet-600 hover:bg-violet-500/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-app-muted transition-colors cursor-pointer"
              title="Move section up (↑)"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={isLastSection}
              onClick={() => onMoveSectionDown?.(sectionKey)}
              style={{ cursor: isLastSection ? 'not-allowed' : 'pointer' }}
              className="p-1 rounded text-app-muted hover:text-violet-600 hover:bg-violet-500/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-app-muted transition-colors cursor-pointer"
              title="Move section down (↓)"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Delete Section Button */}
        {hasEditAccess && !isSnapshot && onRemoveSection && (
          <button
            type="button"
            disabled={isRemoving}
            onClick={handleRemoveClick}
            style={{ cursor: 'pointer' }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-opacity duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer disabled:opacity-50"
            title="Delete this section"
          >
            {isRemoving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 text-rose-500 animate-spin" /> Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Delete Section
              </>
            )}
          </button>
        )}

        {/* Auto-fill Button */}
        {hasSource && hasEditAccess && !isSnapshot && (
          <button
            type="button"
            disabled={isAutoFilling}
            onClick={handleAutoFillClick}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50 shrink-0 shadow-2xs"
            style={{ cursor: 'pointer' }}
            title="Auto-fill content using live project data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-violet-500 ${isAutoFilling ? 'animate-spin' : ''}`} />
            {isAutoFilling ? 'Auto-filling...' : 'Auto-fill from Project Data'}
          </button>
        )}
      </div>
    </div>
  )
}

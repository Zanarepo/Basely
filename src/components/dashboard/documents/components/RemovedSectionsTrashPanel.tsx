import React from 'react'
import { RotateCcw, Trash2 } from 'lucide-react'
import { RemovedSectionItem } from '../hooks/useDocumentSections'

interface RemovedSectionsTrashPanelProps {
  allRemovedSections: RemovedSectionItem[]
  sectionTitleOverrides: Record<string, string>
  handleRestoreSection: (key: string) => void
  handlePermanentDeleteSection: (key: string) => void
  handleClearAllRemovedSections: () => void
  hasEditAccess: boolean
  isSnapshot?: boolean
}

export default function RemovedSectionsTrashPanel({
  allRemovedSections,
  sectionTitleOverrides,
  handleRestoreSection,
  handlePermanentDeleteSection,
  handleClearAllRemovedSections,
  hasEditAccess,
  isSnapshot = false,
}: RemovedSectionsTrashPanelProps) {
  if (!hasEditAccess || isSnapshot || allRemovedSections.length === 0) return null

  return (
    <div className="mt-6 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
          <RotateCcw className="w-3.5 h-3.5" />
          Removed Sections ({allRemovedSections.length})
        </div>
        <button
          type="button"
          onClick={handleClearAllRemovedSections}
          style={{ cursor: 'pointer' }}
          className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
          title="Permanently clear all removed sections now"
        >
          <Trash2 className="w-3 h-3" /> Clear Trash
        </button>
      </div>

      <p className="text-xs text-app-muted">
        ⏱️ Removed sections are kept in trash for <strong>24 hours</strong> before being automatically purged. Click to restore or permanently remove:
      </p>

      <div className="flex flex-wrap gap-2 pt-1">
        {allRemovedSections.map((sec) => (
          <div
            key={sec.key}
            className="inline-flex items-center rounded-lg bg-app-surface border border-app-border text-app-fg shadow-2xs overflow-hidden"
          >
            <button
              type="button"
              onClick={() => handleRestoreSection(sec.key)}
              style={{ cursor: 'pointer' }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 transition-colors cursor-pointer"
              title="Restore section to document"
            >
              <span>+ Restore {(sectionTitleOverrides && sectionTitleOverrides[sec.key]) || sec.title}</span>
            </button>
            <div className="w-px h-7 bg-app-border" />
            <button
              type="button"
              onClick={() => handlePermanentDeleteSection(sec.key)}
              style={{ cursor: 'pointer' }}
              className="px-2.5 py-1.5 text-app-muted hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Permanently delete this section now"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

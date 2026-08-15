import React from 'react'
import { Tag, Plus, X } from 'lucide-react'

interface PropertyTagsPopoverProps {
  tags: string[]
  hasEditAccess: boolean
  isOpen: boolean
  onToggle: () => void
  newTagInput: string
  setNewTagInput: (val: string) => void
  onAddTag: (tag: string) => void
  onRemoveTag: (tag: string) => void
}

export function PropertyTagsPopover({
  tags,
  hasEditAccess,
  isOpen,
  onToggle,
  newTagInput,
  setNewTagInput,
  onAddTag,
  onRemoveTag,
}: PropertyTagsPopoverProps) {
  return (
    <div className="relative flex items-center justify-between p-2 rounded-xl bg-app-surface border border-app-border col-span-1 md:col-span-2">
      <div className="flex items-center gap-1.5 text-app-muted">
        <Tag className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
        <span className="font-semibold text-app-fg text-xs">Domain Tags:</span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {tags.map((tg) => (
          <span
            key={tg}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20"
          >
            <span>{tg}</span>
            {hasEditAccess && (
              <button
                type="button"
                style={{ cursor: 'pointer' }}
                onClick={() => onRemoveTag(tg)}
                className="hover:text-rose-500 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}

        {hasEditAccess && (
          <button
            type="button"
            style={{ cursor: 'pointer' }}
            onClick={onToggle}
            className="p-1 rounded-lg hover:bg-app-hover text-app-muted hover:text-app-fg transition-colors cursor-pointer"
            title="Add domain tag"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-52 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 space-y-1.5 ring-1 ring-black/5 animate-in fade-in zoom-in-95">
          <span className="text-[10px] font-bold text-app-muted uppercase tracking-wider block px-1">
            Add Domain Tag
          </span>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTagInput.trim()) {
                  onAddTag(newTagInput.trim())
                  setNewTagInput('')
                }
              }}
              placeholder="e.g. Core, Auth..."
              className="w-full px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-violet-500"
            />
            <button
              type="button"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                if (newTagInput.trim()) {
                  onAddTag(newTagInput.trim())
                  setNewTagInput('')
                }
              }}
              className="p-1.5 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 transition-colors cursor-pointer shrink-0"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

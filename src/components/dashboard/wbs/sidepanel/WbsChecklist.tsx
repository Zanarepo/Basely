'use client'

import { Plus, Check, Trash2 } from 'lucide-react'
import type { ChecklistItem } from '@/lib/wbs/constants'

type WbsChecklistProps = {
  title: string
  icon: React.ReactNode
  items: ChecklistItem[]
  setItems: React.Dispatch<React.SetStateAction<ChecklistItem[]>>
  hasEditAccess: boolean
  canCheckItems?: boolean
  saving: boolean
  placeholder?: string
  onAutoSave?: (newItems: ChecklistItem[]) => void
}

export function WbsChecklist({
  title,
  icon,
  items,
  setItems,
  hasEditAccess,
  canCheckItems,
  saving,
  placeholder = "Add an item...",
  onAutoSave
}: WbsChecklistProps) {
  const isCheckboxEnabled = (!saving) && (canCheckItems ?? hasEditAccess)

  const completedCount = items.filter((d) => d.completed).length
  const totalCount = items.length
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="auth-label flex items-center gap-1.5 mb-0">
          {icon}
          {title}
        </label>
        {totalCount > 0 && (
          <span className="text-[10px] font-semibold text-app-subtle bg-app-surface border border-app-border px-1.5 py-0.5 rounded">
            {completedCount}/{totalCount} ({percentage}%)
          </span>
        )}
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={item.id} className="flex items-start gap-2 group">
            <button
              type="button"
              disabled={!isCheckboxEnabled}
              onClick={() => {
                const updated = [...items]
                updated[index].completed = !updated[index].completed
                setItems(updated)
                onAutoSave?.(updated)
              }}
              className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                isCheckboxEnabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
              } ${
                item.completed
                  ? 'bg-indigo-500 border-indigo-500 text-white'
                  : 'border-app-border hover:border-indigo-400'
              }`}
            >
              {item.completed && <Check className="w-3 h-3" />}
            </button>

            <input
              type="text"
              disabled={!hasEditAccess || saving}
              value={item.text}
              onChange={(e) => {
                const updated = [...items]
                updated[index].text = e.target.value
                setItems(updated)
              }}
              onBlur={() => {
                onAutoSave?.(items)
              }}
              placeholder={placeholder}
              className={`flex-1 bg-transparent border-b border-transparent hover:border-app-border focus:border-indigo-500 focus:outline-none text-sm transition-colors ${
                item.completed ? 'text-app-muted line-through' : 'text-app-fg'
              } disabled:opacity-50`}
            />

            {hasEditAccess && !saving && (
              <button
                type="button"
                onClick={() => {
                  const updated = [...items]
                  updated.splice(index, 1)
                  setItems(updated)
                  onAutoSave?.(updated)
                }}
                className="p-1 text-app-subtle hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}

        {hasEditAccess && !saving && (
          <button
            type="button"
            onClick={() => {
              const updated = [
                ...items,
                { id: crypto.randomUUID(), text: '', completed: false },
              ]
              setItems(updated)
              onAutoSave?.(updated)
            }}
            className="flex items-center gap-1 text-xs font-medium text-indigo-500 hover:text-indigo-600 transition-colors mt-2 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            Add Item
          </button>
        )}
      </div>
    </div>
  )
}


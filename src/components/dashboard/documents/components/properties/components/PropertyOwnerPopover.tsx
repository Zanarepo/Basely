import React from 'react'
import { User, Check } from 'lucide-react'

export interface PropertyMember {
  id?: string
  userId?: string
  name: string
  avatar_url?: string
}

interface PropertyOwnerPopoverProps {
  ownerName: string
  members: PropertyMember[]
  hasEditAccess: boolean
  isOpen: boolean
  onToggle: () => void
  onSelectOwner: (id: string, name: string) => void
}

export function PropertyOwnerPopover({
  ownerName,
  members,
  hasEditAccess,
  isOpen,
  onToggle,
  onSelectOwner,
}: PropertyOwnerPopoverProps) {
  return (
    <div className="relative flex items-center justify-between p-2 rounded-xl bg-app-surface border border-app-border">
      <div className="flex items-center gap-1.5 text-app-muted">
        <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
        <span className="font-semibold text-app-fg text-xs">Owner:</span>
      </div>

      <button
        type="button"
        style={{ cursor: 'pointer' }}
        disabled={!hasEditAccess}
        onClick={onToggle}
        className="px-2 py-0.5 rounded-lg text-xs font-semibold hover:bg-app-hover text-app-fg transition-colors cursor-pointer border border-transparent hover:border-app-border"
      >
        {ownerName || 'Unassigned'}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-52 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 space-y-1 ring-1 ring-black/5 animate-in fade-in zoom-in-95 max-h-56 overflow-y-auto">
          {members.map((mem, idx) => {
            const memberId = mem.userId || mem.id || `mem_${idx}`
            return (
              <button
                key={memberId}
                type="button"
                style={{ cursor: 'pointer' }}
                onClick={() => onSelectOwner(memberId, mem.name)}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
              >
                <span>{mem.name}</span>
                {ownerName === mem.name && <Check className="w-3.5 h-3.5 text-violet-500" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

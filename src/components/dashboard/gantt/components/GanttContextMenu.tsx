'use client'

import { useEffect, useRef } from 'react'
import { FileEdit } from 'lucide-react'

interface GanttContextMenuProps {
  x: number
  y: number
  taskName: string
  onInitiateCR: () => void
  onClose: () => void
}

export function GanttContextMenu({ x, y, taskName, onInitiateCR, onClose }: GanttContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', escHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', escHandler)
    }
  }, [onClose])

  return (
    <div
      ref={menuRef}
      className="fixed z-[200] min-w-[200px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl p-1 animate-in fade-in zoom-in-95 duration-100"
      style={{ top: y, left: x }}
    >
      <div className="px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 truncate max-w-[180px]">
        {taskName}
      </div>
      <div className="border-t border-slate-100 dark:border-slate-800 my-0.5" />
      <button
        onClick={() => {
          onInitiateCR()
          onClose()
        }}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-violet-50 dark:hover:bg-violet-500/10 hover:text-violet-700 dark:hover:text-violet-300 transition-colors cursor-pointer text-left"
      >
        <FileEdit className="w-4 h-4 text-violet-500 shrink-0" />
        Initiate Change Request
      </button>
    </div>
  )
}

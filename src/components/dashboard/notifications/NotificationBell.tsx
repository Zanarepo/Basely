'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { NotificationCenter } from './NotificationCenter'
import { useNotifications } from './useNotifications'

type NotificationBellProps = {
  collapsed?: boolean
}

export function NotificationBell({ collapsed }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { unreadCount } = useNotifications()

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
        className={`w-full flex items-center gap-3 rounded-xl text-app-muted hover:text-violet-500 dark:hover:text-violet-300 hover:bg-violet-500/10 border border-transparent hover:border-violet-500/20 transition-all cursor-pointer relative ${
          collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
        }`}
      >
        <div className="relative">
          <Bell className="h-5 w-5 shrink-0" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-violet-500 text-[9px] font-bold text-white ring-2 ring-app-surface-solid">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        {!collapsed && (
          <div className="flex flex-1 items-center justify-between">
            <span className="text-sm font-medium">Notifications</span>
            {unreadCount > 0 && (
              <span className="bg-violet-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
        )}
      </button>

      <NotificationCenter isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  )
}

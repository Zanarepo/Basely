'use client'

import React from 'react'
import { Users, MousePointer2 } from 'lucide-react'
import type { LiveUser } from './useLivePresence'

type ActivityPanelProps = {
  activeUsers: LiveUser[]
  showCursors: boolean
  toggleCursors: () => void
}

export function ActivityPanel({ activeUsers, showCursors, toggleCursors }: ActivityPanelProps) {
  // Show max 4 avatars, then +X
  const maxDisplay = 4
  const displayUsers = activeUsers.slice(0, maxDisplay)
  const remaining = activeUsers.length - maxDisplay

  return (
    <div className="flex items-center bg-app-surface border border-app-border rounded-full px-2 py-1 shadow-sm group cursor-default transition-all duration-300">
      
      {/* Avatars */}
      <div className="flex items-center px-2">
        {activeUsers.length === 0 ? (
          <div className="flex items-center gap-2 text-app-muted text-sm px-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Just you</span>
          </div>
        ) : (
          <div className="flex items-center -space-x-2">
            {displayUsers.map((user) => (
              <div
                key={user.userId}
                className="w-8 h-8 rounded-full border-2 border-app-surface flex items-center justify-center text-white text-xs font-bold shadow-sm relative group cursor-pointer transition-transform hover:z-10 hover:scale-110"
                style={{ backgroundColor: user.color }}
                title={user.name}
              >
                {user.name.charAt(0).toUpperCase()}
                
                {/* Tooltip */}
                <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-app-fg text-app-surface text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {user.name}
                </div>
              </div>
            ))}
            {remaining > 0 && (
              <div className="w-8 h-8 rounded-full border-2 border-app-surface bg-app-border flex items-center justify-center text-app-fg text-xs font-bold shadow-sm relative z-0">
                +{remaining}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expandable Settings Section */}
      <div className="flex items-center overflow-hidden max-w-0 opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 transition-all duration-300 ease-in-out">
        <div className="w-px h-6 bg-app-border mx-3 hidden sm:block"></div>

        {/* Cursor Toggle Switch */}
        <button
          onClick={toggleCursors}
          className="flex items-center gap-2 pr-2 focus:outline-none"
          title={showCursors ? 'Hide live cursors' : 'Show live cursors'}
        >
          <span className={`text-xs font-medium hidden sm:block transition-colors whitespace-nowrap ${showCursors ? 'text-app-fg' : 'text-app-muted'}`}>
            Live Cursors
          </span>
          <div 
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
              showCursors ? 'bg-indigo-500' : 'bg-app-border'
            }`}
          >
            <span 
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                showCursors ? 'translate-x-5' : 'translate-x-1'
              }`} 
            />
          </div>
        </button>
      </div>

    </div>
  )
}

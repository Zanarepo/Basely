'use client'

import React from 'react'
import type { LiveUser } from './useLivePresence'

type LiveCursorsOverlayProps = {
  activeUsers: LiveUser[]
  showCursors: boolean
}

export function LiveCursorsOverlay({ activeUsers, showCursors }: LiveCursorsOverlayProps) {
  if (!showCursors || activeUsers.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {activeUsers.map((user) => {
        // If coordinate hasn't been set yet, hide the cursor
        if (user.x < 0 && user.y < 0) return null

        return (
          <div
            key={user.userId}
            className="absolute top-0 left-0 flex flex-col items-start transition-transform duration-100 ease-linear pointer-events-none will-change-transform"
            style={{
              transform: `translate(${user.x}px, ${user.y}px)`,
            }}
          >
            {/* Custom Mouse Pointer SVG */}
            <svg
              width="24"
              height="36"
              viewBox="0 0 24 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-md"
            >
              <path
                d="M5.65376 2.0001L21.5794 17.9257C22.6105 18.9568 21.8797 20.7198 20.4215 20.7198H13.6826L9.61093 30.5694C9.13845 31.7118 7.50293 31.6394 7.13526 30.4503L2.09117 14.1378C1.48834 12.188 2.01633 10.0211 3.51357 8.52382L5.65376 6.38363C6.70327 5.33413 8.39704 5.31174 9.47355 6.33406Z"
                fill={user.color}
                stroke="white"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
            
            {/* Name Tag */}
            <div
              className="ml-4 -mt-1 px-2 py-1 rounded-md text-white text-[11px] font-bold whitespace-nowrap shadow-sm max-w-[120px] truncate"
              style={{ backgroundColor: user.color }}
            >
              {user.name}
            </div>
          </div>
        )
      })}
    </div>
  )
}

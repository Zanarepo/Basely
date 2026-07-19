'use client'

import React from 'react'
import { useLivePresence } from '../wbs/workspace/useLivePresence'
import { ActivityPanel } from '../wbs/workspace/ActivityPanel'
import { LiveCursorsOverlay } from '../wbs/workspace/LiveCursorsOverlay'

type LivePresenceWrapperProps = {
  projectId: string
  activeTab: string
  callerUserId: string
  callerUserName: string
}

export function LivePresenceWrapper({ projectId, activeTab, callerUserId, callerUserName }: LivePresenceWrapperProps) {
  const { activeUsers, showCursors, toggleCursors } = useLivePresence(
    `${projectId}:${activeTab}`,
    callerUserId,
    callerUserName
  )

  return (
    <>
      <LiveCursorsOverlay activeUsers={activeUsers} showCursors={showCursors} />
      <div className="absolute top-0 right-0 z-50">
        <ActivityPanel 
          activeUsers={activeUsers} 
          showCursors={showCursors} 
          toggleCursors={toggleCursors} 
        />
      </div>
    </>
  )
}

'use client'

import { createContext, useContext } from 'react'

export type Workspace = {
  id: string
  name: string
  role: string
}

type WorkspaceContextValue = {
  workspaces: Workspace[]
  activeWorkspace: Workspace
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({
  workspaces,
  activeWorkspace,
  children,
}: WorkspaceContextValue & { children: React.ReactNode }) {
  return (
    <WorkspaceContext.Provider value={{ workspaces, activeWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) {
    throw new Error('useWorkspace must be used within WorkspaceProvider')
  }
  return ctx
}

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, ChevronDown, Check } from 'lucide-react'
import { useWorkspace, type Workspace } from './WorkspaceContext'
import { setActiveWorkspace } from '@/lib/workspace/actions'

type WorkspaceSwitcherProps = {
  collapsed: boolean
}

const dropdownPanel =
  'py-1.5 rounded-xl bg-app-surface-solid border border-app-border shadow-xl shadow-black/10 dark:shadow-black/40 overflow-hidden'
const dropdownItem =
  'w-full flex items-center gap-3 px-3 py-2.5 hover:bg-app-hover transition-colors cursor-pointer text-left'
const switcherButton =
  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-app-muted-surface border border-app-border hover:border-indigo-500/40 hover:bg-app-hover transition-all cursor-pointer disabled:opacity-60'

export function WorkspaceSwitcher({ collapsed }: WorkspaceSwitcherProps) {
  const router = useRouter()
  const { workspaces, activeWorkspace } = useWorkspace()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSelect = (workspace: Workspace) => {
    if (workspace.id === activeWorkspace.id) {
      setOpen(false)
      return
    }
    startTransition(async () => {
      await setActiveWorkspace(workspace.id)
      setOpen(false)
      router.refresh()
    })
  }

  const dropdownList = workspaces.map((workspace) => (
    <button
      key={workspace.id}
      type="button"
      onClick={() => handleSelect(workspace)}
      className={dropdownItem}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-app-fg truncate">
          {workspace.name}
        </p>
        <p className="text-xs text-app-subtle">{workspace.role}</p>
      </div>
      {workspace.id === activeWorkspace.id && (
        <Check className="h-4 w-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
      )}
    </button>
  ))

  if (collapsed) {
    return (
      <div className="relative">
        <button
          type="button"
          title={activeWorkspace.name}
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-center p-2.5 rounded-xl bg-app-muted-surface border border-app-border hover:border-indigo-500/40 hover:bg-app-hover transition-all cursor-pointer"
        >
          <Building2 className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className={`absolute left-full top-0 ml-3 z-50 w-56 ${dropdownPanel}`}>
              {dropdownList}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className={switcherButton}
      >
        <div className="shrink-0 p-1.5 rounded-lg bg-indigo-500/20">
          <Building2 className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs text-app-subtle font-medium uppercase tracking-wider">
            Workspace
          </p>
          <p className="text-sm font-semibold text-app-fg truncate">
            {activeWorkspace.name}
          </p>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-app-subtle shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={`absolute left-0 right-0 top-full mt-2 z-50 ${dropdownPanel}`}>
            {dropdownList}
          </div>
        </>
      )}
    </div>
  )
}

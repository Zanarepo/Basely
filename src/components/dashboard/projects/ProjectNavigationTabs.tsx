"use client"

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { Settings2, MoreHorizontal, Check } from 'lucide-react'

type TabKey = 'dashboard' | 'wbs' | 'gantt' | 'raid' | 'adr' | 'capacity' | 'releases' | 'cost' | 'stakeholders' | 'risks' | 'documents' | 'action_items' | 'team'

interface TabInfo {
  id: TabKey
  label: string
  shortLabel: string
  isNew?: boolean
}

const ALL_TABS: TabInfo[] = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Dashboard' },
  { id: 'wbs', label: 'Work Breakdown Structure (WBS)', shortLabel: 'WBS' },
  { id: 'gantt', label: 'Gantt & Scheduling', shortLabel: 'Gantt' },
  { id: 'raid', label: 'RAID Command Center', shortLabel: 'RAID Log', isNew: true },
  { id: 'adr', label: 'Architecture Decisions (ADR)', shortLabel: 'ADRs', isNew: true },
  { id: 'capacity', label: 'Skills & Capacity Matrix', shortLabel: 'Capacity', isNew: true },
  { id: 'releases', label: 'Releases & Iterations', shortLabel: 'Releases' },
  { id: 'cost', label: 'Budget & Cost', shortLabel: 'Cost' },
  { id: 'stakeholders', label: 'Stakeholders', shortLabel: 'People' },
  { id: 'risks', label: 'Risks & Issues', shortLabel: 'Risks' },
  { id: 'documents', label: 'Documents', shortLabel: 'Docs' },
  { id: 'action_items', label: 'Action Items', shortLabel: 'Actions' },
  { id: 'team', label: 'Team & Access', shortLabel: 'Team' },
]

const DEFAULT_VISIBLE: TabKey[] = ['dashboard', 'wbs', 'gantt', 'releases', 'team']
const FREE_TABS: TabKey[] = ['dashboard', 'wbs', 'gantt', 'team']

interface Props {
  projectId: string
  activeTab: string
  canViewCost: boolean
  canViewTeamAccess?: boolean
  tier?: string
}

export default function ProjectNavigationTabs({ projectId, activeTab, canViewCost, canViewTeamAccess = false, tier }: Props) {
  const [mounted, setMounted] = useState(false)
  const [visibleTabs, setVisibleTabs] = useState<TabKey[]>(DEFAULT_VISIBLE)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isCustomizeMode, setIsCustomizeMode] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filter tabs based on permissions
  const availableTabs = useMemo(() => 
    ALL_TABS.filter(t => {
      if (t.id === 'cost' && !canViewCost) return false
      if (t.id === 'team' && !canViewTeamAccess) return false
      return true
    }), 
  [canViewCost, canViewTeamAccess])

  // Load preferences from local storage on mount
  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(`basepro_project_tabs_${projectId}`)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as TabKey[]
        const validTabs = parsed.filter(t => availableTabs.some(at => at.id === t))
        if (validTabs.length > 0) {
          setVisibleTabs(prev => {
            if (JSON.stringify(prev) === JSON.stringify(validTabs)) return prev
            return validTabs
          })
        }
      } catch (e) {
        // ignore JSON parse errors
      }
    }
  }, [projectId, availableTabs])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
        setIsCustomizeMode(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const toggleTab = (tabId: TabKey) => {
    setVisibleTabs(prev => {
      let newTabs: TabKey[]
      if (prev.includes(tabId)) {
        if (prev.length === 1 || tabId === activeTab) return prev
        newTabs = prev.filter(id => id !== tabId)
      } else {
        newTabs = [...prev, tabId]
      }
      localStorage.setItem(`basepro_project_tabs_${projectId}`, JSON.stringify(newTabs))
      return newTabs
    })
  }

  const finalVisibleTabs = visibleTabs.includes(activeTab as TabKey) 
    ? visibleTabs 
    : [...visibleTabs, activeTab as TabKey]

  const pinnedTabs = availableTabs.filter(t => finalVisibleTabs.includes(t.id))
  const unpinnedTabs = availableTabs.filter(t => !finalVisibleTabs.includes(t.id))

  if (!mounted) {
    return (
      <div className="border-b border-app-border mb-6">
        <nav className="flex gap-4 sm:gap-6 min-w-max pb-1">
          {availableTabs.slice(0, 3).map((tab) => (
            <div key={tab.id} className="pb-3 text-sm font-bold text-app-muted border-b-2 border-transparent">
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </div>
          ))}
        </nav>
      </div>
    )
  }

  return (
    <div className="border-b border-app-border mb-6 overflow-visible relative">
      <nav className="flex items-center gap-4 md:gap-6 pb-1 flex-wrap md:flex-nowrap">
        
        {/* Pinned Tabs */}
        {pinnedTabs.map((tab) => {
          const isGated = tier === 'free' && !FREE_TABS.includes(tab.id)
          return (
            <Link
              key={tab.id}
              href={`/dashboard/projects/${projectId}?tab=${tab.id}`}
              className={`pb-3 text-sm transition-all border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-500 font-bold'
                  : 'border-transparent text-app-muted hover:text-app-fg font-semibold'
              }`}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
              {isGated ? (
                <span className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-500 dark:text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded text-[10px] uppercase font-black tracking-wider shrink-0 shadow-xs">
                  ✨ PRO
                </span>
              ) : tab.isNew ? (
                <span className="bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded text-[10px] uppercase font-black tracking-wider">
                  New
                </span>
              ) : null}
            </Link>
          )
        })}

        {/* More Menu */}
        <div className="relative pb-3 ml-auto sm:ml-0" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 text-sm font-medium text-app-muted hover:text-app-fg transition-colors p-1.5 sm:p-1 rounded-md cursor-pointer bg-app-surface sm:bg-transparent border sm:border-transparent border-app-border"
            title="More Tabs"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-1 w-68 bg-app-surface-solid border border-app-border shadow-2xl rounded-xl z-50 overflow-hidden">
              
              {!isCustomizeMode ? (
                <div className="p-2 flex flex-col max-h-[400px]">
                  {unpinnedTabs.length > 0 ? (
                    <div className="flex-1 overflow-y-auto max-h-[280px] pr-1 space-y-1 mb-2">
                      <div className="px-3 py-1.5 text-[11px] font-extrabold text-app-subtle uppercase tracking-wider sticky top-0 bg-app-surface-solid z-10">
                        More Tabs ({unpinnedTabs.length})
                      </div>
                      {unpinnedTabs.map(tab => {
                        const isGated = tier === 'free' && !FREE_TABS.includes(tab.id)
                        return (
                          <Link
                            key={tab.id}
                            href={`/dashboard/projects/${projectId}?tab=${tab.id}`}
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center justify-between gap-2 px-3 py-2 text-sm font-semibold text-app-fg hover:bg-app-bg hover:text-indigo-400 rounded-lg transition-all group"
                          >
                            <span className="truncate">{tab.label}</span>
                            {isGated ? (
                              <span className="bg-amber-500/15 text-amber-500 border border-amber-500/25 px-1.5 py-0.5 rounded text-[10px] uppercase font-black tracking-wider shrink-0">
                                ✨ PRO
                              </span>
                            ) : tab.isNew ? (
                              <span className="bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 px-1.5 py-0.5 rounded text-[10px] uppercase font-black tracking-wider shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                New
                              </span>
                            ) : null}
                          </Link>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="px-3 py-4 text-sm font-medium text-app-muted text-center">
                      All available tabs are pinned to toolbar.
                    </div>
                  )}
                  
                  <div className="h-px bg-app-border my-1 -mx-2 shrink-0" />
                  
                  <button
                    onClick={() => setIsCustomizeMode(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-bold text-indigo-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer shrink-0 mt-1"
                  >
                    <Settings2 className="w-4 h-4" />
                    Customize Toolbar
                  </button>
                </div>
              ) : (
                <div className="p-2 flex flex-col max-h-[420px]">
                  <div className="px-3 py-2 flex items-center justify-between mb-1 border-b border-app-border/60 pb-2 shrink-0">
                    <span className="text-xs font-black text-app-fg uppercase tracking-wider">
                      Customize Toolbar
                    </span>
                    <button 
                      onClick={() => setIsCustomizeMode(false)}
                      className="text-xs text-indigo-400 font-extrabold hover:underline cursor-pointer px-2 py-0.5 bg-indigo-500/10 rounded-md"
                    >
                      Done
                    </button>
                  </div>
                  
                  <div className="space-y-1 overflow-y-auto max-h-[320px] pr-1 py-1">
                    {availableTabs.map(tab => {
                      const isVisible = finalVisibleTabs.includes(tab.id)
                      const isRequired = tab.id === activeTab
                      return (
                        <button
                          key={tab.id}
                          disabled={isRequired}
                          onClick={() => toggleTab(tab.id)}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                            isRequired ? 'opacity-50 cursor-not-allowed bg-app-input/40' : 'hover:bg-app-bg'
                          }`}
                          title={isRequired ? 'Current active tab cannot be hidden' : 'Click to pin/unpin from toolbar'}
                        >
                          <span className={`truncate text-left ${isVisible ? 'text-app-fg font-bold' : 'text-app-muted font-normal'}`}>
                            {tab.label}
                          </span>
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                            isVisible 
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-xs' 
                              : 'border-app-border bg-app-surface text-transparent hover:border-indigo-500/50'
                          }`}>
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </nav>
    </div>
  )
}

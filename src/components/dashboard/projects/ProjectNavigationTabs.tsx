"use client"

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { Settings2, MoreHorizontal, Check } from 'lucide-react'

type TabKey = 'dashboard' | 'wbs' | 'gantt' | 'cost' | 'stakeholders' | 'risks' | 'documents' | 'team'

interface TabInfo {
  id: TabKey
  label: string
  isNew?: boolean
}

const ALL_TABS: TabInfo[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'wbs', label: 'Work Breakdown Structure (WBS)' },
  { id: 'gantt', label: 'Gantt & Scheduling' },
  { id: 'cost', label: 'Budget & Cost' },
  { id: 'stakeholders', label: 'Stakeholders' },
  { id: 'risks', label: 'Risks & Issues' },
  { id: 'documents', label: 'Documents' },
  { id: 'team', label: 'Team & Access', isNew: true },
]

const DEFAULT_VISIBLE: TabKey[] = ['dashboard', 'wbs', 'gantt', 'team']

interface Props {
  projectId: string
  activeTab: string
  canViewCost: boolean
  canViewTeamAccess?: boolean
}

export default function ProjectNavigationTabs({ projectId, activeTab, canViewCost, canViewTeamAccess = false }: Props) {
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
        // Ensure only valid tabs are loaded
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
        // Don't allow hiding the active tab or the very last tab
        if (prev.length === 1 || tabId === activeTab) return prev
        newTabs = prev.filter(id => id !== tabId)
      } else {
        newTabs = [...prev, tabId]
      }
      localStorage.setItem(`basepro_project_tabs_${projectId}`, JSON.stringify(newTabs))
      return newTabs
    })
  }

  // Ensure active tab is ALWAYS visible, regardless of preferences
  const finalVisibleTabs = visibleTabs.includes(activeTab as TabKey) 
    ? visibleTabs 
    : [...visibleTabs, activeTab as TabKey]

  const pinnedTabs = availableTabs.filter(t => finalVisibleTabs.includes(t.id))
  const unpinnedTabs = availableTabs.filter(t => !finalVisibleTabs.includes(t.id))

  // Don't render complex UI during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="border-b border-app-border mb-6">
        <nav className="flex space-x-6 min-w-max pb-1">
          {availableTabs.slice(0, 3).map((tab) => (
            <div key={tab.id} className="pb-3 text-sm font-bold text-app-muted border-b-2 border-transparent">
              {tab.label}
            </div>
          ))}
        </nav>
      </div>
    )
  }

  return (
    <div className="border-b border-app-border mb-6 overflow-visible relative">
      <nav className="flex items-center space-x-6 pb-1 flex-wrap md:flex-nowrap">
        
        {/* Pinned Tabs */}
        {pinnedTabs.map((tab) => (
          <Link
            key={tab.id}
            href={`/dashboard/projects/${projectId}?tab=${tab.id}`}
            className={`pb-3 text-sm transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-500 font-bold'
                : 'border-transparent text-app-muted hover:text-app-fg font-semibold'
            }`}
          >
            {tab.label}
            {tab.isNew && (
              <span className="bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded text-[10px] uppercase font-black tracking-wider">
                New
              </span>
            )}
          </Link>
        ))}

        {/* More Menu */}
        <div className="relative pb-3" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 text-sm font-medium text-app-muted hover:text-app-fg transition-colors p-1 rounded-md cursor-pointer"
            title="More Tabs"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 md:left-auto md:right-0 mt-1 w-64 bg-app-surface-solid border border-app-border shadow-xl rounded-xl z-50 overflow-hidden">
              
              {!isCustomizeMode ? (
                <div className="p-2">
                  {unpinnedTabs.length > 0 ? (
                    <div className="space-y-1 mb-2">
                      <div className="px-3 py-1.5 text-xs font-semibold text-app-muted uppercase tracking-wider">
                        More Tabs
                      </div>
                      {unpinnedTabs.map(tab => (
                        <Link
                          key={tab.id}
                          href={`/dashboard/projects/${projectId}?tab=${tab.id}`}
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-app-fg hover:bg-app-bg rounded-lg transition-colors"
                        >
                          {tab.label}
                          {tab.isNew && (
                            <span className="bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded text-[10px] uppercase font-black tracking-wider ml-auto">
                              New
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-3 text-sm font-medium text-app-muted text-center">
                      All tabs are pinned.
                    </div>
                  )}
                  
                  <div className="h-px bg-app-border my-2 -mx-2" />
                  
                  <button
                    onClick={() => setIsCustomizeMode(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors"
                  >
                    <Settings2 className="w-4 h-4" />
                    Customize Toolbar
                  </button>
                </div>
              ) : (
                <div className="p-2">
                  <div className="px-3 py-2 flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-app-fg uppercase tracking-wider">
                      Customize Tabs
                    </span>
                    <button 
                      onClick={() => setIsCustomizeMode(false)}
                      className="text-xs text-indigo-500 font-bold hover:underline"
                    >
                      Done
                    </button>
                  </div>
                  
                  <div className="space-y-1 max-h-60 overflow-y-auto no-scrollbar">
                    {availableTabs.map(tab => {
                      const isVisible = finalVisibleTabs.includes(tab.id)
                      const isRequired = tab.id === activeTab
                      return (
                        <button
                          key={tab.id}
                          disabled={isRequired}
                          onClick={() => toggleTab(tab.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                            isRequired ? 'opacity-50 cursor-not-allowed' : 'hover:bg-app-bg'
                          }`}
                        >
                          <span className={isVisible ? 'text-app-fg font-medium' : 'text-app-muted'}>
                            {tab.label}
                          </span>
                          <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                            isVisible 
                              ? 'bg-indigo-500 border-indigo-500 text-white' 
                              : 'border-app-border bg-app-surface text-transparent'
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

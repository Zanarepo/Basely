'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Search, Loader2, AlertCircle, ChevronRight, ChevronDown, PanelLeftClose, PanelLeft } from 'lucide-react'
import type { WbsElement } from '@/lib/wbs/constants'

type Stakeholder = {
  id: string
  name: string
  organization_type: 'internal' | 'external'
  profiles?: { full_name: string | null; email: string | null } | any
}

type RaciMatrixViewProps = {
  projectId: string
  elements: WbsElement[]
  expandedNodeIds?: Set<string>
  onToggleExpand?: (id: string, e: React.MouseEvent) => void
}

export function RaciMatrixView({ projectId, elements, expandedNodeIds = new Set(), onToggleExpand }: RaciMatrixViewProps) {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchStakeholder, setSearchStakeholder] = useState('')
  const [showWbsColumn, setShowWbsColumn] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function loadStakeholders() {
      const { data } = await supabase
        .from('stakeholders')
        .select('id, name, organization_type, profiles(full_name, email)')
        .eq('project_id', projectId)
        .order('name', { ascending: true })
      
      if (data) setStakeholders(data)
      setLoading(false)
    }
    loadStakeholders()
  }, [projectId])

  const filteredElements = useMemo(() => {
    
    // Filter out milestones (duration === 0) — they only appear on Gantt and Status Report
    const nonMilestoneElements = elements.filter((el) => {
      if (!el.isWorkPackage) return true // summary elements always show
      return el.duration !== 0
    })

    const visible: WbsElement[] = []
    const parentVisible = new Map<string, boolean>()

    nonMilestoneElements.forEach((el) => {
      let isVisible = true

      if (el.parentId) {
        const pVisible = parentVisible.get(el.parentId) ?? true
        const pExpanded = expandedNodeIds.has(el.parentId)
        isVisible = pVisible && pExpanded
      }

      parentVisible.set(el.id, isVisible)

      if (isVisible) {
        visible.push(el)
      }
    })

    return visible
  }, [elements, expandedNodeIds])

  const elementLevels = useMemo(() => {
    const levels = new Map<string, number>()
    elements.forEach((el) => {
      let lvl = 0
      if (el.parentId) {
        lvl = (levels.get(el.parentId) || 0) + 1
      }
      levels.set(el.id, lvl)
    })
    return levels
  }, [elements])

  const filteredStakeholders = useMemo(() => {
    if (!searchStakeholder) return stakeholders
    const query = searchStakeholder.toLowerCase()
    return stakeholders.filter(s => 
      s.name.toLowerCase().includes(query) || 
      (s.profiles?.full_name?.toLowerCase().includes(query)) ||
      (s.profiles?.email?.toLowerCase().includes(query))
    )
  }, [stakeholders, searchStakeholder])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 min-h-[300px]">
        <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
        <span className="ml-2 text-sm text-app-muted">Loading matrix data...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[600px] space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4 px-1">
        <button
          onClick={() => setShowWbsColumn(!showWbsColumn)}
          className={`p-2 rounded-xl transition-all flex items-center justify-center ${
            showWbsColumn
              ? 'bg-indigo-500/10 text-indigo-600'
              : 'hover:bg-app-surface border border-transparent hover:border-app-border text-app-subtle hover:text-app-fg'
          }`}
          title={showWbsColumn ? "Hide WBS details column" : "Show WBS details column"}
        >
          <PanelLeftClose className="w-5 h-5" />
        </button>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-app-muted" />
          <input
            type="text"
            placeholder="Search stakeholders..."
            value={searchStakeholder}
            onChange={(e) => setSearchStakeholder(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-app-surface border border-app-border rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-2xl border border-app-border bg-app-surface min-h-0">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead>
            <tr>
              {showWbsColumn && (
                <th className="sticky top-0 left-0 z-20 bg-app-muted-surface border-b-2 border-r-2 border-app-border px-4 py-3 text-left font-semibold text-app-fg min-w-[250px]">
                  WBS Element
                </th>
              )}
              {filteredStakeholders.map(s => (
                <th key={s.id} className="sticky top-0 z-10 bg-app-muted-surface border-b-2 border-app-border border-r border-app-border/50 px-3 py-3 text-center min-w-[100px] whitespace-nowrap">
                  <div className="flex flex-col items-center">
                    <span className="font-semibold text-app-fg truncate max-w-[120px] block" title={s.profiles?.full_name || s.name}>
                      {s.profiles?.full_name || s.name}
                    </span>
                    <span className="text-[10px] text-app-muted uppercase mt-0.5">{s.organization_type}</span>
                  </div>
                </th>
              ))}
              <th className="sticky top-0 z-10 bg-app-muted-surface border-b-2 border-app-border px-4 py-3 min-w-[40px]"></th>
            </tr>
          </thead>
          <tbody>
            {filteredElements.map((el, idx) => {
              const hasR = el.raciAssignments?.some(a => a.roleType === 'Responsible')
              const hasA = el.raciAssignments?.some(a => a.roleType === 'Accountable')
              const isMissingRaci = el.isWorkPackage && (!hasR || !hasA)

              return (
                <tr key={el.id} className="group hover:bg-app-hover transition-colors">
                  {showWbsColumn && (
                    <td className="sticky left-0 z-10 bg-app-surface group-hover:bg-app-hover border-b border-r-2 border-app-border px-4 py-2.5 whitespace-nowrap transition-colors">
                      <div className="flex items-center gap-2" style={{ paddingLeft: `${(elementLevels.get(el.id) || 0) * 16}px` }}>
                        {!el.isWorkPackage ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onToggleExpand?.(el.id, e)
                            }}
                            className="p-0.5 hover:bg-app-hover rounded text-app-subtle cursor-pointer"
                          >
                            {expandedNodeIds.has(el.id) ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        ) : (
                          <div className="w-4 h-4 shrink-0" />
                        )}
                        <span className="text-xs font-mono font-bold text-app-subtle px-1.5 py-0.5 rounded bg-app-bg border border-app-border">
                          {el.code}
                        </span>
                        <span className="font-medium text-app-fg truncate max-w-[200px]" title={el.name}>
                          {el.name}
                        </span>
                        {isMissingRaci && (
                          <div title="Missing Responsible or Accountable assignment" className="ml-auto shrink-0 flex items-center">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                          </div>
                        )}
                      </div>
                    </td>
                  )}
                  {filteredStakeholders.map(s => {
                    const assignment = el.raciAssignments?.filter(a => a.stakeholderId === s.id) || []
                    const roles = assignment.map(a => a.roleType[0]) // R, A, C, I

                    return (
                      <td key={`${el.id}-${s.id}`} className="border-b border-r border-app-border/50 px-2 py-2 text-center relative">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {roles.map(role => {
                            let bgClass = ''
                            if (role === 'R') bgClass = 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            if (role === 'A') bgClass = 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                            if (role === 'C') bgClass = 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                            if (role === 'I') bgClass = 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                            
                            return (
                              <span key={role} className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${bgClass}`}>
                                {role}
                              </span>
                            )
                          })}
                        </div>
                      </td>
                    )
                  })}
                  <td className="border-b border-app-border px-4 py-2"></td>
                </tr>
              )
            })}
            {filteredElements.length === 0 && (
              <tr>
                <td colSpan={filteredStakeholders.length + 2} className="px-4 py-8 text-center text-app-muted">
                  No elements found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

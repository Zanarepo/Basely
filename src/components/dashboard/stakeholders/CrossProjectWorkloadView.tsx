'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Loader2, Search, AlertCircle, Briefcase } from 'lucide-react'

type WorkloadItem = {
  id: string
  role_type: string
  wbs_element: {
    id: string
    name: string
    code: string
    project: {
      id: string
      name: string
    }
  }
}

type CrossProjectWorkloadViewProps = {
  projectId: string // the current project
}

export function CrossProjectWorkloadView({ projectId }: CrossProjectWorkloadViewProps) {
  const [workloads, setWorkloads] = useState<{ stakeholderName: string; linkedUserId: string; assignments: WorkloadItem[] }[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const supabase = createClient()

  useEffect(() => {
    async function fetchWorkload() {
      // 1. Get stakeholders in THIS project that are linked to a user
      const { data: localStakeholders } = await supabase
        .from('stakeholders')
        .select('id, name, linked_user_id')
        .eq('project_id', projectId)
        .not('linked_user_id', 'is', null)

      if (!localStakeholders || localStakeholders.length === 0) {
        setWorkloads([])
        setLoading(false)
        return
      }

      const linkedUserIds = localStakeholders.map(s => s.linked_user_id as string)

      // 2. Fetch all assignments for any stakeholder (across any project) that shares these linked_user_ids
      // We need to join stakeholders to filter by linked_user_id, and wbs_elements -> projects
      const { data: assignmentsData, error } = await supabase
        .from('raci_assignments')
        .select(`
          id,
          role_type,
          stakeholder:stakeholder_id ( linked_user_id ),
          wbs_element:wbs_element_id (
            id,
            name,
            code,
            project:project_id ( id, name )
          )
        `)
        // Filter by stakeholders that have matching linked_user_ids
        // Supabase postgrest doesn't allow filtering by joined table directly in 'in' easily unless we do an inner join
        // Let's just fetch all stakeholders first, then their assignments
      
      const { data: allLinkedStakeholders } = await supabase
        .from('stakeholders')
        .select('id, linked_user_id')
        .in('linked_user_id', linkedUserIds)
        
      if (!allLinkedStakeholders || allLinkedStakeholders.length === 0) {
          setWorkloads([])
          setLoading(false)
          return
      }
      
      const allStakeholderIds = allLinkedStakeholders.map(s => s.id)

      const { data: allAssignments } = await supabase
        .from('raci_assignments')
        .select(`
          id,
          role_type,
          stakeholder_id,
          wbs_element:wbs_element_id (
            id,
            name,
            code,
            project:project_id ( id, name )
          )
        `)
        .in('stakeholder_id', allStakeholderIds)

      // 3. Group assignments by linkedUserId
      const grouped = localStakeholders.map(localS => {
        const stakeholderIdsForUser = allLinkedStakeholders
          .filter(s => s.linked_user_id === localS.linked_user_id)
          .map(s => s.id)
          
        const userAssignments = (allAssignments || []).filter(a => stakeholderIdsForUser.includes(a.stakeholder_id))
        
        return {
          stakeholderName: localS.name,
          linkedUserId: localS.linked_user_id!,
          // @ts-ignore - Supabase type inference has trouble with nested joins
          assignments: userAssignments as WorkloadItem[]
        }
      })

      setWorkloads(grouped)
      setLoading(false)
    }

    fetchWorkload()
  }, [projectId])

  const filteredWorkloads = useMemo(() => {
    if (!searchQuery) return workloads
    const q = searchQuery.toLowerCase()
    return workloads.filter(w => 
      w.stakeholderName.toLowerCase().includes(q) ||
      w.assignments.some(a => 
        a.wbs_element.name.toLowerCase().includes(q) || 
        a.wbs_element.project.name.toLowerCase().includes(q)
      )
    )
  }, [workloads, searchQuery])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 min-h-[300px]">
        <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
        <span className="ml-2 text-sm text-app-muted">Analyzing cross-project workloads...</span>
      </div>
    )
  }

  if (workloads.length === 0) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-500 mb-4">
          <Briefcase className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-bold text-app-fg mb-1">No Workload Data</h3>
        <p className="text-sm text-app-muted max-w-sm leading-relaxed">
          There are no internal team members in this project with a linked platform account, or no cross-project assignments exist.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-app-surface-solid border border-app-border rounded-2xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-app-border flex items-center justify-between">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-app-muted" />
          <input
            type="text"
            placeholder="Search team member or project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-app-bg border border-app-border rounded-xl text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="text-sm text-app-muted flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-indigo-500" />
          Showing assignments across all workspaces
        </div>
      </div>

      <div className="p-4 space-y-6">
        {filteredWorkloads.map(w => {
          if (w.assignments.length === 0) return null

          return (
            <div key={w.linkedUserId} className="bg-app-surface-solid rounded-xl border border-app-border overflow-hidden">
              <div className="px-4 py-3 bg-app-muted-surface border-b border-app-border flex items-center justify-between">
                <h3 className="font-bold text-app-fg text-sm">{w.stakeholderName}</h3>
                <span className="text-xs font-semibold text-app-muted bg-app-surface px-2 py-1 rounded border border-app-border">
                  {w.assignments.length} Total Assignments
                </span>
              </div>
              <div className="divide-y divide-app-border">
                {w.assignments.map(a => {
                  let badgeClass = ''
                  let roleLabel = a.role_type
                  if (a.role_type === 'Responsible') { badgeClass = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'; roleLabel = 'R' }
                  if (a.role_type === 'Accountable') { badgeClass = 'bg-rose-500/10 text-rose-600 border-rose-500/20'; roleLabel = 'A' }
                  if (a.role_type === 'Consulted') { badgeClass = 'bg-amber-500/10 text-amber-600 border-amber-500/20'; roleLabel = 'C' }
                  if (a.role_type === 'Informed') { badgeClass = 'bg-blue-500/10 text-blue-600 border-blue-500/20'; roleLabel = 'I' }

                  return (
                    <div key={a.id} className="p-3 flex items-center justify-between hover:bg-app-hover transition-colors">
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold border ${badgeClass}`} title={a.role_type}>
                          {roleLabel}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-app-fg">{a.wbs_element.name}</p>
                          <p className="text-xs text-app-muted font-mono mt-0.5">{a.wbs_element.code}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-app-subtle">Project</p>
                        <p className="text-sm text-app-fg max-w-[200px] truncate" title={a.wbs_element.project?.name}>
                          {a.wbs_element.project?.name || 'Unknown'}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
        {filteredWorkloads.every(w => w.assignments.length === 0) && (
          <div className="text-center py-12 text-app-muted text-sm">
            No active assignments found for these stakeholders.
          </div>
        )}
      </div>
    </div>
  )
}

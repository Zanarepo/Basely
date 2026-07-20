'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Search, Check, ChevronDown, User, Users, Loader2 } from 'lucide-react'
import { assignRaciRole, removeRaciRole, replaceAccountableRole } from '@/lib/wbs/actions'
import type { RaciRoleType, RaciAssignment } from '@/lib/wbs/constants'
import type { ActionResponse } from '@/lib/wbs/actions'

type Stakeholder = {
  id: string
  name: string
  organization_type: 'internal' | 'external'
  linked_user_id?: string | null
  profiles?: { full_name: string | null; email: string | null } | any
}

type RaciAssignmentPickerProps = {
  projectId: string
  wbsElementId: string
  assignments: RaciAssignment[]
  hasEditAccess: boolean
  onAssignmentChanged?: () => void
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void
  callerRole?: string
  callerUserId?: string
}

export function RaciAssignmentPicker({
  projectId,
  wbsElementId,
  assignments,
  hasEditAccess,
  onAssignmentChanged,
  onShowToast,
  callerRole,
  callerUserId,
}: RaciAssignmentPickerProps) {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([])
  const [loading, setLoading] = useState(true)
  const [openRole, setOpenRole] = useState<RaciRoleType | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  
  const dropdownRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()

  useEffect(() => {
    async function loadStakeholders() {
      const { data, error } = await supabase
        .from('stakeholders')
        .select('id, name, organization_type, linked_user_id, profiles(full_name, email)')
        .eq('project_id', projectId)
        .order('name', { ascending: true })
      
      if (data) setStakeholders(data)
      setLoading(false)
    }
    loadStakeholders()
  }, [projectId])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenRole(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredStakeholders = useMemo(() => {
    if (!searchQuery) return stakeholders
    const query = searchQuery.toLowerCase()
    return stakeholders.filter(s => 
      s.name.toLowerCase().includes(query) || 
      (s.profiles?.full_name?.toLowerCase().includes(query)) ||
      (s.profiles?.email?.toLowerCase().includes(query))
    )
  }, [stakeholders, searchQuery])

  const availableStakeholders = useMemo(() => {
    if (hasEditAccess) return filteredStakeholders
    if (callerRole === 'Team Member') {
      return filteredStakeholders.filter(s => s.linked_user_id === callerUserId)
    }
    return []
  }, [filteredStakeholders, hasEditAccess, callerRole, callerUserId])

  const canEditRole = (role: RaciRoleType) => {
    if (hasEditAccess) return true
    if (callerRole === 'Team Member' && role === 'Responsible') {
      const isMissingR = !assignments.some(a => a.roleType === 'Responsible')
      const isMyTask = assignments.some(a => a.roleType === 'Responsible' && a.stakeholder?.linked_user_id === callerUserId)
      return isMissingR || isMyTask
    }
    return false
  }

  const handleToggleAssignment = async (stakeholderId: string, roleType: RaciRoleType) => {
    if (!canEditRole(roleType) || isUpdating) return
    setIsUpdating(true)
    
    try {
      let res: ActionResponse
      
      const existing = assignments.find(a => a.stakeholderId === stakeholderId && a.roleType === roleType)
      
      if (existing) {
        // Remove
        res = await removeRaciRole(projectId, wbsElementId, stakeholderId, roleType)
      } else {
        // Add or Replace
        if (roleType === 'Accountable') {
          // Check if replacing
          const currentA = assignments.find(a => a.roleType === 'Accountable')
          if (currentA && currentA.stakeholderId !== stakeholderId) {
            if (!window.confirm('This will replace the currently Accountable stakeholder. Proceed?')) {
              setIsUpdating(false)
              return
            }
          }
          res = await replaceAccountableRole(projectId, wbsElementId, stakeholderId)
          // Intentionally keeping it open as per user request to not close panels
        } else {
          res = await assignRaciRole(projectId, wbsElementId, stakeholderId, roleType)
        }
      }

      if (!res.ok) {
        onShowToast('error', res.error || 'Failed to update RACI assignment')
      } else {
        onAssignmentChanged?.()
      }
    } catch (err) {
      onShowToast('error', 'An unexpected error occurred')
    } finally {
      setIsUpdating(false)
    }
  }

  const renderRoleSection = (role: RaciRoleType, title: string, description: string, colorClass: string) => {
    const roleAssignments = assignments.filter(a => a.roleType === role)
    const isOpen = openRole === role

    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="text-sm font-semibold text-app-fg flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${colorClass}`}></span>
              {title}
            </h4>
            <p className="text-xs text-app-muted">{description}</p>
          </div>
          {canEditRole(role) && (
            <button
              onClick={() => {
                setOpenRole(isOpen ? null : role)
                setSearchQuery('')
              }}
              className="text-xs font-medium px-2 py-1 rounded bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 transition-colors"
            >
              {isOpen ? 'Close' : 'Assign'}
            </button>
          )}
        </div>

        {/* Assigned Users */}
        {roleAssignments.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-2">
            {roleAssignments.map(a => {
              const s = a.stakeholder
              const initial = (s?.profiles?.full_name || s?.name || '?').charAt(0).toUpperCase()
              const name = s?.profiles?.full_name || s?.name || 'Unknown'
              return (
                <div key={a.id} className="flex items-center gap-2 px-2 py-1 rounded-md bg-app-surface border border-app-border text-sm text-app-fg group">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${colorClass.replace('bg-', 'bg-').replace('text-', 'bg-')}`}>
                    {initial}
                  </div>
                  <span>{name}</span>
                  {hasEditAccess && (
                    <button 
                      onClick={() => handleToggleAssignment(a.stakeholderId, role)}
                      disabled={isUpdating}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-opacity ml-1"
                    >
                      ×
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-xs text-app-muted italic py-1">
            {role === 'Responsible' || role === 'Accountable' 
              ? `⚠️ No ${role.toLowerCase()} assigned`
              : 'None assigned'}
          </div>
        )}

        {/* Picker Dropdown */}
        {isOpen && (
          <div ref={dropdownRef} className="mt-2 p-2 border border-app-border rounded-xl bg-app-surface shadow-xl z-10 relative">
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-app-muted" />
              <input
                type="text"
                placeholder="Search stakeholders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-app-bg border border-app-border rounded-lg text-app-fg focus:outline-none focus:border-indigo-500"
                autoFocus
              />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {loading ? (
                <div className="flex justify-center p-4"><Loader2 className="w-4 h-4 animate-spin text-indigo-500" /></div>
              ) : availableStakeholders.length === 0 ? (
                <div className="text-sm text-app-muted text-center py-2">No stakeholders found.</div>
              ) : (
                <div className="max-h-48 overflow-y-auto overflow-x-hidden p-1.5 custom-scrollbar bg-slate-50 dark:bg-slate-900 border-t border-app-border">
                  {availableStakeholders.map(s => {
                  const isAssigned = roleAssignments.some(a => a.stakeholderId === s.id)
                  const name = s.profiles?.full_name || s.name
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleToggleAssignment(s.id, role)}
                      disabled={isUpdating}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-app-hover transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        {s.organization_type === 'internal' ? <User className="w-3.5 h-3.5 text-indigo-400" /> : <Users className="w-3.5 h-3.5 text-emerald-400" />}
                        <span className="text-app-fg font-medium truncate max-w-[160px]">{name}</span>
                        <span className="text-xs text-app-muted px-1.5 py-0.5 rounded bg-app-bg">
                          {s.organization_type}
                        </span>
                      </div>
                      {isAssigned && <Check className="w-4 h-4 text-indigo-500" />}
                    </button>
                  )
                })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {renderRoleSection('Responsible', 'Responsible (R)', 'Does the work to complete the task.', 'bg-emerald-500')}
      {renderRoleSection('Accountable', 'Accountable (A)', 'Delegates work and is the final approving authority.', 'bg-rose-500')}
      {renderRoleSection('Consulted', 'Consulted (C)', 'Provides expertise and input.', 'bg-amber-500')}
      {renderRoleSection('Informed', 'Informed (I)', 'Kept up-to-date on progress.', 'bg-blue-500')}
    </div>
  )
}

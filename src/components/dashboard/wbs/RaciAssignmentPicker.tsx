'use client'

import { Search, Check, ChevronDown, User, Users, Loader2 } from 'lucide-react'
import type { RaciRoleType, RaciAssignment } from '@/lib/wbs/constants'
import { useRaciAssignmentPicker } from './hooks/useRaciAssignmentPicker'

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
  const {
    loading,
    openRole,
    setOpenRole,
    searchQuery,
    setSearchQuery,
    isUpdating,
    localAssignments,
    dropdownRef,
    availableStakeholders,
    canEditRole,
    handleToggleAssignment
  } = useRaciAssignmentPicker({
    projectId,
    wbsElementId,
    assignments,
    hasEditAccess,
    onAssignmentChanged,
    onShowToast,
    callerRole,
    callerUserId
  })

  const renderRoleSection = (role: RaciRoleType, title: string, description: string, colorClass: string) => {
    const roleAssignments = localAssignments.filter(a => a.roleType === role)
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
          <button
              type="button"
              onClick={() => {
                setOpenRole(isOpen ? null : role)
                setSearchQuery('')
              }}
              className="text-xs font-medium px-2 py-1 rounded bg-violet-500/10 text-violet-500 hover:bg-violet-500/20 transition-colors"
            >
              {isOpen ? 'Close' : 'Assign'}
            </button>
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
                  {canEditRole(role, a.stakeholderId) && (
                    <button
                      type="button"
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
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-app-bg border border-app-border rounded-lg text-app-fg focus:outline-none focus:border-violet-500"
                autoFocus
              />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center p-4 gap-2 text-app-muted">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                  <span className="text-xs">Loading team members...</span>
                </div>
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
                        type="button"
                        onClick={() => handleToggleAssignment(s.id, role)}
                        disabled={isUpdating || !canEditRole(role, s.id)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-app-hover transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center gap-2">
                          {s.organization_type === 'internal' ? <User className="w-3.5 h-3.5 text-violet-400 shrink-0" /> : <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                          <div className="flex flex-col">
                            <span className="text-app-fg font-medium truncate max-w-[160px]">{name}</span>
                            <span className="text-xs text-app-subtle truncate max-w-[160px]">
                              {s.role_title || s.sub_category || s.organization_type}
                            </span>
                          </div>
                          <span className="text-[10px] uppercase font-bold text-app-muted px-1.5 py-0.5 rounded bg-app-bg ml-1">
                            {s.organization_type}
                          </span>
                        </div>
                        {isAssigned && <Check className="w-4 h-4 text-violet-500" />}
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

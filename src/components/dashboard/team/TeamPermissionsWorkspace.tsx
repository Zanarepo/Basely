'use client'

import { useState } from 'react'
import { Check, Edit2, Save, X, UserCog, Shield, Search } from 'lucide-react'
import { updateProjectMemberPermissions, bulkUpdateProjectMemberPermissions, UpdatePermissionsPayload } from '@/lib/projects/permissions-actions'
import { ToastContainer, type ToastMessage } from '@/components/dashboard/Toast'

type WorkspaceMember = {
  userId: string
  name: string
  email: string
  role: string
}

type ProjectMemberData = {
  user_id: string
  can_edit_schedule: boolean
  can_edit_cost: boolean
  can_edit_risks: boolean
  can_edit_documents: boolean
  project_role_title: string | null
}

interface TeamPermissionsWorkspaceProps {
  projectId: string
  workspaceMembers: WorkspaceMember[]
  projectMembersData: ProjectMemberData[]
  hasEditAccess: boolean // Whether the caller can assign/edit roles
}

export default function TeamPermissionsWorkspace({ projectId, workspaceMembers, projectMembersData, hasEditAccess }: TeamPermissionsWorkspaceProps) {
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editState, setEditState] = useState<UpdatePermissionsPayload | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { id, type, message }])
  }

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  // Map the members together
  const membersWithPermissions = workspaceMembers.map(wm => {
    const pm = (projectMembersData || []).find(p => p.user_id === wm.userId)
    const isAssigned = !!pm
    return {
      ...wm,
      isAssigned,
      permissions: {
        can_edit_schedule: pm?.can_edit_schedule || false,
        can_edit_cost: pm?.can_edit_cost || false,
        can_edit_risks: pm?.can_edit_risks || false,
        can_edit_documents: pm?.can_edit_documents || false,
        project_role_title: pm?.project_role_title || ''
      }
    }
  }).sort((a, b) => Number(b.isAssigned) - Number(a.isAssigned))

  const filteredMembers = membersWithPermissions.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleSelectUser = (userId: string) => {
    const next = new Set(selectedUserIds)
    if (next.has(userId)) next.delete(userId)
    else next.add(userId)
    setSelectedUserIds(next)
  }

  const toggleSelectAll = () => {
    if (selectedUserIds.size === filteredMembers.length && filteredMembers.length > 0) {
      setSelectedUserIds(new Set())
    } else {
      setSelectedUserIds(new Set(filteredMembers.map(m => m.userId)))
    }
  }

  const handleEditClick = (userId: string, currentPerms: UpdatePermissionsPayload) => {
    if (!hasEditAccess) return
    setEditingUserId(userId)
    setEditState({ ...currentPerms })
  }

  const handleCancel = () => {
    setEditingUserId(null)
    setEditState(null)
  }

  const handleSave = async (userId: string) => {
    if (!editState || !hasEditAccess) return
    setIsSaving(true)
    try {
      const res = await updateProjectMemberPermissions(projectId, userId, editState)
      if (res.ok) {
        showToast('success', 'Permissions updated successfully')
        setEditingUserId(null)
        setEditState(null)
      } else {
        showToast('error', res.error || 'Failed to update permissions')
      }
    } catch (err) {
      showToast('error', 'An error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const startBulkEdit = () => {
    if (!hasEditAccess || selectedUserIds.size === 0) return
    setEditingUserId('bulk')
    setEditState({
      can_edit_schedule: false,
      can_edit_cost: false,
      can_edit_risks: false,
      can_edit_documents: false,
      project_role_title: ''
    })
  }

  const handleBulkSave = async () => {
    if (!editState || !hasEditAccess || selectedUserIds.size === 0) return
    setIsSaving(true)
    try {
      const res = await bulkUpdateProjectMemberPermissions(projectId, Array.from(selectedUserIds), editState)
      if (res.ok) {
        showToast('success', `Permissions updated for ${selectedUserIds.size} members`)
        setEditingUserId(null)
        setEditState(null)
        setSelectedUserIds(new Set())
      } else {
        showToast('error', res.error || 'Failed to bulk update permissions')
      }
    } catch (err) {
      showToast('error', 'An error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-app-surface border border-app-border rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-app-border flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-app-fg flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-500" />
            Team Access & Permissions
          </h2>
          <p className="text-sm text-app-muted mt-1">
            Toggle specific editing powers for members of this project.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-app-muted" />
            <input 
              type="text" 
              placeholder="Search members..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-app-surface border border-app-border rounded-lg text-sm focus:outline-none focus:border-indigo-500 w-64"
            />
          </div>
        </div>
      </div>

      {selectedUserIds.size > 0 && editingUserId !== 'bulk' && (
        <div className="bg-indigo-500/10 border-b border-indigo-500/20 px-6 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-indigo-500">{selectedUserIds.size} member{selectedUserIds.size > 1 ? 's' : ''} selected</span>
          <button onClick={startBulkEdit} className="text-sm bg-indigo-500 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-600 font-medium shadow-sm transition-colors">
            Bulk Assign & Edit
          </button>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-app-muted-surface border-b border-app-border text-xs uppercase tracking-wider text-app-muted">
              <th className="px-6 py-4 w-12 text-center">
                <input 
                  type="checkbox" 
                  checked={filteredMembers.length > 0 && selectedUserIds.size === filteredMembers.length}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-app-border text-indigo-600 focus:ring-indigo-500"
                />
              </th>
              <th className="px-6 py-4 font-semibold">Member</th>
              <th className="px-6 py-4 font-semibold">Project Title</th>
              <th className="px-4 py-4 font-semibold text-center">Schedule</th>
              <th className="px-4 py-4 font-semibold text-center">Budget</th>
              <th className="px-4 py-4 font-semibold text-center">Risks</th>
              <th className="px-4 py-4 font-semibold text-center">Docs</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border text-sm">
            {editingUserId === 'bulk' && editState && (
              <tr className="bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors border-b-2 border-indigo-500/20">
                <td className="px-6 py-4 w-12 text-center">
                  <div className="h-2 w-2 rounded-full bg-indigo-500 mx-auto" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-semibold text-indigo-500">Bulk Editing {selectedUserIds.size} Members</div>
                  <div className="text-xs text-app-muted mt-0.5">Applies to all selected</div>
                </td>
                <td className="px-6 py-4">
                  <input 
                    type="text" 
                    value={editState.project_role_title}
                    onChange={(e) => setEditState({...editState, project_role_title: e.target.value})}
                    placeholder="e.g. Cost Manager"
                    className="w-full bg-app-surface border border-indigo-500/30 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 shadow-sm"
                  />
                </td>
                <td className="px-4 py-4 text-center">
                  <input 
                    type="checkbox" 
                    checked={editState.can_edit_schedule}
                    onChange={(e) => setEditState({...editState, can_edit_schedule: e.target.checked})}
                    className="h-4 w-4 rounded border-indigo-500/30 text-indigo-600 focus:ring-indigo-500"
                  />
                </td>
                <td className="px-4 py-4 text-center">
                  <input 
                    type="checkbox" 
                    checked={editState.can_edit_cost}
                    onChange={(e) => setEditState({...editState, can_edit_cost: e.target.checked})}
                    className="h-4 w-4 rounded border-indigo-500/30 text-emerald-600 focus:ring-emerald-500"
                  />
                </td>
                <td className="px-4 py-4 text-center">
                  <input 
                    type="checkbox" 
                    checked={editState.can_edit_risks}
                    onChange={(e) => setEditState({...editState, can_edit_risks: e.target.checked})}
                    className="h-4 w-4 rounded border-indigo-500/30 text-amber-600 focus:ring-amber-500"
                  />
                </td>
                <td className="px-4 py-4 text-center">
                  <input 
                    type="checkbox" 
                    checked={editState.can_edit_documents}
                    onChange={(e) => setEditState({...editState, can_edit_documents: e.target.checked})}
                    className="h-4 w-4 rounded border-indigo-500/30 text-sky-600 focus:ring-sky-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button onClick={handleCancel} disabled={isSaving} className="px-3 py-1.5 text-app-muted hover:text-app-fg rounded-md hover:bg-app-hover transition-colors font-semibold">
                      Cancel
                    </button>
                    <button onClick={handleBulkSave} disabled={isSaving} className="px-3 py-1.5 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors font-semibold shadow-sm flex items-center gap-1.5">
                      <Save className="h-4 w-4" />
                      Save All
                    </button>
                  </div>
                </td>
              </tr>
            )}
            
            {filteredMembers.map(member => {
              const isEditing = editingUserId === member.userId
              const perms = isEditing && editState ? editState : member.permissions

              return (
                <tr key={member.userId} className={`group hover:bg-app-hover/50 transition-colors ${!member.isAssigned && !isEditing ? 'opacity-60 grayscale' : ''}`}>
                  <td className="px-6 py-4 text-center">
                    <input 
                      type="checkbox"
                      checked={selectedUserIds.has(member.userId)}
                      onChange={() => toggleSelectUser(member.userId)}
                      className={`h-4 w-4 rounded border-app-border text-indigo-600 focus:ring-indigo-500 transition-opacity ${selectedUserIds.has(member.userId) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'}`}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-bold border border-indigo-500/20">
                        {member.name.substring(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-app-fg">{member.name}</div>
                        <div className="text-xs text-app-muted">{member.email} ({member.role})</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={perms.project_role_title}
                        onChange={(e) => setEditState({...perms, project_role_title: e.target.value})}
                        placeholder="e.g. Cost Manager"
                        className="w-full bg-app-surface border border-app-border rounded-md px-2 py-1 text-sm focus:outline-none focus:border-indigo-500"
                      />
                    ) : (
                      <span className="text-app-fg">{member.permissions.project_role_title || <span className="text-app-muted italic">None</span>}</span>
                    )}
                  </td>

                  <td className="px-4 py-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={perms.can_edit_schedule}
                      disabled={!isEditing}
                      onChange={(e) => setEditState({...perms, can_edit_schedule: e.target.checked})}
                      className="h-4 w-4 rounded border-app-border text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                    />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={perms.can_edit_cost}
                      disabled={!isEditing}
                      onChange={(e) => setEditState({...perms, can_edit_cost: e.target.checked})}
                      className="h-4 w-4 rounded border-app-border text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                    />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={perms.can_edit_risks}
                      disabled={!isEditing}
                      onChange={(e) => setEditState({...perms, can_edit_risks: e.target.checked})}
                      className="h-4 w-4 rounded border-app-border text-amber-600 focus:ring-amber-500 disabled:opacity-50"
                    />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={perms.can_edit_documents}
                      disabled={!isEditing}
                      onChange={(e) => setEditState({...perms, can_edit_documents: e.target.checked})}
                      className="h-4 w-4 rounded border-app-border text-sky-600 focus:ring-sky-500 disabled:opacity-50"
                    />
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {isEditing ? (
                      <div className="flex justify-end gap-2">
                        <button onClick={handleCancel} disabled={isSaving} className="p-1.5 text-app-muted hover:text-app-fg rounded-md hover:bg-app-hover transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleSave(member.userId)} disabled={isSaving} className="p-1.5 text-indigo-500 hover:text-indigo-600 rounded-md hover:bg-indigo-500/10 transition-colors">
                          <Save className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      hasEditAccess && editingUserId !== 'bulk' && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                          <button 
                            onClick={() => handleEditClick(member.userId, member.permissions)}
                            className="text-app-muted hover:text-indigo-500 transition-colors px-2 py-1 rounded-md hover:bg-app-hover inline-flex items-center gap-1 text-xs font-semibold"
                          >
                            <Edit2 className="h-3 w-3" />
                            {member.isAssigned ? 'Edit' : 'Assign & Edit'}
                          </button>
                        </div>
                      )
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filteredMembers.length === 0 && (
          <div className="py-12 text-center text-app-muted">
            {searchQuery ? 'No members match your search.' : 'No workspace members found.'}
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}

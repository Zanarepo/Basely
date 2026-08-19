import { useState, useTransition } from 'react'
import { Users, X, Search, CheckCircle } from 'lucide-react'
import { updateProjectMembers } from '@/lib/projects/actions'

type ProjectType = {
  id: string
  name: string
  assignedMembers: string[]
  memberPermissions: { userId: string; canDelete: boolean }[]
  // ... other fields are omitted for brevity in the modal
}

type WorkspaceMember = {
  userId: string
  name: string
  email: string
  role: string
}

type ProjectMemberPickerModalProps = {
  project: ProjectType | null
  workspaceMembers: WorkspaceMember[]
  onClose: () => void
  onSuccess: () => void
  onShowToast: (type: 'success' | 'error' | 'info', msg: string) => void
}

export function ProjectMemberPickerModal({
  project,
  workspaceMembers,
  onClose,
  onSuccess,
  onShowToast
}: ProjectMemberPickerModalProps) {
  const [isPending, startTransition] = useTransition()
  const [memberSearchQuery, setMemberSearchQuery] = useState('')

  // We initialize state only if project exists, but we render null if it doesn't anyway
  const [selectedPickerUserIds, setSelectedPickerUserIds] = useState<string[]>(
    project ? project.assignedMembers : []
  )
  const [deletePermissionUserIds, setDeletePermissionUserIds] = useState<string[]>(
    project ? project.memberPermissions.filter(m => m.canDelete).map(m => m.userId) : []
  )

  if (!project) return null

  const handleTogglePickerMember = (memberUserId: string) => {
    setSelectedPickerUserIds((prev) =>
      prev.includes(memberUserId)
        ? prev.filter((id) => id !== memberUserId)
        : [...prev, memberUserId]
    )
  }

  const toggleDeletePermission = (userId: string) => {
    setDeletePermissionUserIds((current) => current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId]
    )
  }

  const handleSaveAssignments = () => {
    startTransition(async () => {
      const result = await updateProjectMembers(
        project.id,
        selectedPickerUserIds.map((userId) => ({
          userId,
          canDelete: deletePermissionUserIds.includes(userId),
        }))
      )
      if (result.ok) {
        onShowToast('success', `Project team assignments updated for "${project.name}"`)
        onSuccess()
      } else {
        onShowToast('error', result.error)
      }
    })
  }

  const filteredMembers = workspaceMembers.filter((m) => {
    if (!memberSearchQuery.trim()) return true
    const q = memberSearchQuery.toLowerCase()
    return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
  })

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        />

        <div className="relative w-full max-w-sm max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden auth-card !p-0 shadow-2xl animate-fade-in">
          <div className="shrink-0 px-6 pt-6 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-violet-500/20 text-violet-500">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-app-fg">Assign Project Team</h2>
                  <p className="text-sm text-app-muted truncate">{project.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-app-subtle hover:text-app-fg hover:bg-app-hover transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-app-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Search members..."
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                className="auth-input pl-10"
              />
            </div>

            <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
              {filteredMembers.length === 0 ? (
                <p className="text-sm text-app-subtle italic text-center py-6">No members match your search</p>
              ) : (
                filteredMembers.map((m) => {
                  const isChecked = selectedPickerUserIds.includes(m.userId)
                  const initials = m.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
                  return (
                    <button
                      key={m.userId}
                      type="button"
                      disabled={isPending}
                      onClick={() => handleTogglePickerMember(m.userId)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-app-muted hover:text-app-fg hover:bg-app-hover rounded-xl text-left cursor-pointer transition-all disabled:opacity-50"
                    >
                      <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-400 text-[10px] font-bold border border-violet-500/20 shrink-0">
                        {initials}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-app-fg truncate">{m.name}</p>
                        <p className="text-xs text-app-subtle truncate">{m.email} · {m.role}</p>
                      </div>
                      {isChecked ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <span className="h-4 w-4 border-2 border-app-border rounded-full shrink-0" />
                      )}
                    </button>
                  )
                })
              )}
            </div>

            {selectedPickerUserIds.length > 0 && (
              <div className="border-t border-app-border pt-4 space-y-2">
                <p className="auth-label">Project delete permission</p>
                <p className="text-xs text-app-muted">Only members explicitly enabled here can delete this project. Their workspace role does not grant this access.</p>
                <div className="space-y-2">
                  {selectedPickerUserIds.map((userId) => {
                    const member = workspaceMembers.find((item) => item.userId === userId)
                    if (!member) return null
                    return (
                      <label key={userId} className="flex items-center justify-between gap-3 rounded-xl border border-app-border bg-app-muted-surface px-3 py-2.5 cursor-pointer">
                        <span className="min-w-0 text-sm font-medium text-app-fg truncate">{member.name}</span>
                        <span className="inline-flex shrink-0 items-center gap-2 text-xs font-semibold text-app-muted">
                          <input
                            type="checkbox"
                            checked={deletePermissionUserIds.includes(userId)}
                            onChange={() => toggleDeletePermission(userId)}
                            disabled={isPending}
                            className="h-4 w-4 accent-violet-600"
                          />
                          Can delete
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0 flex items-center justify-between border-t border-app-border px-6 py-4 mt-2 bg-app-surface-solid/80">
            <span className="text-xs text-app-subtle">{selectedPickerUserIds.length} selected</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAssignments}
                disabled={isPending}
                className="btn-primary"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

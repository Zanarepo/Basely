'use client'

import { useState } from 'react'
import { Plus, Upload } from 'lucide-react'
import { StakeholderRegister } from './StakeholderRegister'
import { StakeholderForm } from './StakeholderForm'
import { StakeholderImportModal } from './StakeholderImportModal'
import { ToastContainer, type ToastMessage } from '@/components/dashboard/Toast'

type WorkspaceMember = {
  userId: string
  name: string
  email: string
  role: string
}

type StakeholderWorkspaceProps = {
  projectId: string
  hasEditAccess: boolean
  workspaceMembers: WorkspaceMember[]
}

export default function StakeholderWorkspace({
  projectId,
  hasEditAccess,
  workspaceMembers,
}: StakeholderWorkspaceProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [editingStakeholderId, setEditingStakeholderId] = useState<string | null>(null)
  
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev: ToastMessage[]) => [...prev, { id, type, message }])
  }

  const dismissToast = (id: string) => {
    setToasts((prev: ToastMessage[]) => prev.filter((t: ToastMessage) => t.id !== id))
  }

  const handleEdit = (id: string) => {
    setEditingStakeholderId(id)
    setIsFormOpen(true)
  }

  const handleClose = () => {
    setIsFormOpen(false)
    setEditingStakeholderId(null)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] bg-app-surface-solid rounded-2xl border border-app-border overflow-hidden shadow-sm">
      <div className="flex-none p-4 border-b border-app-border bg-app-surface/50 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-app-fg">Stakeholder Register</h2>
          <p className="text-sm text-app-subtle">
            Manage internal and external stakeholders for this project.
          </p>
        </div>

        {hasEditAccess && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-app-surface hover:bg-app-hover border border-app-border text-app-fg text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Upload className="h-4 w-4" />
              Import CSV
            </button>
            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Stakeholder
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden relative">
        <StakeholderRegister
          projectId={projectId}
          hasEditAccess={hasEditAccess}
          onEdit={handleEdit}
          onShowToast={showToast}
        />
      </div>

      {isFormOpen && (
        <StakeholderForm
          projectId={projectId}
          stakeholderId={editingStakeholderId}
          onClose={handleClose}
          workspaceMembers={workspaceMembers}
          onShowToast={showToast}
        />
      )}

      {isImportModalOpen && (
        <StakeholderImportModal
          projectId={projectId}
          onClose={() => setIsImportModalOpen(false)}
          onShowToast={showToast}
          onSuccess={() => {}}
        />
      )}

      {/* Global Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}

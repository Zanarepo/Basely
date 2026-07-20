'use client'

import { useState } from 'react'
import { Plus, Upload } from 'lucide-react'
import { StakeholderRegister } from './StakeholderRegister'
import { StakeholderForm } from './StakeholderForm'
import { StakeholderImportModal } from './StakeholderImportModal'
import { CrossProjectWorkloadView } from './CrossProjectWorkloadView'
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
  const [currentView, setCurrentView] = useState<'register' | 'workload'>('register')
  
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
    <div className="space-y-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between bg-app-surface-solid p-6 rounded-2xl border border-app-border shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-app-fg">Stakeholders</h2>
          <p className="text-sm text-app-subtle mt-1">
            Manage internal and external stakeholders for this project.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex bg-app-bg border border-app-border rounded-lg p-1">
            <button
              onClick={() => setCurrentView('register')}
              className={`cursor-pointer px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${currentView === 'register' ? 'bg-indigo-600 text-white' : 'text-app-fg hover:bg-app-hover'}`}
            >
              Register
            </button>
            <button
              onClick={() => setCurrentView('workload')}
              className={`cursor-pointer px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${currentView === 'workload' ? 'bg-indigo-600 text-white' : 'text-app-fg hover:bg-app-hover'}`}
            >
              Cross-Project Workload
            </button>
          </div>

          {hasEditAccess && currentView === 'register' && (
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
      </div>

      <div className="min-h-[500px]">
        {currentView === 'register' ? (
          <StakeholderRegister
            projectId={projectId}
            hasEditAccess={hasEditAccess}
            onEdit={handleEdit}
            onShowToast={showToast}
          />
        ) : (
          <CrossProjectWorkloadView projectId={projectId} />
        )}
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

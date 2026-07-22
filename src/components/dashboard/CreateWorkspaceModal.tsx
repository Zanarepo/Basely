'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X, CheckCircle2, Loader2 } from 'lucide-react'
import { CreateOrganizationForm } from '@/components/CreateOrganizationForm'
import { setActiveWorkspace } from '@/lib/workspace/actions'

type Props = {
  open: boolean
  onClose: () => void
}

export function CreateWorkspaceModal({ open, onClose }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  if (!open) return null

  const handleSuccess = (orgId: string) => {
    setSuccessMsg('Workspace created successfully!')
    startTransition(async () => {
      // Set the newly created workspace as active
      await setActiveWorkspace(orgId)
      
      // Delay closing slightly so they can see the success message
      setTimeout(() => {
        setSuccessMsg(null)
        onClose()
        router.refresh()
      }, 1500)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-app-surface w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-app-border">
          <h3 className="text-xl font-bold text-app-fg">Create New Workspace</h3>
          <button 
            onClick={onClose} 
            disabled={isPending || !!successMsg}
            className="text-app-muted hover:text-app-fg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 relative">
          {successMsg ? (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in-95">
              <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500 mb-4">
                {isPending ? (
                  <Loader2 className="w-10 h-10 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-10 h-10" />
                )}
              </div>
              <h4 className="text-lg font-bold text-app-fg mb-1">{successMsg}</h4>
              <p className="text-sm text-app-muted">
                {isPending ? 'Activating workspace...' : 'Switching to your new workspace...'}
              </p>
            </div>
          ) : (
            <CreateOrganizationForm onSuccess={handleSuccess} />
          )}
        </div>
      </div>
    </div>
  )
}

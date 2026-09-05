import { Check, Loader2, Plus, X } from 'lucide-react'
import { useState } from 'react'
import type { WbsStatus } from '@/lib/wbs/constants'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'

type StatusSelectorProps = {
  status: WbsStatus
  setStatus: (val: WbsStatus) => void
  customStatuses: string[]
  onAddCustomStatus: (newStatus: string) => void
  hasEditAccess: boolean
  saving: boolean
  onAutoSaveStatus?: (val: WbsStatus) => Promise<void> | void
}

export function StatusSelector({
  status,
  setStatus,
  customStatuses,
  onAddCustomStatus,
  hasEditAccess,
  saving,
  onAutoSaveStatus
}: StatusSelectorProps) {
  const [isAddingStatus, setIsAddingStatus] = useState(false)
  const [newStatusName, setNewStatusName] = useState('')
  const [isAutoSavingStatus, setIsAutoSavingStatus] = useState(false)

  const handleSaveNewStatus = () => {
    const trimmed = newStatusName.trim()
    if (trimmed) {
      onAddCustomStatus(trimmed)
      setStatus(trimmed as WbsStatus)
    }
    setNewStatusName('')
    setIsAddingStatus(false)
  }

  return (
    <div className="space-y-2">
      <label className="auth-label">Status</label>
      {isAddingStatus ? (
        <div className="flex flex-col gap-2">
          <input
            autoFocus
            type="text"
            placeholder="New Status"
            className="w-full px-3 py-1.5 text-sm bg-app-input border border-violet-500 rounded-lg text-app-fg focus:outline-none focus:ring-1 focus:ring-violet-500"
            value={newStatusName}
            onChange={(e) => setNewStatusName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveNewStatus()}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex-1 flex justify-center items-center py-1.5 bg-violet-500 hover:bg-violet-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
              onClick={handleSaveNewStatus}
            >
              <Check className="w-3 h-3 mr-1" /> Add
            </button>
            <button
              type="button"
              className="flex-1 flex justify-center items-center py-1.5 bg-app-muted-surface hover:bg-app-hover text-app-subtle rounded-lg text-xs font-semibold cursor-pointer"
              onClick={() => setIsAddingStatus(false)}
            >
              <X className="w-3 h-3 mr-1" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 relative">
          <EnterpriseSelect
            value={status}
            onChange={async (val) => {
              setStatus(val as WbsStatus)
              if (onAutoSaveStatus) {
                setIsAutoSavingStatus(true)
                try {
                  await onAutoSaveStatus(val as WbsStatus)
                } finally {
                  setIsAutoSavingStatus(false)
                }
              }
            }}
            options={customStatuses}
            disabled={!hasEditAccess || saving || isAutoSavingStatus}
            size="lg"
            placeholder="Select status..."
          />
          {isAutoSavingStatus && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center bg-app-surface-solid px-2">
              <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />
            </div>
          )}
          {hasEditAccess && !saving && !isAutoSavingStatus && (
            <button
              type="button"
              onClick={() => setIsAddingStatus(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-violet-500 hover:text-violet-600 transition-colors w-max cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              New Status
            </button>
          )}
        </div>
      )}
    </div>
  )
}

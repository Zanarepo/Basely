import { User, FileText, CheckSquare, Plus, Check, X, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { WbsStatus, ChecklistItem } from '@/lib/wbs/constants'
import { WbsChecklist } from './WbsChecklist'

type WbsBasicDetailsProps = {
  name: string
  setName: (val: string) => void
  status: WbsStatus
  setStatus: (val: WbsStatus) => void
  isWorkPackage: boolean
  setIsWorkPackage: React.Dispatch<React.SetStateAction<boolean>>
  description: string
  setDescription: (val: string) => void
  deliverablesData: ChecklistItem[]
  setDeliverablesData: React.Dispatch<React.SetStateAction<ChecklistItem[]>>
  acceptanceCriteriaData: ChecklistItem[]
  setAcceptanceCriteriaData: React.Dispatch<React.SetStateAction<ChecklistItem[]>>
  hasEditAccess: boolean
  canCheckDeliverables?: boolean
  canCheckCriteria?: boolean
  saving: boolean
  workspaceMembers: { userId: string; name: string; email: string }[]
  customStatuses: string[]
  onAddCustomStatus: (newStatus: string) => void
  canAssignMembers?: boolean
  callerRole?: string
  callerUserId?: string
  onAutoSaveDeliverables?: (items: ChecklistItem[]) => void
  onAutoSaveCriteria?: (items: ChecklistItem[]) => void
}

export function WbsBasicDetails({
  name, setName,
  status, setStatus,
  isWorkPackage, setIsWorkPackage,
  description, setDescription,
  deliverablesData, setDeliverablesData,
  acceptanceCriteriaData, setAcceptanceCriteriaData,
  hasEditAccess,
  canCheckDeliverables,
  canCheckCriteria,
  saving,
  customStatuses,
  onAddCustomStatus,
  onAutoSaveDeliverables,
  onAutoSaveCriteria
}: WbsBasicDetailsProps) {
  const [isAddingStatus, setIsAddingStatus] = useState(false)
  const [newStatusName, setNewStatusName] = useState('')
  const [isScopeOpen, setIsScopeOpen] = useState(false)

  const handleSaveNewStatus = () => {
    const trimmed = newStatusName.trim()
    if (trimmed) {
      onAddCustomStatus(trimmed)
      setStatus(trimmed as WbsStatus)
    }
    setNewStatusName('')
    setIsAddingStatus(false)
  }

  // Fallback to hasEditAccess if canCheckDeliverables isn't explicitly passed
  const isCheckboxEnabled = (!saving) && (canCheckDeliverables ?? hasEditAccess)

  return (
    <>
      {/* Name */}
      <div className="space-y-2">
        <label htmlFor="wbs-name" className="auth-label">
          Element Name <span className="text-rose-500">*</span>
        </label>
        <input
          id="wbs-name"
          type="text"
          required
          disabled={!hasEditAccess || saving}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Requirements Gathering"
          className="w-full px-4 py-2.5 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm disabled:opacity-50"
        />
      </div>

      {/* Owner Removed - Handled by RACI */}

      {/* Status & Work Package Toggle */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="auth-label">Status</label>
          {isAddingStatus ? (
             <div className="flex flex-col gap-2">
               <input
                 autoFocus
                 type="text"
                 placeholder="New Status"
                 className="w-full px-3 py-1.5 text-sm bg-app-input border border-indigo-500 rounded-lg text-app-fg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                 value={newStatusName}
                 onChange={(e) => setNewStatusName(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleSaveNewStatus()}
               />
               <div className="flex items-center gap-2">
                 <button
                   type="button"
                   className="flex-1 flex justify-center items-center py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
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
            <div className="flex flex-col gap-2">
              <select
                id="wbs-status"
                disabled={!hasEditAccess || saving}
                value={status}
                onChange={(e) => setStatus(e.target.value as WbsStatus)}
                className="w-full px-3 py-2.5 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 cursor-pointer text-sm disabled:opacity-50"
              >
                {customStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {hasEditAccess && !saving && (
                <button
                  type="button"
                  onClick={() => setIsAddingStatus(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 hover:text-indigo-600 transition-colors w-max cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  New Status
                </button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="auth-label block mb-1">Planning Tier</label>
          <button
            type="button"
            disabled={!hasEditAccess || saving}
            onClick={() => setIsWorkPackage((v) => !v)}
            className={`w-full py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
              isWorkPackage
                ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/35 shadow-xs'
                : 'bg-app-input text-app-muted border-app-border hover:bg-app-hover'
            }`}
          >
            {isWorkPackage ? 'Work Package (Leaf)' : 'Summary Element'}
          </button>
        </div>
      </div>

      {/* Scope & Deliverables Accordion */}
      <div className="border border-app-border rounded-xl overflow-hidden bg-app-surface mt-6">
        <button
          type="button"
          onClick={() => setIsScopeOpen(!isScopeOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-app-surface hover:bg-app-hover transition-colors"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-app-fg">
            <FileText className="w-4 h-4 text-app-muted" />
            Scope & Deliverables
          </div>
          {isScopeOpen ? (
            <ChevronDown className="w-4 h-4 text-app-muted" />
          ) : (
            <ChevronRight className="w-4 h-4 text-app-muted" />
          )}
        </button>
        
        {isScopeOpen && (
          <div className="p-4 border-t border-app-border bg-app-surface-solid space-y-6">
            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="wbs-description" className="auth-label flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-app-subtle" />
                Description
              </label>
              <textarea
                id="wbs-description"
                disabled={!hasEditAccess || saving}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe scope boundaries, key steps, and what this element covers..."
                className="w-full px-4 py-2.5 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 min-h-[90px] resize-none text-xs disabled:opacity-50"
              />
            </div>

            {/* Deliverables (Interactive Checklist) */}
            <WbsChecklist
              title="Tangible Deliverables"
              icon={<CheckSquare className="h-3.5 w-3.5 text-app-subtle" />}
              items={deliverablesData}
              setItems={setDeliverablesData}
              hasEditAccess={hasEditAccess}
              canCheckItems={canCheckDeliverables}
              saving={saving}
              placeholder="E.g., Design Mockups"
              onAutoSave={onAutoSaveDeliverables}
            />

            {/* Acceptance Criteria */}
            <WbsChecklist
              title="Acceptance Criteria"
              icon={<CheckSquare className="h-3.5 w-3.5 text-app-subtle" />}
              items={acceptanceCriteriaData}
              setItems={setAcceptanceCriteriaData}
              hasEditAccess={hasEditAccess}
              canCheckItems={canCheckCriteria}
              saving={saving}
              placeholder="E.g., Passes User Testing"
              onAutoSave={onAutoSaveCriteria}
            />
          </div>
        )}
      </div>
    </>
  )
}

import { User, FileText, CheckSquare } from 'lucide-react'
import type { WbsStatus } from '@/lib/wbs/constants'
import { WBS_STATUSES } from '@/lib/wbs/constants'

type WbsBasicDetailsProps = {
  name: string
  setName: (val: string) => void
  ownerId: string
  setOwnerId: (val: string) => void
  status: WbsStatus
  setStatus: (val: WbsStatus) => void
  isWorkPackage: boolean
  setIsWorkPackage: React.Dispatch<React.SetStateAction<boolean>>
  description: string
  setDescription: (val: string) => void
  deliverables: string
  setDeliverables: (val: string) => void
  acceptanceCriteria: string
  setAcceptanceCriteria: (val: string) => void
  hasEditAccess: boolean
  saving: boolean
  workspaceMembers: { userId: string; name: string; email: string }[]
}

export function WbsBasicDetails({
  name, setName,
  ownerId, setOwnerId,
  status, setStatus,
  isWorkPackage, setIsWorkPackage,
  description, setDescription,
  deliverables, setDeliverables,
  acceptanceCriteria, setAcceptanceCriteria,
  hasEditAccess,
  saving,
  workspaceMembers
}: WbsBasicDetailsProps) {
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

      {/* Owner */}
      <div className="space-y-2">
        <label htmlFor="wbs-owner" className="auth-label flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-app-subtle" />
          Assigned Owner
        </label>
        <select
          id="wbs-owner"
          disabled={!hasEditAccess || saving}
          value={ownerId}
          onChange={(e) => setOwnerId(e.target.value)}
          className="w-full px-3 py-2.5 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 cursor-pointer text-sm disabled:opacity-50"
        >
          <option value="">Unassigned</option>
          {workspaceMembers.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.name} ({m.email})
            </option>
          ))}
        </select>
      </div>

      {/* Status & Work Package Toggle */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="wbs-status" className="auth-label">
            Status
          </label>
          <select
            id="wbs-status"
            disabled={!hasEditAccess || saving}
            value={status}
            onChange={(e) => setStatus(e.target.value as WbsStatus)}
            className="w-full px-3 py-2.5 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 cursor-pointer text-sm disabled:opacity-50"
          >
            {WBS_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
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

      {/* Deliverables (WBS Dictionary terms) */}
      <div className="space-y-2">
        <label htmlFor="wbs-deliverables" className="auth-label flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-app-subtle" />
          Tangible Deliverables
        </label>
        <textarea
          id="wbs-deliverables"
          disabled={!hasEditAccess || saving}
          value={deliverables}
          onChange={(e) => setDeliverables(e.target.value)}
          placeholder="List formal output files, signoffs, physical objects, or assemblies..."
          className="w-full px-4 py-2.5 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 min-h-[75px] resize-none text-xs disabled:opacity-50"
        />
      </div>

      {/* Acceptance Criteria */}
      <div className="space-y-2">
        <label htmlFor="wbs-criteria" className="auth-label flex items-center gap-1.5">
          <CheckSquare className="h-3.5 w-3.5 text-app-subtle" />
          Acceptance Criteria
        </label>
        <textarea
          id="wbs-criteria"
          disabled={!hasEditAccess || saving}
          value={acceptanceCriteria}
          onChange={(e) => setAcceptanceCriteria(e.target.value)}
          placeholder="Define metrics, tests, quality constraints, or conditions that confirm completion..."
          className="w-full px-4 py-2.5 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 min-h-[75px] resize-none text-xs disabled:opacity-50"
        />
      </div>
    </>
  )
}

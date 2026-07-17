'use client'

import { useEffect, useState } from 'react'
import { X, User, FileText, CheckSquare, Settings2, Loader2, Save } from 'lucide-react'
import type { WbsElement, WbsStatus } from '@/lib/wbs/constants'
import { WBS_STATUSES } from '@/lib/wbs/constants'

type WbsElementSidePanelProps = {
  element: WbsElement | null
  workspaceMembers: { userId: string; name: string; email: string }[]
  onClose: () => void
  onSave: (id: string, updates: Partial<WbsElement>) => Promise<boolean>
  hasEditAccess: boolean
}

export function WbsElementSidePanel({
  element,
  workspaceMembers,
  onClose,
  onSave,
  hasEditAccess,
}: WbsElementSidePanelProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [deliverables, setDeliverables] = useState('')
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('')
  const [status, setStatus] = useState<WbsStatus>('Not Started')
  const [isWorkPackage, setIsWorkPackage] = useState(false)
  const [ownerId, setOwnerId] = useState<string>('')
  const [saving, setSaving] = useState(false)

  // Sync state when active element changes
  useEffect(() => {
    if (element) {
      setName(element.name)
      setDescription(element.description ?? '')
      setDeliverables(element.deliverables ?? '')
      setAcceptanceCriteria(element.acceptanceCriteria ?? '')
      setStatus(element.status)
      setIsWorkPackage(element.isWorkPackage)
      setOwnerId(element.ownerId ?? '')
    }
  }, [element])

  if (!element) return null

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasEditAccess) return

    setSaving(true)
    const success = await onSave(element.id, {
      name: name.trim(),
      description: description.trim() || null,
      deliverables: deliverables.trim() || null,
      acceptanceCriteria: acceptanceCriteria.trim() || null,
      status,
      isWorkPackage,
      ownerId: ownerId || null,
    })
    setSaving(false)
    if (success) {
      onClose()
    }
  }

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-app-surface-solid border-l border-app-border shadow-2xl p-6 overflow-y-auto flex flex-col justify-between animate-fade-in-right">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-app-border mb-6">
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-indigo-500" />
            <h3 className="text-lg font-bold text-app-fg">
              WBS Element Details <span className="text-sm font-normal text-app-muted">({element.code})</span>
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-app-subtle hover:text-app-fg hover:bg-app-hover transition-colors cursor-pointer"
            aria-label="Close panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col justify-between">
          <div className="space-y-5">
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
                className="w-full px-4 py-2.5 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
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
                className="w-full px-3 py-2.5 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 cursor-pointer disabled:opacity-50"
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
                  className="w-full px-3 py-2.5 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 cursor-pointer disabled:opacity-50"
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
                  className={`w-full py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${isWorkPackage
                      ? 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/35 shadow-xs'
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
                className="w-full px-4 py-2.5 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 min-h-[90px] resize-none disabled:opacity-50"
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
                className="w-full px-4 py-2.5 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 min-h-[75px] resize-none disabled:opacity-50"
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
                className="w-full px-4 py-2.5 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 min-h-[75px] resize-none disabled:opacity-50"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-6 border-t border-app-border mt-8 flex items-center justify-end gap-3 bg-app-surface-solid">
            <button
              type="button"
              disabled={saving}
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            {hasEditAccess && (
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Dictionary
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  )
}

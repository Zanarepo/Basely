'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { X, Save, Target, Map, ChevronDown, Plus, Loader2 } from 'lucide-react'
import { RoadmapItem } from '@/lib/product-roadmap/types'
import { ROADMAP_THEMES, HORIZONS, Horizon } from '@/lib/product-roadmap/constants'
import { getProjectOkrs, saveRoadmapItem, deleteRoadmapItem, createProjectOkr } from '@/lib/product-roadmap/actions'

interface RoadmapItemModalProps {
  projectId: string
  open: boolean
  onClose: () => void
  item: RoadmapItem | null | 'new'
  onSaved: () => void
}

type OkrObj = { id: string, title: string, status: string }

function CustomDropdown({
  value,
  options,
  onChange,
  placeholder = "Select...",
  renderBottomAction,
  dropdownPosition = "bottom"
}: {
  value: string
  options: { label: string, value: string }[]
  onChange: (val: string) => void
  placeholder?: string
  renderBottomAction?: () => React.ReactNode
  dropdownPosition?: "bottom" | "top"
}) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedLabel = options.find(o => o.value === value)?.label || (value ? value : placeholder)

  return (
    <div className="relative">
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)} 
        className="auth-input pl-3 cursor-pointer w-full text-left flex items-center justify-between"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className={`h-4 w-4 text-app-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setIsOpen(false)} />
          <div 
            className={`absolute z-[100] w-full rounded-xl border border-app-border bg-app-surface-solid shadow-lg py-1 max-h-60 overflow-y-auto custom-scrollbar animate-fade-in-up ${dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'}`} 
            style={{ animationDuration: '0.15s' }}
          >
            {options.length === 0 && !renderBottomAction && (
              <div className="px-4 py-2 text-sm text-app-muted">No options available</div>
            )}
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setIsOpen(false) }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-app-surface-muted transition-colors cursor-pointer ${value === opt.value ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-app-fg font-medium'}`}
              >
                {opt.label}
              </button>
            ))}
            {renderBottomAction && (
              <>
                {options.length > 0 && <div className="h-px bg-app-border my-1" />}
                {renderBottomAction()}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export function RoadmapItemModal({ projectId, open, onClose, item, onSaved }: RoadmapItemModalProps) {
  const isNew = item === 'new'
  const editItem = item !== 'new' ? item : null

  const [isPending, setIsPending] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [okrs, setOkrs] = useState<OkrObj[]>([])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [theme, setTheme] = useState('')
  const [moscowStatus, setMoscowStatus] = useState('')
  const [primaryOkrId, setPrimaryOkrId] = useState('')
  const [horizon, setHorizon] = useState<Horizon>('Backlog')
  const [riceScore, setRiceScore] = useState<number>(0)
  
  const [isAddingOkr, setIsAddingOkr] = useState(false)
  const [newOkrTitle, setNewOkrTitle] = useState('')
  const [isCreatingOkr, setIsCreatingOkr] = useState(false)

  async function handleCreateOkr() {
    if (!newOkrTitle.trim()) return
    setIsCreatingOkr(true)
    const { success, data, error } = await createProjectOkr(projectId, newOkrTitle.trim())
    setIsCreatingOkr(false)
    if (success && data) {
      setOkrs([data, ...okrs])
      setPrimaryOkrId(data.id)
      setIsAddingOkr(false)
      setNewOkrTitle('')
    } else {
      setErrorMsg(error || 'Failed to create OKR')
    }
  }

  useEffect(() => {
    if (open) {
      loadOkrs()
      if (editItem) {
        setTitle(editItem.title || '')
        setDescription(editItem.description || '')
        setTheme(editItem.theme || '')
        setMoscowStatus(editItem.moscow_status || '')
        setPrimaryOkrId(editItem.primary_okr_id || '')
        setHorizon(editItem.horizon || 'Backlog')
        setRiceScore(editItem.rice_score || 0)
      } else {
        setTitle('')
        setDescription('')
        setTheme('')
        setMoscowStatus('')
        setPrimaryOkrId('')
        setHorizon('Backlog')
        setRiceScore(0)
      }
      setErrorMsg('')
    }
  }, [open, editItem, projectId])

  async function loadOkrs() {
    const { success, data } = await getProjectOkrs(projectId)
    if (success && data) {
      setOkrs(data)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setErrorMsg('Title is required')
      return
    }

    setIsPending(true)
    setErrorMsg('')

    const payload = {
      title,
      description,
      theme: theme || null,
      moscow_status: (moscowStatus as any) || null,
      primary_okr_id: primaryOkrId || null,
      horizon: horizon === 'Backlog' ? null : horizon,
      rice_score: riceScore
    }

    const { success, error } = await saveRoadmapItem(
      projectId,
      editItem ? editItem.id : null,
      payload
    )

    setIsPending(false)
    if (success) {
      onSaved()
    } else {
      setErrorMsg(error || 'Failed to save item')
    }
  }

  async function handleDelete() {
    if (!editItem) return
    const confirmed = confirm('Are you sure you want to delete this initiative?')
    if (!confirmed) return

    setIsPending(true)
    const { success, error } = await deleteRoadmapItem(editItem.id)
    setIsPending(false)

    if (success) {
      onSaved()
    } else {
      setErrorMsg(error || 'Failed to delete item')
    }
  }

  const themes = useMemo(() => Object.keys(ROADMAP_THEMES).filter(t => t !== 'Default'), [])
  const moscowOptions = [
    { label: 'Must', value: 'Must' },
    { label: 'Should', value: 'Should' },
    { label: 'Could', value: 'Could' },
    { label: "Won't", value: 'Wont' }
  ]

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative flex w-full max-w-lg max-h-[calc(100vh-2rem)] flex-col overflow-hidden auth-card !p-0 shadow-2xl animate-fade-in">
          {/* Header */}
          <div className="shrink-0 px-6 pt-6 pb-4 border-b border-app-border">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-violet-500/20 text-violet-500">
                  <Map className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-app-fg">
                    {isNew ? 'New Initiative' : 'Edit Initiative'}
                  </h2>
                  <p className="text-sm text-app-muted">
                    {isNew ? 'Add a new item to the roadmap backlog.' : 'Update the details and strategic alignment.'}
                  </p>
                </div>
              </div>
              <button type="button" onClick={onClose} disabled={isPending} className="btn-icon !border-0 !bg-transparent text-app-muted hover:text-app-fg cursor-pointer disabled:cursor-not-allowed" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {errorMsg && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-medium">
                {errorMsg}
              </div>
            )}
          </div>

          {/* Form Content */}
          <div className="overflow-y-auto px-6 py-4 custom-scrollbar flex-1">
            <form id="roadmap-item-form" onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="auth-label">Title <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="auth-input w-full"
                  placeholder="e.g., Q3 Global Onboarding Revamp"
                />
              </div>

              <div>
                <label className="auth-label">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="auth-input w-full min-h-[100px] resize-y"
                  placeholder="Brief description of the initiative..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="auth-label">Theme</label>
                  <CustomDropdown
                    value={theme}
                    options={[{ label: 'Uncategorized', value: '' }, ...themes.map(t => ({ label: t, value: t }))]}
                    onChange={setTheme}
                  />
                </div>

                <div>
                  <label className="auth-label">MoSCoW Status</label>
                  <CustomDropdown
                    value={moscowStatus}
                    options={[{ label: 'None', value: '' }, ...moscowOptions]}
                    onChange={setMoscowStatus}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="auth-label">Horizon</label>
                  <CustomDropdown
                    value={horizon}
                    options={[
                      { label: 'Backlog', value: 'Backlog' },
                      { label: 'Now', value: 'Now' },
                      { label: 'Next', value: 'Next' },
                      { label: 'Later', value: 'Later' }
                    ]}
                    onChange={(val) => setHorizon(val as Horizon)}
                  />
                </div>

                <div>
                  <label className="auth-label">RICE Score (Computed)</label>
                  <input
                    type="number"
                    value={riceScore}
                    disabled
                    className="auth-input w-full opacity-50 cursor-not-allowed bg-app-surface-muted"
                    title="RICE score is automatically computed by the system based on Reach, Impact, Confidence, and Effort"
                  />
                </div>
              </div>

              <div>
                <label className="auth-label flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-indigo-400" />
                  Primary OKR Alignment
                </label>
                <CustomDropdown
                  value={primaryOkrId}
                  options={[{ label: 'None (Standalone)', value: '' }, ...okrs.map(o => ({ label: o.title, value: o.id }))]}
                  onChange={setPrimaryOkrId}
                  dropdownPosition="top"
                  renderBottomAction={() => (
                    <div className="p-2 border-t border-app-border bg-app-surface-solid rounded-b-xl">
                      {isAddingOkr ? (
                        <div className="flex flex-col gap-2 p-3 rounded-xl bg-app-surface-muted border border-app-border">
                          <input 
                            autoFocus
                            className="auth-input text-sm px-3 py-2 w-full" 
                            placeholder="Enter OKR Title..." 
                            value={newOkrTitle}
                            onChange={e => setNewOkrTitle(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleCreateOkr()
                              }
                            }}
                          />
                          <div className="flex justify-end gap-3 mt-1">
                            <button type="button" onClick={() => setIsAddingOkr(false)} className="text-xs font-semibold text-app-muted hover:text-app-fg cursor-pointer">Cancel</button>
                            <button type="button" onClick={handleCreateOkr} disabled={isCreatingOkr} className="text-xs font-bold text-emerald-500 hover:text-emerald-400 disabled:opacity-50 flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed">
                              {isCreatingOkr && <Loader2 className="w-3 h-3 animate-spin" />}
                              Save OKR
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setIsAddingOkr(true) }}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          Add New OKR
                        </button>
                      )}
                    </div>
                  )}
                />
              </div>

            </form>
          </div>

          {/* Footer Actions */}
          <div className="shrink-0 px-6 py-4 border-t border-app-border bg-app-surface-solid flex items-center justify-between">
            <div>
              {!isNew && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="text-sm font-bold text-rose-500 hover:text-rose-400 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  Delete Item
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="btn-secondary cursor-pointer disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="roadmap-item-form"
                disabled={isPending}
                className="btn-primary flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {isPending ? 'Saving...' : 'Save Initiative'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

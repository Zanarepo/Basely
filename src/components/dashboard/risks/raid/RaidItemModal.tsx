'use client'

import { useState, useEffect } from 'react'
import { X, Save, ShieldAlert, AlertCircle, HelpCircle, Link2, AlertTriangle, Calendar, User, GitBranch, Loader2, Search, Check, Folder, Layers } from 'lucide-react'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'
import { upsertRaidEntry, type RaidLogEntry, type RaidCategory, type RaidStatus, type RaidPriority } from '@/lib/raid/actions'
import { getWbsElements } from '@/lib/wbs/actions'
import type { WbsElement } from '@/lib/wbs/constants'

interface RaidItemModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  organizationId: string
  methodology?: 'waterfall' | 'agile' | 'hybrid'
  initialCategory?: RaidCategory
  initialData?: RaidLogEntry | null
  onSuccess?: (entry: RaidLogEntry) => void
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void
}

const CATEGORY_OPTIONS: { value: RaidCategory; label: string; description: string }[] = [
  { value: 'risk', label: '🛡️ Risk (Future Hazard)', description: 'Potential adverse future events affecting cost, schedule, or scope' },
  { value: 'assumption', label: '💡 Assumption (Unverified Belief)', description: 'Critical working belief requiring explicit empirical validation before deadline' },
  { value: 'issue', label: '🔥 Issue (Active Problem)', description: 'Present occurrence currently causing negative impact requiring immediate action' },
  { value: 'dependency', label: '🧩 Dependency (External Blocker)', description: 'Third-party vendor, regulatory, or cross-team deliverable outside direct team control' }
]

const STATUS_OPTIONS: { value: RaidStatus; label: string; description: string }[] = [
  { value: 'open', label: 'Open / Pending', description: 'Active item requiring mitigation or validation' },
  { value: 'in_progress', label: 'In Progress / Actioned', description: 'Mitigation or validation testing underway' },
  { value: 'verified', label: 'Verified True (Assumption)', description: 'Assumption empirically confirmed via testing' },
  { value: 'invalidated', label: 'Invalidated (Failed)', description: 'Assumption proven false; converts to active Risk or Issue' },
  { value: 'mitigated', label: 'Mitigated / Controlled', description: 'Risk exposure neutralized via preventive action' },
  { value: 'closed', label: 'Closed / Fulfilled', description: 'Item fully resolved or external dependency delivered' }
]

const PRIORITY_OPTIONS: { value: RaidPriority; label: string; description: string }[] = [
  { value: 'critical', label: '🚨 Critical Priority', description: 'Immediate threat to project baseline or release date' },
  { value: 'high', label: 'HIGH Priority', description: 'Significant impact on sprint goals or milestones' },
  { value: 'medium', label: 'Medium Priority', description: 'Moderate friction manageable within contingency buffer' },
  { value: 'low', label: 'Low Priority', description: 'Minor observation tracked for PMO audit governance' }
]

export default function RaidItemModal({
  isOpen,
  onClose,
  projectId,
  organizationId,
  methodology = 'hybrid',
  initialCategory = 'risk',
  initialData,
  onSuccess,
  onShowToast
}: RaidItemModalProps) {
  const [category, setCategory] = useState<RaidCategory>(initialData?.category || initialCategory)
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [status, setStatus] = useState<RaidStatus>(initialData?.status || 'open')
  const [priority, setPriority] = useState<RaidPriority>(initialData?.priority || 'medium')
  const [externalOwner, setExternalOwner] = useState(initialData?.external_owner_name || '')
  const [validationDueDate, setValidationDueDate] = useState(initialData?.validation_due_date || '')
  const [targetResolutionDate, setTargetResolutionDate] = useState(initialData?.target_resolution_date || '')
  const [mitigationPlan, setMitigationPlan] = useState(initialData?.mitigation_plan || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Real WBS DB retrieval and multi-select state
  const [wbsElements, setWbsElements] = useState<WbsElement[]>([])
  const [loadingWbs, setLoadingWbs] = useState(false)
  const [wbsSearch, setWbsSearch] = useState('')
  const [selectedWbsIds, setSelectedWbsIds] = useState<string[]>(() => {
    if (!initialData?.linked_wbs_element_id) return []
    return initialData.linked_wbs_element_id
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  })

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setCategory(initialData.category || 'risk')
        setTitle(initialData.title || '')
        setDescription(initialData.description || '')
        setStatus(initialData.status || 'open')
        setPriority(initialData.priority || 'medium')
        setExternalOwner(initialData.external_owner_name || '')
        setValidationDueDate(initialData.validation_due_date || '')
        setTargetResolutionDate(initialData.target_resolution_date || '')
        setMitigationPlan(initialData.mitigation_plan || '')
        if (!initialData.linked_wbs_element_id) {
          setSelectedWbsIds([])
        } else {
          setSelectedWbsIds(
            initialData.linked_wbs_element_id
              .split(',')
              .map(s => s.trim())
              .filter(Boolean)
          )
        }
      } else {
        setCategory(initialCategory || 'risk')
        setTitle('')
        setDescription('')
        setStatus('open')
        setPriority('medium')
        setExternalOwner('')
        setValidationDueDate('')
        setTargetResolutionDate('')
        setMitigationPlan('')
        setSelectedWbsIds([])
      }
      setError(null)
    }
  }, [isOpen, initialData, initialCategory])

  useEffect(() => {
    if (!isOpen || !projectId) return
    let isMounted = true
    const fetchWbs = async () => {
      setLoadingWbs(true)
      const res = await getWbsElements(projectId)
      if (isMounted && res.ok && res.data) {
        setWbsElements(res.data)
      }
      if (isMounted) setLoadingWbs(false)
    }
    fetchWbs()
    return () => { isMounted = false }
  }, [isOpen, projectId])

  if (!isOpen) return null

  const isAssumption = category === 'assumption'
  const isDependency = category === 'dependency'

  const handleToggleWbs = (id: string) => {
    setSelectedWbsIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('A descriptive title is required for PMO audit logging.')
      return
    }
    if (isAssumption && !validationDueDate) {
      setError('Assumptions require a mandatory Validation Due Date to prevent silent baseline failure.')
      return
    }
    if (isDependency && !externalOwner.trim()) {
      setError('External Dependencies require an External Owner Name (e.g., Third-party Vendor or Partner Team).')
      return
    }

    setIsSaving(true)
    setError(null)

    const isUuid = (str?: string) => str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
    const validId = initialData?.id && isUuid(initialData.id) ? initialData.id : undefined

    const payload: Partial<RaidLogEntry> = {
      id: validId,
      organization_id: organizationId,
      project_id: projectId,
      category,
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      external_owner_name: isDependency ? externalOwner.trim() : undefined,
      validation_due_date: isAssumption ? validationDueDate : undefined,
      target_resolution_date: targetResolutionDate || undefined,
      mitigation_plan: mitigationPlan.trim() || undefined,
      linked_wbs_element_id: selectedWbsIds.length > 0 ? selectedWbsIds.join(',') : undefined,
      created_at: initialData?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const res = await upsertRaidEntry(payload)

    setIsSaving(false)
    if (!res.ok) {
      setError(res.error || 'Failed to persist RAID item to Supabase schema.')
      if (onShowToast) onShowToast('error', res.error || 'Failed to save RAID governance item.')
      return
    }

    const savedEntry = (res.data || { ...payload, id: crypto.randomUUID() }) as RaidLogEntry

    if (onShowToast) {
      onShowToast('success', initialData ? 'RAID governance entry updated successfully!' : 'New RAID governance item logged successfully!')
    }
    if (onSuccess) onSuccess(savedEntry)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-app-surface border border-app-border rounded-3xl shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-app-border bg-gradient-to-r from-indigo-600/10 via-purple-600/5 to-transparent sticky top-0 z-10 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 shadow-inner">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-app-fg flex items-center gap-2">
                {initialData ? 'Edit RAID Log Item' : 'Log New RAID Governance Item'}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 uppercase">
                  {category}
                </span>
              </h3>
              <p className="text-xs text-app-muted mt-0.5">
                Executive governance across Risks, Assumptions, Issues & External Cross-Team Dependencies.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-xl text-app-muted hover:text-app-fg hover:bg-app-input border border-transparent hover:border-app-border transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 flex-1 overflow-y-auto">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Top Row: Category & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-app-muted uppercase tracking-wider block mb-2">
                RAID Category Domain
              </label>
              <EnterpriseSelect
                value={category}
                onChange={(val) => setCategory(val as RaidCategory)}
                options={CATEGORY_OPTIONS}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-app-muted uppercase tracking-wider block mb-2">
                Governance Priority Rating
              </label>
              <EnterpriseSelect
                value={priority}
                onChange={(val) => setPriority(val as RaidPriority)}
                options={PRIORITY_OPTIONS}
              />
            </div>
          </div>

          {/* Title input */}
          <div>
            <label className="text-xs font-bold text-app-fg uppercase tracking-wider block mb-1.5">
              Item Summary / Headline <span className="text-indigo-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                isAssumption
                  ? "e.g., Assumption: Legacy API will handle 500+ TPS in JSON format without latency spikes"
                  : isDependency
                  ? "e.g., Dependency: Stripe Beta EU Bank Transfer API Access sign-off from External FinTech Team"
                  : "e.g., Risk: AWS Spot Instance interruption rate might delay background job processing"
              }
              className="w-full px-3.5 py-2 rounded-xl bg-app-input border border-app-border text-app-fg text-xs font-medium focus:ring-1 focus:ring-indigo-500 outline-none"
              required
            />
          </div>

          {/* Conditional Category Smart Fields */}
          <div className="p-4 rounded-2xl bg-app-input/50 border border-app-border/80 space-y-4">
            <span className="text-xs font-black uppercase text-indigo-400 tracking-wider block">
              ⚡ Smart Category Governance Fields ({category.toUpperCase()})
            </span>

            {isAssumption && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                <div>
                  <label className="text-xs font-bold text-amber-400 flex items-center gap-1 mb-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Mandatory Validation Due Date *
                  </label>
                  <input
                    type="date"
                    value={validationDueDate}
                    onChange={(e) => setValidationDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-app-surface border border-amber-500/40 text-app-fg text-xs outline-none cursor-pointer"
                    required
                  />
                  <p className="text-[10px] text-app-subtle mt-1">
                    Unverified assumptions will flag high-priority warnings before milestones.
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold text-app-fg mb-1.5 block">
                    Validation Status
                  </label>
                  <EnterpriseSelect
                    value={status}
                    onChange={(val) => setStatus(val as RaidStatus)}
                    options={STATUS_OPTIONS.filter(o => ['open', 'in_progress', 'verified', 'invalidated'].includes(o.value))}
                  />
                </div>
              </div>
            )}

            {isDependency && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                <div>
                  <label className="text-xs font-bold text-indigo-300 flex items-center gap-1 mb-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-400" /> External Owner / Vendor Team *
                  </label>
                  <input
                    type="text"
                    value={externalOwner}
                    onChange={(e) => setExternalOwner(e.target.value)}
                    placeholder="e.g., Legal Team EU, Stripe External Partner, Hardware Ops"
                    className="w-full px-3.5 py-2 rounded-xl bg-app-surface border border-indigo-500/40 text-app-fg text-xs outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-app-fg mb-1.5 block">
                    Lifecycle Status
                  </label>
                  <EnterpriseSelect
                    value={status}
                    onChange={(val) => setStatus(val as RaidStatus)}
                    options={STATUS_OPTIONS}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-app-fg mb-1.5 block">
                    Target Delivery / Sign-off Date
                  </label>
                  <input
                    type="date"
                    value={targetResolutionDate}
                    onChange={(e) => setTargetResolutionDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-app-surface border border-app-border text-app-fg text-xs outline-none cursor-pointer"
                  />
                </div>
              </div>
            )}

            {(!isAssumption && !isDependency) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-app-fg mb-1.5 block">
                    Lifecycle Status
                  </label>
                  <EnterpriseSelect
                    value={status}
                    onChange={(val) => setStatus(val as RaidStatus)}
                    options={STATUS_OPTIONS}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-app-fg mb-1.5 block">
                    Target Resolution Date
                  </label>
                  <input
                    type="date"
                    value={targetResolutionDate}
                    onChange={(e) => setTargetResolutionDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-app-surface border border-app-border text-app-fg text-xs outline-none cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bidirectional WBS Multi-Select Governance Bridge */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-app-input/50 border border-indigo-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-indigo-400 dark:text-indigo-300 tracking-wider flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-indigo-400" />
                WBS & Deliverable Multi-Linkage ({selectedWbsIds.length} selected)
              </span>
              <span className="text-[10px] font-bold bg-indigo-500/15 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/25">
                Hierarchical Inheritance
              </span>
            </div>
            <p className="text-xs text-app-muted leading-relaxed">
              Tagging a <strong>Parent Container</strong> automatically broadcasts this dependency to all child work packages in the WBS side panel. Tagging a <strong>Work Package</strong> isolates the linkage to that specific deliverable.
            </p>

            {selectedWbsIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedWbsIds.map(id => {
                  const el = wbsElements.find(w => w.id === id)
                  return (
                    <span key={id} className="inline-flex items-center gap-1 text-xs font-bold bg-indigo-600 text-white px-2.5 py-1 rounded-lg shadow-xs animate-in zoom-in-95">
                      <span>{el ? `${el.code} - ${el.name}` : `WBS: ${id}`}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleWbs(id)}
                        className="hover:bg-indigo-700 rounded-full p-0.5 ml-1 transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )
                })}
              </div>
            )}

            {loadingWbs ? (
              <div className="flex items-center justify-center gap-2 py-6 text-xs text-app-muted">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                <span>Retrieving project WBS deliverable hierarchy...</span>
              </div>
            ) : wbsElements.length === 0 ? (
              <div className="p-3 text-center rounded-xl bg-app-surface/50 border border-app-border text-xs text-app-subtle italic">
                No WBS deliverables found in this project database yet. Create WBS items first to enable bidirectional linkage.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" />
                  <input
                    type="text"
                    value={wbsSearch}
                    onChange={(e) => setWbsSearch(e.target.value)}
                    placeholder="Search WBS hierarchy by code or deliverable name..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-app-surface border border-app-border text-xs text-app-fg outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="max-h-44 overflow-y-auto border border-app-border/80 rounded-xl bg-app-surface/60 divide-y divide-app-border/40">
                  {wbsElements
                    .filter(el => !wbsSearch.trim() || el.code.toLowerCase().includes(wbsSearch.toLowerCase()) || el.name.toLowerCase().includes(wbsSearch.toLowerCase()))
                    .map((el) => {
                      const isChecked = selectedWbsIds.includes(el.id)
                      return (
                        <div
                          key={el.id}
                          onClick={() => handleToggleWbs(el.id)}
                          className={`flex items-center justify-between p-2.5 hover:bg-app-hover/60 transition-colors cursor-pointer ${
                            isChecked ? 'bg-indigo-500/10' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden pr-2">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                              isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-app-border bg-app-input'
                            }`}>
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="text-xs font-extrabold text-indigo-400 shrink-0">{el.code}</span>
                            <span className="text-xs font-medium text-app-fg truncate">{el.name}</span>
                          </div>
                          <div className="shrink-0 pl-2">
                            {!el.isWorkPackage ? (
                              <span className="text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold px-1.5 py-0.5 rounded flex items-center gap-1" title="Linking here broadcasts to all child work packages under this parent">
                                <Folder className="w-2.5 h-2.5" /> Parent Container
                              </span>
                            ) : (
                              <span className="text-[10px] bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                <Layers className="w-2.5 h-2.5" /> Work Package
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Detailed description */}
          <div>
            <label className="text-xs font-bold text-app-fg uppercase tracking-wider block mb-1.5">
              Detailed Description & Context
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide background analysis, potential impact on budget/schedule, or trigger circumstances..."
              className="w-full p-3 rounded-xl bg-app-input border border-app-border text-app-fg text-xs outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Mitigation / Validation Plan */}
          <div>
            <label className="text-xs font-bold text-app-fg uppercase tracking-wider block mb-1.5">
              {isAssumption ? 'Empirical Validation Strategy / Success Criteria' : 'Mitigation & Contingency Plan'}
            </label>
            <textarea
              rows={2}
              value={mitigationPlan}
              onChange={(e) => setMitigationPlan(e.target.value)}
              placeholder={
                isAssumption
                  ? "Describe exact synthetic benchmark load tests or user interview validations planned before deadline..."
                  : "Detail proactive risk containment protocols or fallback architectural approaches..."
              }
              className="w-full p-3 rounded-xl bg-app-input border border-app-border text-app-fg text-xs outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-app-border sticky bottom-0 bg-app-surface/95 backdrop-blur-md shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-app-border text-app-fg text-xs font-bold hover:bg-app-input transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Committing to RAID Log...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save RAID Item</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

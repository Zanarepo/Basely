'use client'

import { useState } from 'react'
import { X, Save, ShieldAlert, CheckCircle2, AlertTriangle, Cpu, Layers, Terminal, FileText, Sparkles, HelpCircle, Loader2 } from 'lucide-react'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'
import { saveAdr, type ArchitectureDecisionRecord, type AdrStatus, type AdrDomain } from '@/lib/adr/actions'
import { generateAdrWithAiAction } from '@/lib/adr/ai-adr-actions'
import { AdrRaidExtractor } from './workflow/AdrRaidExtractor'
import { AdrSkillGapPanel } from './workflow/AdrSkillGapPanel'
import { useAdrWorkflow } from './hooks/useAdrWorkflow'

interface AdrStudioModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  organizationId: string
  initialData?: ArchitectureDecisionRecord | null
  tier?: string
  aiEnabled?: boolean
  onSuccess?: (record: ArchitectureDecisionRecord) => void
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void
}

const DOMAIN_OPTIONS: { value: AdrDomain; label: string; description: string }[] = [
  { value: 'backend', label: 'Backend & Services', description: 'Server architecture, APIs, microservices & routing logic' },
  { value: 'frontend', label: 'Frontend & UI/UX', description: 'React framework decisions, state management & UI rendering' },
  { value: 'database', label: 'Database & Storage', description: 'Schema engineering, SQL/NoSQL choices & indexing strategy' },
  { value: 'infrastructure', label: 'Infrastructure & DevOps', description: 'Cloud deployment, Docker containerization & CI/CD pipelines' },
  { value: 'security', label: 'Security & Auth', description: 'Encryption, SSO protocols, RLS policies & vulnerability mitigation' },
  { value: 'ai_data', label: 'Praz-AI & Data Pipelines', description: 'LLM integrations, embedding vector storage & telemetry pipelines' }
]

const STATUS_OPTIONS: { value: AdrStatus; label: string; description: string }[] = [
  { value: 'proposed', label: 'Proposed', description: 'Open for peer review and architectural feedback' },
  { value: 'accepted', label: 'Accepted', description: 'Approved as governing active engineering standard' },
  { value: 'deprecated', label: 'Deprecated', description: 'No longer recommended for new feature implementations' },
  { value: 'superseded', label: 'Superseded', description: 'Replaced by a newer architectural decision record' },
  { value: 'rejected', label: 'Rejected', description: 'Reviewed and declined after technical trade-off evaluation' }
]

export default function AdrStudioModal({
  isOpen,
  onClose,
  projectId,
  organizationId,
  initialData,
  tier = 'free',
  aiEnabled = false,
  onSuccess,
  onShowToast
}: AdrStudioModalProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [status, setStatus] = useState<AdrStatus>(initialData?.status || 'proposed')
  const [domain, setDomain] = useState<AdrDomain>(initialData?.technical_domain || 'backend')
  const [context, setContext] = useState(initialData?.context || '')
  const [decision, setDecision] = useState(initialData?.decision || '')
  const [consequences, setConsequences] = useState(initialData?.consequences || '')
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const adrWorkflow = useAdrWorkflow({
    projectId,
    organizationId,
    tier,
    onShowToast,
  })

  if (!isOpen) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !context.trim() || !decision.trim()) {
      setError('Title, Problem Context, and Technical Decision are required fields.')
      return
    }

    setIsSaving(true)
    setError(null)

    const isUuid = (str?: string) => str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
    const validId = initialData?.id && isUuid(initialData.id) ? initialData.id : undefined

    const payload: Partial<ArchitectureDecisionRecord> = {
      id: validId,
      project_id: projectId,
      organization_id: organizationId,
      title: title.trim(),
      status,
      technical_domain: domain,
      context: context.trim(),
      decision: decision.trim(),
      consequences: consequences.trim(),
      created_at: initialData?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const res = await saveAdr(payload as ArchitectureDecisionRecord)

    setIsSaving(false)
    if (!res.ok) {
      setError(res.error || 'Failed to save ADR to database schema.')
      if (onShowToast) onShowToast('error', res.error || 'Failed to commit Architecture Decision Record.')
      return
    }

    const savedRecord = (res.data || { ...payload, id: crypto.randomUUID() }) as ArchitectureDecisionRecord

    // Auto-trigger skill gap check when ADR is accepted
    if (status === 'accepted' && savedRecord.id && /^[0-9a-f-]{36}$/i.test(savedRecord.id)) {
      adrWorkflow.runSkillGapCheck(savedRecord.id)
    }

    if (onShowToast) {
      onShowToast('success', initialData ? 'ADR record updated successfully!' : 'New Architectural Decision Record committed to ledger!')
    }
    if (onSuccess) onSuccess(savedRecord)
    onClose()
  }

  const handleAiDraft = async () => {
    if (!title.trim()) {
      setError('Please provide at least an ADR Title/Topic before auto-drafting.')
      return
    }

    setIsGenerating(true)
    setError(null)
    
    const res = await generateAdrWithAiAction(projectId, organizationId, title, domain, context)
    
    setIsGenerating(false)
    if (!res.ok || !res.data) {
      setError(res.error || 'Failed to generate ADR using Praz-AI.')
      if (onShowToast) onShowToast('error', 'Praz-AI generation failed.')
      return
    }

    setContext(res.data.context || context)
    setDecision(res.data.decision || decision)
    setConsequences(res.data.consequences || consequences)
    
    if (onShowToast) onShowToast('success', 'Praz-AI successfully drafted the ADR!')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-app-surface border border-app-border rounded-2xl shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-app-border bg-app-surface-solid/80 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-500">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-app-fg flex items-center gap-2">
                {initialData ? 'Edit Architecture Decision Record (ADR)' : 'Author Architecture Decision Record (ADR)'}
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  Engineering Governance
                </span>
              </h2>
              <p className="text-xs text-app-muted mt-0.5">
                Immutable technical ledger for capturing design trade-offs and avoiding architectural drift.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-app-muted hover:text-app-fg hover:bg-app-input transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSave} className="p-6 space-y-6 flex-1">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title & Metadata row */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-app-muted uppercase tracking-wider block">
                  ADR Title / Topic
                </label>
                <div className="relative group">
                  <button
                    type="button"
                    onClick={handleAiDraft}
                    disabled={isGenerating || !title.trim() || (tier !== 'enterprise' && (tier !== 'premium' || !aiEnabled))}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_15px_-3px_rgba(124,58,237,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {isGenerating ? 'Drafting...' : 'Auto-Draft with Praz-AI'}
                    {tier === 'free' && <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">Premium</span>}
                    {tier === 'premium' && !aiEnabled && <span className="ml-1 bg-amber-500/80 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">Locked</span>}
                  </button>
                  {tier === 'free' ? (
                    <div className="absolute top-full right-0 mt-2 w-48 p-2 bg-app-surface border border-app-border rounded-lg shadow-xl text-xs text-app-muted opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      Praz-AI Auto-Drafting is available on Premium and Enterprise plans.
                    </div>
                  ) : tier === 'premium' && !aiEnabled ? (
                    <div className="absolute top-full right-0 mt-2 w-48 p-2 bg-app-surface border border-app-border rounded-lg shadow-xl text-xs text-app-muted opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      Praz-AI Features are currently locked for this workspace. Contact platform support to enable them.
                    </div>
                  ) : null}
                </div>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., ADR-012: Adoption of Redis for Distinguishing Real-time Session Cache"
                className="w-full px-4 py-3 rounded-xl bg-app-input border border-app-border text-app-fg text-sm font-medium focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-app-muted uppercase tracking-wider block mb-2">
                  Technical Domain
                </label>
                <EnterpriseSelect
                  value={domain}
                  onChange={(val) => setDomain(val as AdrDomain)}
                  options={DOMAIN_OPTIONS}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-app-muted uppercase tracking-wider block mb-2">
                  Lifecycle Status
                </label>
                <EnterpriseSelect
                  value={status}
                  onChange={(val) => setStatus(val as AdrStatus)}
                  options={STATUS_OPTIONS}
                />
              </div>
            </div>
          </div>

          <hr className="border-app-border/60" />

          {/* Core ADR Sections */}
          <div className="space-y-6">
            {/* Context */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-app-muted uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-violet-400" />
                  1. Context & Problem Statement
                </label>
                <span className="text-[11px] text-app-subtle">Why is this decision necessary right now?</span>
              </div>
              <textarea
                rows={4}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Describe the technical background, architectural constraints, business scalability requirements, or performance bottlenecks triggering this decision..."
                className="w-full p-4 rounded-xl bg-app-input border border-app-border text-app-fg text-sm leading-relaxed focus:ring-2 focus:ring-violet-500 outline-none transition-all resize-y"
                required
              />
            </div>

            {/* Decision */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-app-muted uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  2. Decision & Architecture Rationale
                </label>
                <span className="text-[11px] text-app-subtle">What architecture did we choose and why?</span>
              </div>
              <textarea
                rows={4}
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                placeholder="State the agreed architectural solution clearly. Detail why this approach outperformed alternative frameworks or design patterns considered during technical review..."
                className="w-full p-4 rounded-xl bg-app-input border border-app-border text-app-fg text-sm leading-relaxed focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-y"
                required
              />
            </div>

            {/* Consequences */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-app-muted uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  3. Consequences & Accepted Technical Trade-offs
                </label>
                <span className="text-[11px] text-app-subtle">What technical debt or maintenance obligation are we taking on?</span>
              </div>
              <textarea
                rows={3}
                value={consequences}
                onChange={(e) => setConsequences(e.target.value)}
                placeholder="Document accepted trade-offs, potential system limitations, required developer training, or future refactoring work necessitated by this choice..."
                className="w-full p-4 rounded-xl bg-app-input border border-app-border text-app-fg text-sm leading-relaxed focus:ring-2 focus:ring-amber-500 outline-none transition-all resize-y"
              />
            </div>
          </div>

          {/* ── Workflow Integrations (shown for accepted ADRs) ── */}
          {(status === 'accepted' || initialData?.status === 'accepted') && initialData?.id && (
            <div className="space-y-2 border border-violet-500/20 rounded-xl p-4 bg-violet-500/5">
              <p className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-3">⚡ Workflow Integrations</p>

              {/* Integration 1 — RAID Extraction */}
              <AdrRaidExtractor
                adrId={initialData.id}
                projectId={projectId}
                organizationId={organizationId}
                tier={tier}
                onSuccess={() => onShowToast?.('success', 'RAID entries added from ADR.')}
                onShowToast={onShowToast}
              />

              {/* Integration 3 — Skill Gap */}
              <AdrSkillGapPanel
                result={adrWorkflow.skillGapResult}
                isLoading={adrWorkflow.isCheckingSkillGap}
                error={adrWorkflow.skillGapError}
                onRunCheck={() => adrWorkflow.runSkillGapCheck(initialData.id)}
                tier={tier}
              />
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-app-border sticky bottom-0 bg-app-surface/90 backdrop-blur-md">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-app-border text-app-fg text-sm font-medium hover:bg-app-input transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-violet-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Saving ADR...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {initialData ? 'Update Record' : 'Commit Record to Ledger'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

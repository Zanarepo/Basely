'use client'

import { useState } from 'react'
import { ShieldCheck, Sparkles, Loader2, AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Check, X } from 'lucide-react'
import { checkWbsAdrCompliance } from '@/lib/adr/ai-adr-workflow-actions'
import { updateWbsLinkedAdrs } from '@/lib/adr/adr-workflow-data'
import type { WbsComplianceResult } from '@/lib/adr/adr-workflow-logic'
import { useAiEntitlements } from '@/hooks/useAiEntitlements'
import { UpgradePromptModal } from '@/components/dashboard/billing/UpgradePromptModal'

interface ProjectAdr {
  id: string
  title: string
  status: string
}

interface WbsAdrAccordionProps {
  wbsElementId: string
  organizationId: string
  projectAdrs: ProjectAdr[]
  linkedAdrIds: string[]
  tier: string
  hasEditAccess: boolean
  onLinkedAdrsChange?: (ids: string[]) => void
}

export function WbsAdrAccordion({
  wbsElementId,
  organizationId,
  projectAdrs,
  linkedAdrIds: initialLinkedAdrIds,
  tier,
  hasEditAccess,
  onLinkedAdrsChange,
}: WbsAdrAccordionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [linkedIds, setLinkedIds] = useState<string[]>(initialLinkedAdrIds)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [complianceResult, setComplianceResult] = useState<WbsComplianceResult | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { checkLimit, recordUsage, isChecking: isCheckingEntitlements, UpgradePromptModalProps } = useAiEntitlements(organizationId)

  const isPremiumOrAbove = tier === 'premium' || tier === 'enterprise'

  const handleToggleAdr = async (adrId: string) => {
    const newIds = linkedIds.includes(adrId)
      ? linkedIds.filter(id => id !== adrId)
      : [...linkedIds, adrId]

    setLinkedIds(newIds)
    onLinkedAdrsChange?.(newIds)
    await updateWbsLinkedAdrs(wbsElementId, newIds)
  }

  const handleRunCompliance = async () => {
    if (!isPremiumOrAbove || isChecking || isCheckingEntitlements) return
    const allowed = await checkLimit('max_ai_generations')
    if (!allowed) return

    setIsChecking(true)
    setError(null)
    setComplianceResult(null)

    const res = await checkWbsAdrCompliance(wbsElementId, organizationId)
    setIsChecking(false)

    if (!res.ok || !res.data) {
      setError(res.error || 'Compliance check failed.')
      return
    }

    setComplianceResult(res.data)
    await recordUsage('generations')
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted': return 'text-green-500 bg-green-500/10 border-green-500/20'
      case 'proposed': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
      case 'rejected': return 'text-red-500 bg-red-500/10 border-red-500/20'
      case 'deprecated': return 'text-orange-500 bg-orange-500/10 border-orange-500/20'
      case 'superseded': return 'text-blue-500 bg-blue-500/10 border-blue-500/20'
      default: return 'text-app-muted bg-app-surface border-app-border'
    }
  }

  const linkedAdrs = projectAdrs.filter(a => linkedIds.includes(a.id))
  
  // Close dropdown if clicked outside could be added, but simple toggle works for now

  return (
    <div className="border border-app-border rounded-xl bg-app-surface overflow-visible">
      {/* Accordion Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-app-surface hover:bg-app-hover transition-colors rounded-xl focus:outline-none"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-app-fg">
          <ShieldCheck className="w-4 h-4 text-violet-400" />
          Architecture Compliance
          {linkedIds.length > 0 && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-violet-500/10 text-[10px] font-bold text-violet-500">
              {linkedIds.length} Linked
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-app-muted" />
        ) : (
          <ChevronRight className="w-4 h-4 text-app-muted" />
        )}
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="p-4 border-t border-app-border bg-app-surface-solid space-y-4 rounded-b-xl overflow-visible">
          {wbsElementId.startsWith('temp-') ? (
            <div className="flex flex-col items-center justify-center p-6 text-center border border-dashed border-app-border rounded-xl bg-app-surface">
              <ShieldCheck className="w-8 h-8 text-app-muted mb-2 opacity-50" />
              <h4 className="text-sm font-semibold text-app-fg">Save Required</h4>
              <p className="text-xs text-app-subtle mt-1 max-w-[280px]">
                Please save this new WBS element before linking Architecture Decisions or running compliance checks.
              </p>
            </div>
          ) : (
            <>
              {/* Dropdown Selector */}
          {hasEditAccess && projectAdrs.length > 0 && (
            <div className="relative z-50">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(v => !v)}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-xl bg-app-input border border-app-border text-xs text-app-fg hover:border-violet-500/50 transition-colors cursor-pointer"
              >
                <span className="flex-1 text-left text-app-muted">Link an ADR to this task...</span>
                <ChevronDown className="w-4 h-4 shrink-0 text-app-muted" />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-app-surface border border-app-border rounded-xl shadow-xl max-h-48 overflow-y-auto">
                  {projectAdrs.map(adr => (
                    <button
                      key={adr.id}
                      type="button"
                      onClick={() => handleToggleAdr(adr.id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-app-hover text-left transition-colors cursor-pointer border-b border-app-border last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-app-fg truncate">{adr.title}</p>
                        <p className="text-[10px] text-app-muted capitalize">{adr.status}</p>
                      </div>
                      {linkedIds.includes(adr.id) && <CheckCircle2 className="w-4 h-4 text-violet-500 shrink-0 ml-2" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Selected ADR Cards */}
          {linkedAdrs.length > 0 && (
            <div className="space-y-2 relative z-10">
              {linkedAdrs.map(adr => (
                <div key={adr.id} className="flex items-start justify-between p-3 rounded-xl border border-app-border bg-app-surface hover:border-violet-500/30 transition-colors group">
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="text-sm font-semibold text-app-fg truncate">{adr.title}</h4>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border mt-1.5 ${getStatusColor(adr.status)}`}>
                      {adr.status.charAt(0).toUpperCase() + adr.status.slice(1)}
                    </span>
                  </div>
                  {hasEditAccess && (
                    <button
                      type="button"
                      onClick={() => handleToggleAdr(adr.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-app-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Unlink ADR"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Verification Section */}
          {linkedAdrs.length > 0 && (
            <div className="pt-4 border-t border-app-border relative z-10">
              {!complianceResult ? (
                <div className="bg-app-surface border border-app-border rounded-xl p-4 flex flex-col items-center justify-center text-center">
                  <ShieldCheck className="w-8 h-8 text-app-muted mb-2 opacity-50" />
                  <h4 className="text-sm font-semibold text-app-fg">Verify Architecture Compliance</h4>
                  <p className="text-xs text-app-subtle mt-1 mb-4 max-w-[280px]">
                    Check if this WBS element aligns with the linked technical decisions using AI.
                  </p>
                  
                  {isPremiumOrAbove ? (
                    <button
                      type="button"
                      onClick={handleRunCompliance}
                      disabled={isChecking || isCheckingEntitlements}
                      className="flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                      {(isChecking || isCheckingEntitlements) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {(isChecking || isCheckingEntitlements) ? 'Verifying Compliance...' : 'Run Compliance Check'}
                    </button>
                  ) : (
                    <>
                      <button 
                        type="button" 
                        onClick={() => checkLimit('max_ai_generations')}
                        className="flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white text-xs font-semibold rounded-xl cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        Upgrade to Verify
                      </button>
                      <UpgradePromptModal {...UpgradePromptModalProps} />
                    </>
                  )}

                  {error && (
                    <p className="text-xs text-red-500 mt-3 font-semibold">{error}</p>
                  )}
                </div>
              ) : (
                <div className="bg-app-surface border border-app-border rounded-xl p-4">
                  <div className="flex items-start gap-3 mb-4">
                    {complianceResult.isCompliant ? (
                      <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 border border-green-500/20">
                        <Check className="w-4 h-4 text-green-500" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-app-fg">
                        {complianceResult.isCompliant ? 'Fully Compliant' : 'Architecture Violations Detected'}
                      </h4>
                      <p className="text-xs text-app-subtle mt-0.5">
                        {complianceResult.isCompliant 
                          ? 'This task aligns perfectly with the linked ADRs.' 
                          : 'This task contradicts the approved technical decisions.'}
                      </p>
                    </div>
                  </div>

                  {!complianceResult.isCompliant && complianceResult.violations.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {complianceResult.violations.map((violation, i) => (
                        <div key={i} className="text-xs p-2.5 rounded-lg bg-red-500/5 border border-red-500/10 text-red-700 dark:text-red-400 font-medium">
                          • {violation.conflict}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-3 bg-violet-500/5 border border-violet-500/10 rounded-xl">
                    <p className="text-xs text-violet-700 dark:text-violet-300">
                      <strong>AI Recommendation:</strong> {complianceResult.violations[0]?.recommendation || complianceResult.summary || 'Ensure the task aligns with linked architecture decisions.'}
                    </p>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setComplianceResult(null)}
                      className="text-xs font-semibold text-app-muted hover:text-app-fg transition-colors cursor-pointer"
                    >
                      Clear Results
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

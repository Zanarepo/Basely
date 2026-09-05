import { FileText, CheckSquare, User, ChevronDown, ChevronRight, Sparkles, Loader2 } from 'lucide-react'
import { useState } from 'react'
import type { ChecklistItem } from '@/lib/wbs/constants'
import { WbsChecklist } from '../WbsChecklist'
import { TerminologyDict } from '@/utils/terminology'

type ScopeDeliverablesAccordionProps = {
  name: string
  description: string
  setDescription: (val: string) => void
  deliverablesData: ChecklistItem[]
  setDeliverablesData: React.Dispatch<React.SetStateAction<ChecklistItem[]>>
  acceptanceCriteriaData: ChecklistItem[]
  setAcceptanceCriteriaData: React.Dispatch<React.SetStateAction<ChecklistItem[]>>
  userStoriesData?: ChecklistItem[]
  setUserStoriesData?: React.Dispatch<React.SetStateAction<ChecklistItem[]>>
  edgeCasesData?: ChecklistItem[]
  setEdgeCasesData?: React.Dispatch<React.SetStateAction<ChecklistItem[]>>
  hasEditAccess: boolean
  canCheckDeliverables?: boolean
  canCheckCriteria?: boolean
  saving: boolean
  terms: TerminologyDict
  isChecking: boolean
  checkLimit: (limit: any) => Promise<boolean>
  recordUsage: (metric: any, count?: number) => Promise<void>
  onAutoSaveDeliverables?: (items: ChecklistItem[]) => void
  onAutoSaveCriteria?: (items: ChecklistItem[]) => void
  onAutoSaveUserStories?: (items: ChecklistItem[]) => void
  onAutoSaveEdgeCases?: (items: ChecklistItem[]) => void
}

export function ScopeDeliverablesAccordion({
  name,
  description,
  setDescription,
  deliverablesData,
  setDeliverablesData,
  acceptanceCriteriaData,
  setAcceptanceCriteriaData,
  userStoriesData = [],
  setUserStoriesData,
  edgeCasesData = [],
  setEdgeCasesData,
  hasEditAccess,
  canCheckDeliverables,
  canCheckCriteria,
  saving,
  terms,
  isChecking,
  checkLimit,
  recordUsage,
  onAutoSaveDeliverables,
  onAutoSaveCriteria,
  onAutoSaveUserStories,
  onAutoSaveEdgeCases
}: ScopeDeliverablesAccordionProps) {
  const [isScopeOpen, setIsScopeOpen] = useState(false)
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)

  const handleAiGenerateScope = async () => {
    if (!name.trim() || isGeneratingAi || isChecking) return
    const allowed = await checkLimit('max_ai_generations')
    if (!allowed) return

    setIsGeneratingAi(true)
    try {
      const { generateScopeDetailsWithAiAction } = await import('@/lib/wbs/ai-actions')
      const result = await generateScopeDetailsWithAiAction(name, description)

      if (result.ok && result.data) {
        const res = result.data
        if (res.tangible_deliverables?.length) {
          const newDel: ChecklistItem[] = res.tangible_deliverables.map((text, i) => ({
            id: `del_ai_${i}_${Date.now()}`,
            text,
            completed: false
          }))
          setDeliverablesData(newDel)
          onAutoSaveDeliverables?.(newDel)
        }

        if (res.acceptance_criteria?.length) {
          const newCrit: ChecklistItem[] = res.acceptance_criteria.map((text, i) => ({
            id: `acc_ai_${i}_${Date.now()}`,
            text,
            completed: false
          }))
          setAcceptanceCriteriaData(newCrit)
          onAutoSaveCriteria?.(newCrit)
        }
        await recordUsage('generations')
      } else {
        console.error('Failed to generate scope details:', result.error)
      }
      setIsScopeOpen(true)
    } catch (err) {
      console.error('Failed to Praz-AI generate scope details:', err)
    } finally {
      setIsGeneratingAi(false)
    }
  }

  // Fallback to hasEditAccess if canCheckDeliverables isn't explicitly passed
  const isCheckboxEnabled = (!saving) && (canCheckDeliverables ?? hasEditAccess)

  return (
    <div className="border border-app-border rounded-xl overflow-hidden bg-app-surface mt-6">
      <div className="w-full flex items-center justify-between px-4 py-3 bg-app-surface hover:bg-app-hover transition-colors">
        <button
          type="button"
          onClick={() => setIsScopeOpen(!isScopeOpen)}
          className="flex items-center gap-2 text-sm font-semibold text-app-fg focus:outline-none"
        >
          <FileText className="w-4 h-4 text-app-muted" />
          <span>Scope & Deliverables</span>
          {isScopeOpen ? (
            <ChevronDown className="w-4 h-4 text-app-muted" />
          ) : (
            <ChevronRight className="w-4 h-4 text-app-muted" />
          )}
        </button>

        {hasEditAccess && (
          <button
            type="button"
            disabled={isGeneratingAi || !name.trim()}
            onClick={(e) => {
              e.stopPropagation()
              handleAiGenerateScope()
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-linear-to-r from-violet-500/10 to-indigo-500/10 text-violet-600 dark:text-violet-400 hover:from-violet-500/20 hover:to-indigo-500/20 border border-violet-500/30 transition-all disabled:opacity-50 cursor-pointer"
            title="Auto-generate Tangible Deliverables and Acceptance Criteria with Praz-AI"
          >
            {isGeneratingAi ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                <span>Auto-Fill Praz-AI</span>
              </>
            )}
          </button>
        )}
      </div>
      
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
              className="w-full px-4 py-2.5 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 min-h-[90px] resize-none text-xs disabled:opacity-50"
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
            canCheckItems={isCheckboxEnabled || canCheckCriteria}
            saving={saving}
            placeholder="E.g., Passes User Testing"
            onAutoSave={onAutoSaveCriteria}
          />

          {/* User Stories (Agile Focus) */}
          {terms.iteration !== 'Phase' && (
            <WbsChecklist
              title="User Stories"
              icon={<User className="h-3.5 w-3.5 text-app-subtle" />}
              items={userStoriesData}
              setItems={setUserStoriesData || setDeliverablesData}
              hasEditAccess={hasEditAccess}
              canCheckItems={isCheckboxEnabled || canCheckCriteria}
              saving={saving}
              placeholder="As a [user], I want..."
              onAutoSave={onAutoSaveUserStories}
            />
          )}

          {/* Edge Cases (Agile Focus) */}
          {terms.iteration !== 'Phase' && (
            <WbsChecklist
              title="Edge Cases"
              icon={<CheckSquare className="h-3.5 w-3.5 text-app-subtle" />}
              items={edgeCasesData}
              setItems={setEdgeCasesData || setDeliverablesData}
              hasEditAccess={hasEditAccess}
              canCheckItems={isCheckboxEnabled || canCheckCriteria}
              saving={saving}
              placeholder="E.g., If API returns 500..."
              onAutoSave={onAutoSaveEdgeCases}
            />
          )}
        </div>
      )}
    </div>
  )
}

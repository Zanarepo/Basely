import { Sparkles, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import EnterpriseSelect from '@/components/common/EnterpriseSelect'
import { TerminologyDict } from '@/utils/terminology'

type EstimationFieldsProps = {
  name: string
  description: string
  priority?: string | null
  setPriority?: (val: string | null) => void
  storyPoints?: number | null
  setStoryPoints?: (val: number | null) => void
  requiredSkills?: string[]
  setRequiredSkills?: (val: string[]) => void
  hasEditAccess: boolean
  saving: boolean
  terms: TerminologyDict
  isChecking: boolean
  checkLimit: (limit: any) => Promise<boolean>
  recordUsage: (metric: any, count?: number) => Promise<void>
  onShowToast?: (type: 'success' | 'error' | 'info', msg: string) => void
  onAutoSavePriority?: (val: string | null) => void
  onAutoSaveStoryPoints?: (val: number | null) => void
  onAutoSaveRequiredSkills?: (val: string[]) => void
}

export function EstimationFields({
  name,
  description,
  priority,
  setPriority,
  storyPoints,
  setStoryPoints,
  requiredSkills = [],
  setRequiredSkills,
  hasEditAccess,
  saving,
  terms,
  isChecking,
  checkLimit,
  recordUsage,
  onShowToast,
  onAutoSavePriority,
  onAutoSaveStoryPoints,
  onAutoSaveRequiredSkills
}: EstimationFieldsProps) {
  const [isEstimatingAi, setIsEstimatingAi] = useState(false)
  const [isEstimatingSkillsAi, setIsEstimatingSkillsAi] = useState(false)
  const [skillsInputValue, setSkillsInputValue] = useState(requiredSkills.join(', '))

  useEffect(() => {
    setSkillsInputValue(requiredSkills.join(', '))
  }, [requiredSkills])

  const handleAiEstimateStoryPoints = async () => {
    if (!name.trim() || isEstimatingAi || isChecking) return
    
    setIsEstimatingAi(true)
    try {
      const allowed = await checkLimit('max_ai_generations')
      if (!allowed) return

      const { estimateStoryPointsWithAiAction } = await import('@/lib/wbs/ai-actions')
      const result = await estimateStoryPointsWithAiAction(name, description)
      if (result.ok && result.data) {
        const estimatedPoints = result.data.story_points
        setStoryPoints?.(estimatedPoints)
        onAutoSaveStoryPoints?.(estimatedPoints)
        onShowToast?.('success', `Story points estimated at ${estimatedPoints}`)
        await recordUsage('generations')
      } else {
        console.error('Failed to estimate story points:', result.error)
        onShowToast?.('error', 'Failed to estimate story points')
      }
    } catch (err) {
      console.error('Failed to Praz-AI estimate story points:', err)
      onShowToast?.('error', 'Failed to estimate story points')
    } finally {
      setIsEstimatingAi(false)
    }
  }

  const handleAiEstimateSkills = async () => {
    if (!name.trim() || isEstimatingSkillsAi || isChecking) return
    
    setIsEstimatingSkillsAi(true)
    try {
      const allowed = await checkLimit('max_ai_generations')
      if (!allowed) return

      const { estimateRequiredSkillsWithAiAction } = await import('@/lib/wbs/ai-actions')
      const result = await estimateRequiredSkillsWithAiAction(name, description)
      if (result.ok && result.data) {
        const estimatedSkills = result.data.required_skills
        setRequiredSkills?.(estimatedSkills)
        setSkillsInputValue(estimatedSkills.join(', '))
        onAutoSaveRequiredSkills?.(estimatedSkills)
        onShowToast?.('success', `Required skills estimated`)
        await recordUsage('generations')
      } else {
        console.error('Failed to estimate required skills:', result.error)
        onShowToast?.('error', 'Failed to estimate required skills')
      }
    } catch (err) {
      console.error('Failed to Praz-AI estimate required skills:', err)
      onShowToast?.('error', 'Failed to estimate required skills')
    } finally {
      setIsEstimatingSkillsAi(false)
    }
  }

  return (
    <>
      <div className={`grid ${terms.iteration === 'Phase' ? 'grid-cols-1' : 'grid-cols-2'} gap-4 mt-4`}>
        <div className="space-y-2">
          <label className="auth-label">Priority</label>
          <EnterpriseSelect
            value={priority || 'None'}
            onChange={(val) => {
              const newVal = val === 'None' ? null : val
              setPriority?.(newVal)
              onAutoSavePriority?.(newVal)
            }}
            options={['Critical', 'High', 'Medium', 'Low', 'None']}
            disabled={!hasEditAccess || saving}
            size="lg"
            placeholder="Select priority..."
          />
        </div>
        
        {terms.iteration !== 'Phase' && (
          <div className="space-y-2">
            <label className="auth-label">Story Points</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="0.5"
                value={storyPoints === null ? '' : storyPoints}
                onChange={(e) => {
                  const val = e.target.value === '' ? null : Number(e.target.value)
                  setStoryPoints?.(val)
                }}
                onBlur={() => {
                  onAutoSaveStoryPoints?.(storyPoints ?? null)
                }}
                disabled={!hasEditAccess || saving || isEstimatingAi}
                placeholder="e.g. 5"
                className="w-full px-4 py-2 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm disabled:opacity-50"
              />
              {hasEditAccess && (
                <button
                  type="button"
                  onClick={handleAiEstimateStoryPoints}
                  disabled={isEstimatingAi || isChecking}
                  className="shrink-0 flex items-center justify-center w-10 bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 rounded-xl border border-violet-500/20 transition-all disabled:opacity-50 cursor-pointer"
                  title="AI Estimate Story Points"
                >
                  {isEstimatingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2 mt-4">
        <label className="auth-label">Required Skills (Comma separated)</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={skillsInputValue}
            onChange={(e) => {
              setSkillsInputValue(e.target.value)
            }}
            onBlur={() => {
              const val = skillsInputValue.split(',').map(s => s.trim()).filter(Boolean)
              setRequiredSkills?.(val)
              onAutoSaveRequiredSkills?.(val)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = skillsInputValue.split(',').map(s => s.trim()).filter(Boolean)
                setRequiredSkills?.(val)
                onAutoSaveRequiredSkills?.(val)
              }
            }}
            disabled={!hasEditAccess || saving}
            placeholder="e.g. frontend, react, data_science"
            className="w-full px-4 py-2 bg-app-input border border-app-border rounded-xl text-app-fg focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all text-sm disabled:opacity-50"
          />
          {hasEditAccess && (
            <button
              type="button"
              onClick={handleAiEstimateSkills}
              disabled={isEstimatingSkillsAi || isChecking}
              className="shrink-0 flex items-center justify-center w-10 bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 rounded-xl border border-violet-500/20 transition-all disabled:opacity-50 cursor-pointer"
              title="AI Estimate Required Skills"
            >
              {isEstimatingSkillsAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            </button>
          )}
        </div>
        <p className="text-xs text-app-subtle">
          Used by AI Skill Gap Analysis to predict team capacity bottlenecks.
        </p>
      </div>
    </>
  )
}

import { useState } from 'react'
import { Sparkles, MousePointer2, GitBranch, ArrowRight, BookOpen, Loader2, Users } from 'lucide-react'
import { DocumentTemplate } from '@/lib/documents/types'
import { generateFullStakeholderRegisterAction } from '@/lib/stakeholders/ai-stakeholder-actions'
import { AiHoverBannerWrapper } from '../AiHoverBannerWrapper'

interface AiStakeholderRegisterBannerProps {
  projectId: string
  organizationId: string
  template: DocumentTemplate
  onGenerated: (data: Record<string, string>) => void
  onShowToast: (type: 'success' | 'error', msg: string) => void
}

export default function AiStakeholderRegisterBanner({
  projectId,
  organizationId,
  template,
  onGenerated,
  onShowToast
}: AiStakeholderRegisterBannerProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleAutoGenerate = async () => {
    setIsGenerating(true)
    onShowToast('success', 'Praz-AI is analyzing Charter, Scope, and PRD...')

    const templateKeys = template.section_definitions.map(s => s.key)
    const result = await generateFullStakeholderRegisterAction(organizationId, projectId, templateKeys)

    setIsGenerating(false)
    if (result.ok && result.data) {
      onShowToast('success', 'Stakeholder Register successfully generated!')
      onGenerated(result.data)
      
      // Dispatch event to force data-bound components to refresh if needed
      window.dispatchEvent(new Event('snapshot-saved')) 
    } else {
      onShowToast('error', result.error || 'Failed to generate Stakeholder Register')
    }
  }

  return (
    <AiHoverBannerWrapper
      widthClass="w-[450px]"
      trigger={
        <button
          type="button"
          onClick={handleAutoGenerate}
          disabled={isGenerating}
          className="cursor-pointer px-3 py-1.5 rounded-md text-xs font-bold bg-violet-600/10 hover:bg-violet-600/20 text-violet-600 dark:text-violet-400 border border-violet-600/20 transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MousePointer2 className="w-4 h-4" />}
          {isGenerating ? 'Synthesizing Documents...' : 'Auto-generate Register from Context'}
        </button>
      }
    >
      <div className="bg-gradient-to-r from-violet-600/10 via-fuchsia-600/10 to-white dark:to-slate-900 border border-violet-500/20 px-5 py-4 rounded-xl flex items-start gap-3 shadow-xl backdrop-blur-md">
        <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0 border border-violet-500/30">
          <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-app-fg text-sm flex items-center gap-2">
            Stakeholder Automation Bridge
            <span className="bg-violet-600 text-white text-[10px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded">Praz-AI</span>
          </h3>
          <p className="text-xs text-app-muted mt-1 max-w-2xl leading-relaxed">
            Automatically discover stakeholders and generate all document sections by analyzing the <strong>Project Charter</strong>, <strong>Scope Statement</strong>, and <strong>PRD</strong>.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] font-medium text-app-muted">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3 h-3" />
              <span>Reads: Charter</span>
            </div>
            <ArrowRight className="w-3 h-3 mx-0.5" />
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3 h-3" />
              <span>Scope</span>
            </div>
            <ArrowRight className="w-3 h-3 mx-0.5" />
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3 h-3" />
              <span>PRD</span>
            </div>
          </div>
        </div>
      </div>
    </AiHoverBannerWrapper>
  )
}

import { Sparkles, MousePointer2, GitBranch, ArrowRight, BookOpen, Loader2 } from 'lucide-react'
import { DocumentTemplate } from '@/lib/documents/types'
import { useAutoGenerateCharter } from '../hooks/useAutoGenerateCharter'
import { AiHoverBannerWrapper } from './AiHoverBannerWrapper'
import { UpgradePromptModal } from '@/components/dashboard/billing/UpgradePromptModal'

interface CharterInitiationBannerProps {
  projectId: string
  organizationId: string
  template: DocumentTemplate
  onGenerated: (data: Record<string, string>) => void
  onShowToast: (type: 'success' | 'error', msg: string) => void
}

export default function CharterInitiationBanner({
  projectId,
  organizationId,
  template,
  onGenerated,
  onShowToast
}: CharterInitiationBannerProps) {
  const { isGenerating, handleAutoGenerate, UpgradePromptModalProps } = useAutoGenerateCharter({
    projectId,
    organizationId,
    template,
    onShowToast,
    onGenerated
  })

  return (
    <>
      <AiHoverBannerWrapper
        widthClass="w-[400px]"
        trigger={
          <button
            type="button"
            onClick={handleAutoGenerate}
            disabled={isGenerating}
            className="cursor-pointer px-3 py-1.5 rounded-md text-xs font-bold bg-violet-600/10 hover:bg-violet-600/20 text-violet-600 dark:text-violet-400 border border-violet-600/20 transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MousePointer2 className="w-4 h-4" />}
            {isGenerating ? 'Synthesizing Documents...' : 'Auto-generate Charter from Context'}
          </button>
        }
      >
        <div className="bg-gradient-to-r from-violet-600/10 via-fuchsia-600/10 to-white dark:to-slate-900 border border-violet-500/20 px-5 py-4 rounded-xl flex items-start gap-3 shadow-xl backdrop-blur-md">
          <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0 border border-violet-500/30">
            <GitBranch className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-app-fg text-sm flex items-center gap-2">
              Project Initiation Bridge
              <span className="bg-violet-600 text-white text-[10px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded">Praz-AI</span>
            </h3>
            <p className="text-xs text-app-muted mt-1 max-w-2xl leading-relaxed">
              The Charter serves as the formal authorization for this project. Praz-AI can automatically draft the initial version by synthesizing the approved <strong>Business Case</strong> and <strong>Feasibility Study</strong>.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] font-medium text-app-muted">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3 h-3" />
                <span>Reads: Business Case</span>
              </div>
              <ArrowRight className="w-3 h-3 mx-0.5" />
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3 h-3" />
                <span>Feasibility Study</span>
              </div>
            </div>
          </div>
        </div>
      </AiHoverBannerWrapper>
      <UpgradePromptModal {...UpgradePromptModalProps} />
    </>
  )
}

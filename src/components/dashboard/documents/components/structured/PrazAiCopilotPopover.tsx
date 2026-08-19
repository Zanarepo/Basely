import React from 'react'
import { createPortal } from 'react-dom'
import {
  Sparkles,
  Wand2,
  Send,
  List,
  TrendingUp,
  Users,
  Table,
  Compass,
  Briefcase,
  AlertTriangle,
  Target,
  Dices,
  ShieldCheck,
  CheckSquare,
  FileText,
  Loader2
} from 'lucide-react'
import { AiCopilotMode } from '@/lib/documents/ai-copilot-actions'

interface PrazAiCopilotPopoverProps {
  isAiLoading?: boolean
  showAiPopover: boolean
  isMounted: boolean
  popoverPos: { top: number; left: number }
  aiPopoverRef: React.RefObject<HTMLDivElement | null>
  aiButtonRef: React.RefObject<HTMLButtonElement | null>
  customPrompt: string
  setCustomPrompt: (val: string) => void
  handleToggleAiPopover: () => void
  setShowAiPopover: (show: boolean) => void
  isMarketResearchContext: boolean
  isRoadmapContext: boolean
  isStrategyContext: boolean
  onRunAiCopilot?: (mode: AiCopilotMode, customInstruction?: string) => void
}

export function PrazAiCopilotPopover({
  isAiLoading,
  showAiPopover,
  isMounted,
  popoverPos,
  aiPopoverRef,
  aiButtonRef,
  customPrompt,
  setCustomPrompt,
  handleToggleAiPopover,
  setShowAiPopover,
  isMarketResearchContext,
  isRoadmapContext,
  isStrategyContext,
  onRunAiCopilot,
}: PrazAiCopilotPopoverProps) {
  return (
    <div className="relative" ref={aiPopoverRef}>
      <button
        ref={aiButtonRef}
        type="button"
        style={{ cursor: 'pointer' }}
        disabled={isAiLoading}
        onClick={handleToggleAiPopover}
        className="px-2.5 py-1 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
        title="Praz-AI Section Copilot & Text Transformations"
      >
        {isAiLoading ? (
          <Loader2 className="w-3.5 h-3.5 text-violet-500 animate-spin" />
        ) : (
          <Sparkles className="w-3.5 h-3.5 text-violet-500" />
        )}
        <span>{isAiLoading ? 'Praz-AI Working...' : 'Praz-AI'}</span>
      </button>

      {showAiPopover && isMounted && createPortal(
        <div
          ref={aiPopoverRef}
          style={{
            position: 'fixed',
            top: `${popoverPos.top}px`,
            left: `${popoverPos.left}px`,
            zIndex: 99999,
          }}
          className="w-80 max-h-[60vh] overflow-y-auto custom-scrollbar p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl space-y-1.5 ring-1 ring-black/10 animate-in fade-in zoom-in-95"
        >
          <div className="flex items-center justify-between px-1 py-1 border-b border-slate-100 dark:border-slate-800 mb-1">
            <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-violet-500" />
              Praz-AI Copilot
            </span>
            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
              {isMarketResearchContext
                ? 'Market Research Mode'
                : isRoadmapContext
                ? 'Roadmap Strategy Mode'
                : isStrategyContext
                ? 'Product Strategy Mode'
                : 'Product Specs Mode'}
            </span>
          </div>

          <div className="p-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1.5 mb-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-app-muted uppercase tracking-wider flex items-center gap-1">
                <Wand2 className="w-3 h-3 text-violet-500" />
                Type Custom Prompt
              </span>
            </div>
            <div className="relative flex items-center">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customPrompt.trim()) {
                    e.preventDefault()
                    onRunAiCopilot?.('polish', customPrompt.trim())
                    setShowAiPopover(false)
                    setCustomPrompt('')
                  }
                }}
                placeholder="Type instruction (e.g. Rewrite concise, add 3 risks)..."
                className="w-full pl-2.5 pr-8 py-1.5 text-xs rounded-lg bg-white dark:bg-app-surface border border-app-border text-app-fg placeholder:text-app-muted focus:outline-hidden focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 font-sans"
              />
              <button
                type="button"
                style={{ cursor: 'pointer' }}
                disabled={!customPrompt.trim()}
                onClick={() => {
                  if (customPrompt.trim()) {
                    onRunAiCopilot?.('polish', customPrompt.trim())
                    setShowAiPopover(false)
                    setCustomPrompt('')
                  }
                }}
                className="absolute right-1 p-1 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Run Custom Instruction"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <button
            type="button"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              onRunAiCopilot?.('bullets')
              setShowAiPopover(false)
            }}
            className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold hover:bg-violet-500/10 text-app-fg transition-colors cursor-pointer text-left"
          >
            <List className="w-4 h-4 text-violet-500 shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-xs">Convert to Bullet Points</span>
              <span className="text-[10px] text-app-muted">Format paragraphs into clean bullets</span>
            </div>
          </button>

          {isMarketResearchContext ? (
            <>
              <button
                type="button"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  onRunAiCopilot?.('market_tam_sam_som')
                  setShowAiPopover(false)
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold hover:bg-violet-500/10 text-app-fg transition-colors cursor-pointer text-left"
              >
                <TrendingUp className="w-4 h-4 text-violet-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-bold text-xs">Calculate TAM / SAM / SOM</span>
                  <span className="text-[10px] text-app-muted">Top-down & bottom-up sizing calculations</span>
                </div>
              </button>

              <button
                type="button"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  onRunAiCopilot?.('market_icp_segmentation')
                  setShowAiPopover(false)
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold hover:bg-violet-500/10 text-app-fg transition-colors cursor-pointer text-left"
              >
                <Users className="w-4 h-4 text-indigo-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-bold text-xs">Define ICP & Personas</span>
                  <span className="text-[10px] text-app-muted">Firmographics, Buyer/User & Anti-Persona</span>
                </div>
              </button>

              <button
                type="button"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  onRunAiCopilot?.('market_competitor_edge')
                  setShowAiPopover(false)
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold hover:bg-violet-500/10 text-app-fg transition-colors cursor-pointer text-left"
              >
                <Table className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-bold text-xs">Extract Competitor Matrix & Edge</span>
                  <span className="text-[10px] text-app-muted">Strengths, weaknesses & defensibility edge</span>
                </div>
              </button>

              <button
                type="button"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  onRunAiCopilot?.('market_swot_insights')
                  setShowAiPopover(false)
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold hover:bg-violet-500/10 text-app-fg transition-colors cursor-pointer text-left"
              >
                <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-bold text-xs">Synthesize SWOT & Recommendations</span>
                  <span className="text-[10px] text-app-muted">SWOT matrix & strategic responses</span>
                </div>
              </button>
            </>
          ) : isRoadmapContext ? (
            <>
              <button
                type="button"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  onRunAiCopilot?.('roadmap_horizons')
                  setShowAiPopover(false)
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold hover:bg-violet-500/10 text-app-fg transition-colors cursor-pointer text-left"
              >
                <Compass className="w-4 h-4 text-violet-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-bold text-xs">Sequence Now / Next / Later</span>
                  <span className="text-[10px] text-app-muted">Group initiatives into time horizons & outcomes</span>
                </div>
              </button>

              <button
                type="button"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  onRunAiCopilot?.('roadmap_themes')
                  setShowAiPopover(false)
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold hover:bg-violet-500/10 text-app-fg transition-colors cursor-pointer text-left"
              >
                <Briefcase className="w-4 h-4 text-indigo-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-bold text-xs">Cluster Strategic Themes</span>
                  <span className="text-[10px] text-app-muted">Group features into business & customer pillars</span>
                </div>
              </button>

              <button
                type="button"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  onRunAiCopilot?.('roadmap_risks')
                  setShowAiPopover(false)
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold hover:bg-violet-500/10 text-app-fg transition-colors cursor-pointer text-left"
              >
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-bold text-xs">Extract Risks & Dependencies</span>
                  <span className="text-[10px] text-app-muted">Cross-team bottlenecks & technical risks</span>
                </div>
              </button>

              <button
                type="button"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  onRunAiCopilot?.('roadmap_outcomes')
                  setShowAiPopover(false)
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold hover:bg-violet-500/10 text-app-fg transition-colors cursor-pointer text-left"
              >
                <Target className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-bold text-xs">Define Outcome Metrics</span>
                  <span className="text-[10px] text-app-muted">Convert deliverables to customer & business metrics</span>
                </div>
              </button>
            </>
          ) : isStrategyContext ? (
            <>
              <button
                type="button"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  onRunAiCopilot?.('value_prop')
                  setShowAiPopover(false)
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold hover:bg-violet-500/10 text-app-fg transition-colors cursor-pointer text-left"
              >
                <Target className="w-4 h-4 text-indigo-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-bold text-xs">Sharpen Value Prop & Positioning</span>
                  <span className="text-[10px] text-app-muted">Formulate ICP, benefit & differentiator</span>
                </div>
              </button>

              <button
                type="button"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  onRunAiCopilot?.('strategic_bets')
                  setShowAiPopover(false)
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold hover:bg-violet-500/10 text-app-fg transition-colors cursor-pointer text-left"
              >
                <Dices className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-bold text-xs">Formulate Strategic Bets</span>
                  <span className="text-[10px] text-app-muted">Hypotheses, outcomes & kill criteria</span>
                </div>
              </button>

              <button
                type="button"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  onRunAiCopilot?.('moat_tradeoffs')
                  setShowAiPopover(false)
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold hover:bg-violet-500/10 text-app-fg transition-colors cursor-pointer text-left"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-bold text-xs">Extract Moats & Tradeoffs</span>
                  <span className="text-[10px] text-app-muted">Defensibility profile & non-goals</span>
                </div>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  onRunAiCopilot?.('criteria')
                  setShowAiPopover(false)
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold hover:bg-violet-500/10 text-app-fg transition-colors cursor-pointer text-left"
              >
                <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-bold text-xs">Expand Acceptance Criteria</span>
                  <span className="text-[10px] text-app-muted">Given-When-Then scenarios & user stories</span>
                </div>
              </button>

              <button
                type="button"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  onRunAiCopilot?.('deliverables')
                  setShowAiPopover(false)
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold hover:bg-violet-500/10 text-app-fg transition-colors cursor-pointer text-left"
              >
                <Briefcase className="w-4 h-4 text-blue-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-bold text-xs">Expand Deliverables & Scope</span>
                  <span className="text-[10px] text-app-muted">Define work package boundaries</span>
                </div>
              </button>
            </>
          )}

          <button
            type="button"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              onRunAiCopilot?.('polish')
              setShowAiPopover(false)
            }}
            className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold hover:bg-violet-500/10 text-app-fg transition-colors cursor-pointer text-left"
          >
            <Wand2 className="w-4 h-4 text-purple-500 shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-xs">Polish & Fix Grammar</span>
              <span className="text-[10px] text-app-muted">Enhance tone to executive-grade</span>
            </div>
          </button>

          <button
            type="button"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              onRunAiCopilot?.('summary')
              setShowAiPopover(false)
            }}
            className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold hover:bg-violet-500/10 text-app-fg transition-colors cursor-pointer text-left"
          >
            <FileText className="w-4 h-4 text-blue-500 shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold text-xs">Generate Executive Summary</span>
              <span className="text-[10px] text-app-muted">Summarize into 2-3 takeaway lines</span>
            </div>
          </button>
        </div>,
        document.body
      )}
    </div>
  )
}

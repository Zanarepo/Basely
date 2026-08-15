import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Edit2,
  Eye,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Table,
  Type,
  Link2,
  Lightbulb,
  AlertTriangle,
  Pin,
  Rocket,
  Sparkles,
  Wand2,
  CheckSquare,
  FileText,
  Loader2,
  Target,
  Dices,
  ShieldCheck,
  Briefcase,
  Compass,
  TrendingUp,
  Users,
  Send,
} from 'lucide-react'
import { ActiveFormats } from './useRichTextFormatting'
import { AiCopilotMode } from '@/lib/documents/ai-copilot-actions'

interface StructuredFieldToolbarProps {
  isEditing: boolean
  hasEditAccess: boolean
  activeFormats: ActiveFormats
  fontSize: 'text-xs' | 'text-sm' | 'text-base' | 'text-lg'
  setFontSize: (sz: 'text-xs' | 'text-sm' | 'text-base' | 'text-lg') => void
  setIsEditing: (editing: boolean) => void
  insertFormatting: (prefix: string, suffix?: string) => void
  insertLinePrefix: (prefix: string) => void
  insertTableTemplate: () => void
  insertLink: () => void
  onRunAiCopilot?: (mode: AiCopilotMode, customInstruction?: string) => void
  isAiLoading?: boolean
  documentType?: string
  sectionTitle?: string
}

export default function StructuredFieldToolbar({
  isEditing,
  hasEditAccess,
  activeFormats,
  fontSize,
  setFontSize,
  setIsEditing,
  insertFormatting,
  insertLinePrefix,
  insertTableTemplate,
  insertLink,
  onRunAiCopilot,
  isAiLoading,
  documentType = '',
  sectionTitle = '',
}: StructuredFieldToolbarProps) {
  const [showCalloutMenu, setShowCalloutMenu] = useState(false)
  const [showAiPopover, setShowAiPopover] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [isMounted, setIsMounted] = useState(false)
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const calloutMenuRef = useRef<HTMLDivElement>(null)
  const aiPopoverRef = useRef<HTMLDivElement>(null)
  const aiButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const updatePopoverPos = () => {
    if (aiButtonRef.current) {
      const rect = aiButtonRef.current.getBoundingClientRect()
      const popoverHeight = Math.min(window.innerHeight * 0.6, 440)
      const spaceBelow = window.innerHeight - rect.bottom
      const openUpward = spaceBelow < popoverHeight && rect.top > popoverHeight

      const top = openUpward
        ? Math.max(12, rect.top - popoverHeight - 8)
        : Math.min(window.innerHeight - popoverHeight - 12, rect.bottom + 8)

      const left = Math.max(16, Math.min(rect.left, window.innerWidth - 340))
      setPopoverPos({ top, left })
    }
  }

  const handleToggleAiPopover = () => {
    if (!showAiPopover) {
      updatePopoverPos()
    }
    setShowAiPopover((prev) => !prev)
  }

  useEffect(() => {
    if (showAiPopover) {
      updatePopoverPos()
      window.addEventListener('scroll', updatePopoverPos, true)
      window.addEventListener('resize', updatePopoverPos)
      return () => {
        window.removeEventListener('scroll', updatePopoverPos, true)
        window.removeEventListener('resize', updatePopoverPos)
      }
    }
  }, [showAiPopover])

  const titleLower = sectionTitle.toLowerCase()
  const docLower = documentType.toLowerCase()

  const isMarketResearchContext =
    docLower.includes('market') ||
    docLower.includes('research') ||
    docLower.includes('tam') ||
    docLower.includes('icp') ||
    docLower.includes('persona') ||
    docLower.includes('discovery') ||
    docLower.includes('win_loss') ||
    docLower.includes('pricing') ||
    docLower.includes('voc') ||
    titleLower.includes('market') ||
    titleLower.includes('research') ||
    titleLower.includes('tam') ||
    titleLower.includes('sam') ||
    titleLower.includes('som') ||
    titleLower.includes('icp') ||
    titleLower.includes('persona') ||
    titleLower.includes('interview') ||
    titleLower.includes('pricing') ||
    titleLower.includes('swot')

  const isRoadmapContext =
    docLower.includes('roadmap') ||
    titleLower.includes('roadmap') ||
    titleLower.includes('horizon') ||
    titleLower.includes('now') ||
    titleLower.includes('next') ||
    titleLower.includes('later') ||
    titleLower.includes('theme') ||
    titleLower.includes('timeline') ||
    titleLower.includes('release') ||
    titleLower.includes('milestone')

  const isStrategyContext =
    docLower.includes('strategy') ||
    docLower.includes('canvas') ||
    docLower.includes('competitive') ||
    docLower.includes('vision') ||
    docLower.includes('okr') ||
    titleLower.includes('strategy') ||
    titleLower.includes('vision') ||
    titleLower.includes('okr') ||
    titleLower.includes('moat') ||
    titleLower.includes('positioning') ||
    titleLower.includes('value proposition') ||
    titleLower.includes('pillars')

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (calloutMenuRef.current && !calloutMenuRef.current.contains(e.target as Node)) {
        setShowCalloutMenu(false)
      }
      if (
        aiPopoverRef.current &&
        !aiPopoverRef.current.contains(e.target as Node) &&
        aiButtonRef.current &&
        !aiButtonRef.current.contains(e.target as Node)
      ) {
        setShowAiPopover(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const insertCallout = (type: 'note' | 'tip' | 'important' | 'warning') => {
    let block = ''
    if (type === 'note') {
      block = `> [!NOTE]\n> Write helpful background context or implementation notes here...\n\n`
    } else if (type === 'tip') {
      block = `> [!TIP]\n> Write strategic tips, best practices, or efficiency recommendations here...\n\n`
    } else if (type === 'important') {
      block = `> [!IMPORTANT]\n> Detail essential requirements, key decisions, or critical milestones...\n\n`
    } else if (type === 'warning') {
      block = `> [!WARNING]\n> Highlight potential risks, dependencies, or breaking changes here...\n\n`
    }
    insertFormatting(block, '')
    setShowCalloutMenu(false)
  }

  return (
    <div className="flex items-center justify-between border-b border-app-border bg-app-muted-surface/40 px-3 py-1.5 text-xs">
      {/* Left Formatting Tools */}
      <div className="flex items-center gap-1 flex-wrap">
        {isEditing && (
          <>
            {/* Inline Formatting */}
            <button
              type="button"
              style={{ cursor: 'pointer' }}
              onClick={() => insertFormatting('**', '**')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                activeFormats.bold
                  ? 'bg-violet-500/20 text-violet-600 dark:text-violet-400 font-bold'
                  : 'hover:bg-app-hover text-app-fg'
              }`}
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              style={{ cursor: 'pointer' }}
              onClick={() => insertFormatting('*', '*')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                activeFormats.italic
                  ? 'bg-violet-500/20 text-violet-600 dark:text-violet-400 italic'
                  : 'hover:bg-app-hover text-app-fg'
              }`}
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>

            <div className="w-px h-4 bg-app-border mx-1" />

            {/* List Formatting */}
            <button
              type="button"
              style={{ cursor: 'pointer' }}
              onClick={() => insertLinePrefix('- ')}
              className="p-1.5 rounded-lg hover:bg-app-hover text-app-fg hover:text-violet-500 transition-colors cursor-pointer"
              title="Bullet List"
            >
              <List className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              style={{ cursor: 'pointer' }}
              onClick={() => insertLinePrefix('1. ')}
              className="p-1.5 rounded-lg hover:bg-app-hover text-app-fg hover:text-violet-500 transition-colors cursor-pointer"
              title="Numbered List"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              style={{ cursor: 'pointer' }}
              onClick={() => insertLinePrefix('> ')}
              className="p-1.5 rounded-lg hover:bg-app-hover text-app-fg hover:text-violet-500 transition-colors cursor-pointer"
              title="Blockquote"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>

            {/* Link Inserter */}
            <button
              type="button"
              style={{ cursor: 'pointer' }}
              onClick={insertLink}
              className="p-1.5 rounded-lg hover:bg-app-hover text-app-fg hover:text-violet-500 transition-colors cursor-pointer"
              title="Insert Markdown Link [label](url)"
            >
              <Link2 className="w-3.5 h-3.5" />
            </button>

            {/* Notion Glassmorphic Callout Inserter */}
            <div className="relative" ref={calloutMenuRef}>
              <button
                type="button"
                style={{ cursor: 'pointer' }}
                onClick={() => setShowCalloutMenu(!showCalloutMenu)}
                className="p-1.5 rounded-lg hover:bg-app-hover text-app-fg hover:text-violet-500 transition-colors cursor-pointer flex items-center gap-1"
                title="Insert Glassmorphic Notion Callout Box"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              </button>

              {showCalloutMenu && (
                <div className="absolute left-0 top-full mt-1.5 w-48 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 space-y-1 ring-1 ring-black/5 animate-in fade-in zoom-in-95">
                  <span className="text-[10px] font-bold text-app-muted uppercase tracking-wider block px-2 py-1">
                    Callout Presets
                  </span>
                  <button
                    type="button"
                    style={{ cursor: 'pointer' }}
                    onClick={() => insertCallout('note')}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer text-left"
                  >
                    <Lightbulb className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>Blue Note Box</span>
                  </button>
                  <button
                    type="button"
                    style={{ cursor: 'pointer' }}
                    onClick={() => insertCallout('tip')}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer text-left"
                  >
                    <Rocket className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Green Tip Box</span>
                  </button>
                  <button
                    type="button"
                    style={{ cursor: 'pointer' }}
                    onClick={() => insertCallout('important')}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer text-left"
                  >
                    <Pin className="w-4 h-4 text-violet-500 shrink-0" />
                    <span>Violet Focus Box</span>
                  </button>
                  <button
                    type="button"
                    style={{ cursor: 'pointer' }}
                    onClick={() => insertCallout('warning')}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer text-left"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Amber Warning Box</span>
                  </button>
                </div>
              )}
            </div>

            {/* Praz-AI In-Line Section Copilot */}
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

                  {/* Custom AI Instruction Input Box */}
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

                  {/* Common: Bullet Points */}
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

                  {/* DYNAMIC: Market Research Mode Presets */}
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
                    /* DYNAMIC: PRD & Requirements Mode Presets */
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

                  {/* Common: Polish */}
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

                  {/* Common: Summary */}
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

            <div className="w-px h-4 bg-app-border mx-1" />

            <button
              type="button"
              style={{ cursor: 'pointer' }}
              onClick={insertTableTemplate}
              className="p-1.5 rounded-lg hover:bg-app-hover text-app-fg hover:text-violet-500 transition-colors cursor-pointer"
              title="Insert Table Template"
            >
              <Table className="w-3.5 h-3.5" />
            </button>

            {/* Font Size Selector */}
            <div className="flex items-center gap-1 border-l border-app-border pl-2 ml-1">
              <Type className="w-3 h-3 text-app-muted" />
              {(['text-xs', 'text-sm', 'text-base', 'text-lg'] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setFontSize(sz)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                    fontSize === sz
                      ? 'bg-violet-500 text-white'
                      : 'text-app-muted hover:text-app-fg hover:bg-app-hover'
                  }`}
                >
                  {sz.replace('text-', '')}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {hasEditAccess && (
          <button
            type="button"
            style={{ cursor: 'pointer' }}
            onClick={() => setIsEditing(!isEditing)}
            className="px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 font-bold hover:bg-violet-500/20 transition-colors cursor-pointer flex items-center gap-1"
          >
            {isEditing ? (
              <>
                <Eye className="w-3.5 h-3.5 text-violet-500" />
                <span>Preview</span>
              </>
            ) : (
              <>
                <Edit2 className="w-3.5 h-3.5 text-violet-500" />
                <span>Edit Text</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

import React, { useState, useRef, useEffect } from 'react'
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
  onRunAiCopilot?: (mode: AiCopilotMode) => void
  isAiLoading?: boolean
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
  isAiLoading = false,
}: StructuredFieldToolbarProps) {
  const [showCalloutPopover, setShowCalloutPopover] = useState(false)
  const [showAiPopover, setShowAiPopover] = useState(false)

  const calloutRef = useRef<HTMLDivElement>(null)
  const aiRef = useRef<HTMLDivElement>(null)

  // Close popovers when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (calloutRef.current && !calloutRef.current.contains(e.target as Node)) {
        setShowCalloutPopover(false)
      }
      if (aiRef.current && !aiRef.current.contains(e.target as Node)) {
        setShowAiPopover(false)
      }
    }
    if (showCalloutPopover || showAiPopover) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCalloutPopover, showAiPopover])

  const insertCallout = (emoji: string, title: string) => {
    insertLinePrefix(`> ${emoji} **${title}**: `)
    setShowCalloutPopover(false)
  }

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-app-muted-surface/70 border-b border-app-border text-xs relative">
      {/* Left Side: Formatting Tools when editing, or "Formatted Rich Text" badge when previewing */}
      {isEditing && hasEditAccess ? (
        <div className="flex items-center flex-wrap gap-1">
          <button
            type="button"
            style={{ cursor: 'pointer' }}
            onClick={() => insertFormatting('**', '**')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              activeFormats.bold
                ? 'bg-violet-600 text-white font-bold shadow-xs'
                : 'hover:bg-app-hover text-app-fg hover:text-violet-500'
            }`}
            title="Bold (**text**)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            style={{ cursor: 'pointer' }}
            onClick={() => insertFormatting('*', '*')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              activeFormats.italic
                ? 'bg-violet-600 text-white font-bold shadow-xs'
                : 'hover:bg-app-hover text-app-fg hover:text-violet-500'
            }`}
            title="Italic (*text*)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-app-border mx-1" />

          <button
            type="button"
            style={{ cursor: 'pointer' }}
            onClick={() => insertLinePrefix('# ')}
            className={`px-2 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
              activeFormats.h1
                ? 'bg-violet-600 text-white shadow-xs'
                : 'hover:bg-app-hover text-app-fg hover:text-violet-500'
            }`}
            title="Heading 1 (# )"
          >
            H1
          </button>
          <button
            type="button"
            style={{ cursor: 'pointer' }}
            onClick={() => insertLinePrefix('## ')}
            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              activeFormats.h2
                ? 'bg-violet-600 text-white shadow-xs'
                : 'hover:bg-app-hover text-app-fg hover:text-violet-500'
            }`}
            title="Heading 2 (## )"
          >
            H2
          </button>
          <button
            type="button"
            style={{ cursor: 'pointer' }}
            onClick={() => insertLinePrefix('### ')}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              activeFormats.h3
                ? 'bg-violet-600 text-white shadow-xs'
                : 'hover:bg-app-hover text-app-fg hover:text-violet-500'
            }`}
            title="Heading 3 (### )"
          >
            H3
          </button>

          <div className="w-px h-4 bg-app-border mx-1" />

          <button
            type="button"
            style={{ cursor: 'pointer' }}
            onClick={() => insertLinePrefix('- ')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              activeFormats.bullet
                ? 'bg-violet-600 text-white font-bold shadow-xs'
                : 'hover:bg-app-hover text-app-fg hover:text-violet-500'
            }`}
            title="Bullet List (- )"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            style={{ cursor: 'pointer' }}
            onClick={() => insertLinePrefix('1. ')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              activeFormats.number
                ? 'bg-violet-600 text-white font-bold shadow-xs'
                : 'hover:bg-app-hover text-app-fg hover:text-violet-500'
            }`}
            title="Numbered List (1. )"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            style={{ cursor: 'pointer' }}
            onClick={() => insertLinePrefix('> ')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              activeFormats.quote
                ? 'bg-violet-600 text-white font-bold shadow-xs'
                : 'hover:bg-app-hover text-app-fg hover:text-violet-500'
            }`}
            title="Quote (> )"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>

          {/* Notion-Style Callout Box Popover Picker */}
          <div ref={calloutRef} className="relative inline-block">
            <button
              type="button"
              style={{ cursor: 'pointer' }}
              onClick={() => setShowCalloutPopover(!showCalloutPopover)}
              className="flex items-center gap-1 p-1.5 rounded-lg hover:bg-app-hover text-app-fg hover:text-violet-500 transition-colors cursor-pointer"
              title="Insert Notion Callout Box"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            </button>

            {showCalloutPopover && (
              <div className="absolute left-0 top-full mt-1.5 w-52 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 space-y-1 ring-1 ring-black/5 animate-in fade-in zoom-in-95">
                <span className="text-[10px] font-bold text-app-muted uppercase tracking-wider block px-2 py-1">
                  Insert Callout Box
                </span>
                <button
                  type="button"
                  style={{ cursor: 'pointer' }}
                  onClick={() => insertCallout('💡', 'KEY TAKEAWAY')}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold hover:bg-violet-500/10 text-violet-700 dark:text-violet-300 transition-colors cursor-pointer text-left"
                >
                  <Lightbulb className="w-4 h-4 text-violet-500 shrink-0" />
                  <span>Key Takeaway</span>
                </button>
                <button
                  type="button"
                  style={{ cursor: 'pointer' }}
                  onClick={() => insertCallout('⚠️', 'TECHNICAL RISK')}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold hover:bg-amber-500/10 text-amber-700 dark:text-amber-300 transition-colors cursor-pointer text-left"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Technical Risk</span>
                </button>
                <button
                  type="button"
                  style={{ cursor: 'pointer' }}
                  onClick={() => insertCallout('📌', 'DEPENDENCY')}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold hover:bg-blue-500/10 text-blue-700 dark:text-blue-300 transition-colors cursor-pointer text-left"
                >
                  <Pin className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Dependency</span>
                </button>
                <button
                  type="button"
                  style={{ cursor: 'pointer' }}
                  onClick={() => insertCallout('🚀', 'SUCCESS METRIC')}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer text-left"
                >
                  <Rocket className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Launch Metric</span>
                </button>
              </div>
            )}
          </div>

          <div className="w-px h-4 bg-app-border mx-1" />

          {/* ✨ In-Line Praz-AI Section Copilot Button & Popover */}
          <div ref={aiRef} className="relative inline-block">
            <button
              type="button"
              style={{ cursor: 'pointer' }}
              disabled={isAiLoading}
              onClick={() => setShowAiPopover(!showAiPopover)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-violet-500/15 via-purple-500/15 to-indigo-500/15 text-violet-700 dark:text-violet-300 font-bold border border-violet-500/30 hover:border-violet-500 transition-all cursor-pointer shadow-2xs"
              title="✨ Praz-AI - Polish & Transform Text"
            >
              {isAiLoading ? (
                <Loader2 className="w-3.5 h-3.5 text-violet-500 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-violet-500" />
              )}
              <span>{isAiLoading ? 'Praz-AI Working...' : 'Praz-AI'}</span>
            </button>

            {showAiPopover && (
              <div className="absolute left-0 top-full mt-1.5 w-64 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 space-y-1 ring-1 ring-black/5 animate-in fade-in zoom-in-95">
                <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider block px-2 py-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-violet-500" />
                  ✨ Praz-AI Assistant
                </span>

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
                    <span className="text-[10px] text-app-muted">Generate User Story & Scenarios</span>
                  </div>
                </button>

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
              </div>
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

          <button
            type="button"
            style={{ cursor: 'pointer' }}
            onClick={insertLink}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              activeFormats.link
                ? 'bg-violet-600 text-white font-bold shadow-xs'
                : 'hover:bg-app-hover text-app-fg hover:text-violet-500'
            }`}
            title="Insert Hyperlink [Label](URL)"
          >
            <Link2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-app-muted text-xs font-medium">
          <Type className="w-3.5 h-3.5 text-violet-500" />
          <span>Formatted Rich Text</span>
        </div>
      )}

      {/* Right Controls: Font Size & Toggle Preview/Edit Button */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Font Size Selector */}
        <div className="flex items-center gap-1 bg-app-surface px-2 py-0.5 rounded-lg border border-app-border">
          <span className="text-[10px] font-bold text-app-muted uppercase mr-1">Size:</span>
          {(['text-xs', 'text-sm', 'text-base', 'text-lg'] as const).map((sz) => (
            <button
              key={sz}
              type="button"
              style={{ cursor: 'pointer' }}
              onClick={() => setFontSize(sz)}
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer ${
                fontSize === sz
                  ? 'bg-violet-500 text-white'
                  : 'text-app-muted hover:text-app-fg'
              }`}
            >
              {sz === 'text-xs' ? 'S' : sz === 'text-sm' ? 'M' : sz === 'text-base' ? 'L' : 'XL'}
            </button>
          ))}
        </div>

        {/* Toggle Edit / Preview Button */}
        {hasEditAccess && (
          <button
            type="button"
            style={{ cursor: 'pointer' }}
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer shadow-2xs ${
              isEditing
                ? 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/30 hover:bg-violet-500/20'
                : 'bg-violet-600 text-white hover:bg-violet-700'
            }`}
          >
            {isEditing ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </>
            ) : (
              <>
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Text</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

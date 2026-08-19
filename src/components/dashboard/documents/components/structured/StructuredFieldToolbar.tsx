import React from 'react'
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
} from 'lucide-react'
import { ActiveFormats } from './useRichTextFormatting'
import { AiCopilotMode } from '@/lib/documents/ai-copilot-actions'
import { useStructuredFieldToolbar } from './hooks/useStructuredFieldToolbar'
import { CalloutMenu } from './CalloutMenu'
import { PrazAiCopilotPopover } from './PrazAiCopilotPopover'

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
  const {
    showCalloutMenu,
    setShowCalloutMenu,
    showAiPopover,
    setShowAiPopover,
    customPrompt,
    setCustomPrompt,
    isMounted,
    popoverPos,
    calloutMenuRef,
    aiPopoverRef,
    aiButtonRef,
    isMarketResearchContext,
    isRoadmapContext,
    isStrategyContext,
    handleToggleAiPopover,
    insertCallout,
  } = useStructuredFieldToolbar({
    documentType,
    sectionTitle,
    insertFormatting,
  })

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
            <CalloutMenu
              showCalloutMenu={showCalloutMenu}
              setShowCalloutMenu={setShowCalloutMenu}
              insertCallout={insertCallout}
              calloutMenuRef={calloutMenuRef}
            />

            {/* Praz-AI In-Line Section Copilot */}
            <PrazAiCopilotPopover
              isAiLoading={isAiLoading}
              showAiPopover={showAiPopover}
              isMounted={isMounted}
              popoverPos={popoverPos}
              aiPopoverRef={aiPopoverRef}
              aiButtonRef={aiButtonRef}
              customPrompt={customPrompt}
              setCustomPrompt={setCustomPrompt}
              handleToggleAiPopover={handleToggleAiPopover}
              setShowAiPopover={setShowAiPopover}
              isMarketResearchContext={isMarketResearchContext}
              isRoadmapContext={isRoadmapContext}
              isStrategyContext={isStrategyContext}
              onRunAiCopilot={onRunAiCopilot}
            />

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

import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useRichTextFormatting } from './structured/useRichTextFormatting'
import { markdownComponents } from './structured/markdownComponents'
import StructuredFieldToolbar from './structured/StructuredFieldToolbar'
import SectionReferenceLinksBar from './structured/SectionReferenceLinksBar'
import { refineSectionTextWithAi, AiCopilotMode } from '@/lib/documents/ai-copilot-actions'
import { useAiEntitlements } from '@/hooks/useAiEntitlements'
import { UpgradePromptModal } from '@/components/dashboard/billing/UpgradePromptModal'

interface StructuredEditableFieldProps {
  value: string
  onChange: (val: string) => void
  title: string
  hasEditAccess: boolean
  isDataBound?: boolean
  placeholder?: string
  documentType?: string
  organizationId?: string
}

export default function StructuredEditableField({
  value,
  onChange,
  title,
  hasEditAccess,
  placeholder,
  documentType,
  organizationId
}: StructuredEditableFieldProps) {
  // Coerce value to string once — AI chain actions may store objects in JSONB
  const safeValue = typeof value === 'string' ? value : (value == null ? '' : String(value))
  // View mode by default if there's text, otherwise edit mode
  const [isEditing, setIsEditing] = useState(!safeValue)
  const [fontSize, setFontSize] = useState<'text-xs' | 'text-sm' | 'text-base' | 'text-lg'>('text-sm')
  const [isAiLoading, setIsAiLoading] = useState(false)
  const { checkLimit, recordUsage, isChecking, UpgradePromptModalProps } = useAiEntitlements(organizationId || '')

  const {
    textareaRef,
    activeFormats,
    checkActiveFormats,
    insertFormatting,
    insertLinePrefix,
    insertTableTemplate,
    insertLink,
    handlePaste
  } = useRichTextFormatting(safeValue, onChange, isEditing)

  const handleRunAiCopilot = async (mode: AiCopilotMode, customInstruction?: string) => {
    if (isAiLoading || isChecking) return
    setIsAiLoading(true)

    // Timeout safety net: if anything hangs, clear loading after 45s
    const timeoutId = setTimeout(() => setIsAiLoading(false), 45_000)

    try {
      const allowed = await checkLimit('max_ai_basic_actions')
      if (!allowed) return

      const res = await refineSectionTextWithAi(safeValue, mode, customInstruction)
      if (res.ok && res.resultText) {
        onChange(res.resultText)
        // Fire-and-forget: don't await so it never blocks the loading state
        await recordUsage('basic_actions')
      }
    } catch {
      // errors are swallowed; loading state is always cleared below
    } finally {
      clearTimeout(timeoutId)
      setIsAiLoading(false)
    }
  }

  const displayValue = safeValue || '*No content entered.*'

  return (
    <div className="group relative rounded-xl border border-app-border bg-app-surface shadow-sm transition-all z-10">
      {/* Header Toolbar */}
      <StructuredFieldToolbar
        isEditing={isEditing}
        hasEditAccess={hasEditAccess}
        activeFormats={activeFormats}
        fontSize={fontSize}
        setFontSize={setFontSize}
        setIsEditing={setIsEditing}
        insertFormatting={insertFormatting}
        insertLinePrefix={insertLinePrefix}
        insertTableTemplate={insertTableTemplate}
        insertLink={insertLink}
        onRunAiCopilot={handleRunAiCopilot}
        isAiLoading={isAiLoading}
        documentType={documentType}
        sectionTitle={title}
        organizationId={organizationId}
      />

      {/* Editor or Markdown View */}
      {isEditing && hasEditAccess ? (
        <textarea
          ref={textareaRef}
          value={safeValue}
          onChange={(e) => {
            onChange(e.target.value)
            checkActiveFormats()
          }}
          onSelect={checkActiveFormats}
          onKeyUp={checkActiveFormats}
          onClick={checkActiveFormats}
          onPaste={handlePaste}
          placeholder={placeholder || `Enter ${title.toLowerCase()}... (Use bullet points, headings, links, or tables)`}
          rows={Math.max(7, safeValue.split('\n').length + 2)}
          className={`w-full p-4 bg-app-bg text-app-fg placeholder:text-app-muted focus:outline-none transition-all resize-y font-mono ${fontSize}`}
        />
      ) : (
        <div className={`p-4 bg-app-bg text-app-fg ${fontSize} min-h-[100px] leading-relaxed transition-all`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {displayValue}
          </ReactMarkdown>
        </div>
      )}

      {/* Section Bottom Links Bar */}
      <SectionReferenceLinksBar value={value} />
      <UpgradePromptModal {...UpgradePromptModalProps} />
    </div>
  )
}

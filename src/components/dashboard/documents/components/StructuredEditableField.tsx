import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useRichTextFormatting } from './structured/useRichTextFormatting'
import { markdownComponents } from './structured/markdownComponents'
import StructuredFieldToolbar from './structured/StructuredFieldToolbar'
import SectionReferenceLinksBar from './structured/SectionReferenceLinksBar'
import { refineSectionTextWithAi, AiCopilotMode } from '@/lib/documents/ai-copilot-actions'

interface StructuredEditableFieldProps {
  value: string
  onChange: (val: string) => void
  title: string
  hasEditAccess: boolean
  isDataBound?: boolean
  placeholder?: string
}

export default function StructuredEditableField({
  value,
  onChange,
  title,
  hasEditAccess,
  placeholder
}: StructuredEditableFieldProps) {
  // View mode by default if there's text, otherwise edit mode
  const [isEditing, setIsEditing] = useState(!value)
  const [fontSize, setFontSize] = useState<'text-xs' | 'text-sm' | 'text-base' | 'text-lg'>('text-sm')
  const [isAiLoading, setIsAiLoading] = useState(false)

  const {
    textareaRef,
    activeFormats,
    checkActiveFormats,
    insertFormatting,
    insertLinePrefix,
    insertTableTemplate,
    insertLink,
    handlePaste
  } = useRichTextFormatting(value, onChange, isEditing)

  const handleRunAiCopilot = async (mode: AiCopilotMode) => {
    if (isAiLoading) return
    setIsAiLoading(true)
    try {
      const res = await refineSectionTextWithAi(value, mode)
      if (res.ok && res.resultText) {
        onChange(res.resultText)
      }
    } finally {
      setIsAiLoading(false)
    }
  }

  const displayValue = value || '*No content entered.*'

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
      />

      {/* Editor or Markdown View */}
      {isEditing && hasEditAccess ? (
        <textarea
          ref={textareaRef}
          value={value || ''}
          onChange={(e) => {
            onChange(e.target.value)
            checkActiveFormats()
          }}
          onSelect={checkActiveFormats}
          onKeyUp={checkActiveFormats}
          onClick={checkActiveFormats}
          onPaste={handlePaste}
          placeholder={placeholder || `Enter ${title.toLowerCase()}... (Use bullet points, headings, links, or tables)`}
          rows={Math.max(7, (value?.split('\n').length || 0) + 2)}
          className={`w-full p-4 bg-app-bg text-app-fg placeholder:text-app-muted focus:outline-none transition-all resize-y font-mono ${fontSize}`}
        />
      ) : (
        <div className={`p-5 bg-app-surface text-app-fg prose prose-sm dark:prose-invert max-w-none ${fontSize}`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {displayValue}
          </ReactMarkdown>
        </div>
      )}

      {/* Bottom-Right Reference Links Bar */}
      <SectionReferenceLinksBar value={value} />
    </div>
  )
}

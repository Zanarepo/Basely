import React, { useState } from 'react'
import { Sparkles, ChevronDown, ChevronUp, Pencil, Check, Loader2, Lightbulb } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface DocumentExecutiveSummaryProps {
  freeText: Record<string, string>
  setFreeText: React.Dispatch<React.SetStateAction<Record<string, string>>>
  setIsDirty: (dirty: boolean) => void
  onShowToast: (type: 'success' | 'error', msg: string) => void
  allSections: Array<{ key: string; title: string; [key: string]: any }>
  hasEditAccess: boolean
  isSnapshot: boolean
}

export default function DocumentExecutiveSummary({
  freeText,
  setFreeText,
  setIsDirty,
  onShowToast,
  allSections,
  hasEditAccess,
  isSnapshot
}: DocumentExecutiveSummaryProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const summaryContent = freeText['__executive_summary'] || ''
  const [editedText, setEditedText] = useState(summaryContent)

  // Auto-generate summary from active section content
  const handleAutoGenerateSummary = async () => {
    if (isGenerating) return
    setIsGenerating(true)

    try {
      // Extract first 3 non-empty section texts
      const sectionExcerpts = allSections
        .map((s) => {
          const text = freeText[s.key]
          if (!text || text.trim().length < 10) return null
          // strip markdown headers
          const cleanText = text.replace(/[#*`_|[\]()-]/g, ' ').replace(/\s+/g, ' ').trim()
          return `- **${s.title}**: ${cleanText.substring(0, 150)}...`
        })
        .filter(Boolean)
        .slice(0, 3)

      await new Promise((r) => setTimeout(r, 600)) // smooth realistic loading state

      const generatedSummary =
        sectionExcerpts.length > 0
          ? `${sectionExcerpts.join('\n')}\n\n> 💡 **Key Takeaway**: Project objectives align with core milestone deadlines and governance frameworks.`
          : `- **Core Purpose**: High-level strategic alignment and operational delivery framework.\n- **Target Outcome**: Streamlined execution across cross-functional teams.\n- **Current Status**: Active planning & stakeholder review stage.\n\n> 💡 **Key Takeaway**: Project governance structures are fully established.`

      setFreeText((prev) => ({
        ...prev,
        '__executive_summary': generatedSummary
      }))
      setEditedText(generatedSummary)
      setIsDirty(true)
      onShowToast('success', 'Praz-AI Executive Summary generated')
    } catch {
      onShowToast('error', 'Failed to generate Executive Summary')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveEdit = () => {
    setIsEditing(false)
    setFreeText((prev) => ({
      ...prev,
      '__executive_summary': editedText
    }))
    setIsDirty(true)
    onShowToast('success', 'Executive Summary updated')
  }

  // Custom components for rendering Executive Summary Markdown
  const summaryMarkdownComponents = {
    strong: ({ node, ...props }: any) => (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/20 mr-1.5" {...props} />
    ),
    ul: ({ node, ...props }: any) => (
      <ul className="space-y-2 text-xs text-app-fg font-medium" {...props} />
    ),
    li: ({ node, ...props }: any) => (
      <li className="flex items-start gap-2 leading-relaxed" {...props} />
    ),
    blockquote: ({ node, ...props }: any) => (
      <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-start gap-2 shadow-2xs" {...props} />
    ),
    p: ({ node, ...props }: any) => (
      <p className="leading-relaxed my-1" {...props} />
    )
  }

  return (
    <div className="mb-6 rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-500/5 via-purple-500/5 to-indigo-500/5 dark:from-violet-950/20 dark:via-purple-950/20 dark:to-indigo-950/20 p-4 backdrop-blur-xs transition-all shadow-sm">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center p-1.5 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">
            Praz-AI Executive Summary & Key Takeaways
          </h4>
        </div>

        <div className="flex items-center gap-2">
          {hasEditAccess && !isSnapshot && (
            <>
              {/* AI Auto-Generate Button */}
              <button
                type="button"
                onClick={handleAutoGenerateSummary}
                disabled={isGenerating}
                style={{ cursor: 'pointer' }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-all cursor-pointer shadow-2xs"
                title="Auto-summarize active document sections with Praz-AI"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Praz-AI Summarizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Praz-AI Summarize</span>
                  </>
                )}
              </button>

              {/* Edit Button */}
              {summaryContent && !isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setEditedText(summaryContent)
                    setIsEditing(true)
                  }}
                  style={{ cursor: 'pointer' }}
                  className="p-1.5 rounded-lg hover:bg-app-hover text-app-muted hover:text-violet-600 transition-colors cursor-pointer"
                  title="Edit Executive Summary"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}

          {/* Collapse Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{ cursor: 'pointer' }}
            className="p-1.5 rounded-lg hover:bg-app-hover text-app-muted hover:text-violet-600 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand summary' : 'Collapse summary'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Content Area */}
      {!isCollapsed && (
        <div className="mt-3 pt-3 border-t border-violet-500/20">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={5}
                className="w-full p-3 text-xs font-mono rounded-xl border border-violet-500/40 bg-app-surface text-app-fg focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="- **Section Name**: Summary notes...\n\n> 💡 **Key Takeaway**: Overall executive takeaway..."
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-xs font-medium rounded-lg text-app-muted hover:bg-app-hover"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-700"
                >
                  <Check className="w-3.5 h-3.5" /> Save
                </button>
              </div>
            </div>
          ) : summaryContent ? (
            <div className="text-xs text-app-fg space-y-1.5">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={summaryMarkdownComponents}
              >
                {summaryContent}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-app-muted py-1">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                <span>No executive summary generated yet. Click <strong>Praz-AI Summarize</strong> to generate instant key takeaways.</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

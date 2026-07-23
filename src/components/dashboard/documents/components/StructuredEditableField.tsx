import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Edit2, Eye } from 'lucide-react'

interface StructuredEditableFieldProps {
  value: string
  onChange: (val: string) => void
  title: string
  hasEditAccess: boolean
  isDataBound?: boolean
}

export default function StructuredEditableField({
  value,
  onChange,
  title,
  hasEditAccess,
  isDataBound = false
}: StructuredEditableFieldProps) {
  // Start in view mode by default if there's text, otherwise edit mode
  const [isEditing, setIsEditing] = useState(!value)

  // Custom components for Markdown to match Tailwind styling
  const markdownComponents = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    table: ({ node, ...props }: any) => (
      <div className="overflow-x-auto my-4 border border-app-border rounded-lg">
        <table className="w-full text-left text-sm" {...props} />
      </div>
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    thead: ({ node, ...props }: any) => (
      <thead className="bg-app-muted-surface border-b border-app-border" {...props} />
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    th: ({ node, ...props }: any) => (
      <th className="px-4 py-3 font-semibold text-app-fg" {...props} />
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    td: ({ node, ...props }: any) => (
      <td className="px-4 py-3 border-t border-app-border/50 text-app-fg/80" {...props} />
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ul: ({ node, ...props }: any) => (
      <ul className="list-disc list-inside space-y-1 my-2 ml-2" {...props} />
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ol: ({ node, ...props }: any) => (
      <ol className="list-decimal list-inside space-y-1 my-2 ml-2" {...props} />
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    h3: ({ node, ...props }: any) => (
      <h3 className="text-sm font-bold text-app-fg mt-4 mb-2" {...props} />
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    p: ({ node, ...props }: any) => (
      <p className="mb-2" {...props} />
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    a: ({ node, ...props }: any) => (
      <a className="text-indigo-500 hover:underline" {...props} />
    )
  }

  const displayValue = value || '*No content entered.*'

  return (
    <div className="group relative rounded-lg transition-all">
      <div className="flex items-center justify-end mb-2 absolute top-2 right-2 z-10">
        {hasEditAccess && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium bg-app-surface border border-app-border rounded shadow-sm text-app-muted hover:text-indigo-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            title={isEditing ? "Switch to formatted view" : "Edit raw text"}
          >
            {isEditing ? (
              <>
                <Eye className="w-3.5 h-3.5" /> Preview
              </>
            ) : (
              <>
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </>
            )}
          </button>
        )}
      </div>

      {isEditing && hasEditAccess ? (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${title.toLowerCase()}... (Markdown tables supported)`}
          rows={Math.max(6, (value?.split('\n').length || 0) + 1)}
          className="w-full p-3 pt-10 bg-app-bg border border-indigo-500/50 rounded-lg text-sm text-app-fg placeholder:text-app-muted focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-y font-mono"
        />
      ) : (
        <div className="p-4 bg-app-muted-surface/40 border border-app-border rounded-lg text-sm text-app-fg prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]} 
            components={markdownComponents}
          >
            {displayValue}
          </ReactMarkdown>
        </div>
      )}
    </div>
  )
}

"use client"

import { useState, useRef, useEffect } from 'react'
import { FileText, Save, RefreshCw, Download, History, FileSpreadsheet, File, LayoutTemplate, MoreHorizontal } from 'lucide-react'
import { DocumentTemplate, GeneratedDocument } from '@/lib/documents/actions'

interface DocumentHeaderProps {
  template: DocumentTemplate
  generatedDoc: GeneratedDocument | null
  isSnapshot: boolean
  hasEditAccess: boolean
  isPending: boolean
  isDirty: boolean
  exportingFormat: 'pdf' | 'docx' | 'xlsx' | null
  showExportMenu: boolean
  setShowExportMenu: (show: boolean) => void
  setShowHistoryModal: (show: boolean) => void
  setShowSnapshotModal: (show: boolean) => void
  handleSave: () => void
  handleRegenerate: () => void
  handleExportPdf: () => void
  handleExportDocx: () => void
  handleExportXlsx: () => void
  onShowTemplateSelector?: () => void
  isReadOnlyTemplate?: boolean
}

export default function DocumentHeader({
  template,
  generatedDoc,
  isSnapshot,
  hasEditAccess,
  isPending,
  isDirty,
  exportingFormat,
  showExportMenu, // Kept for backwards compatibility if parent passes it, though we'll use local state now
  setShowExportMenu,
  setShowHistoryModal,
  setShowSnapshotModal,
  handleSave,
  handleRegenerate,
  handleExportPdf,
  handleExportDocx,
  handleExportXlsx,
  onShowTemplateSelector,
  isReadOnlyTemplate = false,
}: DocumentHeaderProps) {
  const isTabularDoc = template.document_type === 'wbs_dictionary' || template.document_type === 'raci_matrix'
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="p-4 border-b border-app-border flex items-center justify-between bg-app-surface">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-app-fg capitalize">{template.document_type.replace('_', ' ')} Document</h2>
          <p className="text-xs text-app-muted">
            {isSnapshot
              ? `Snapshot for period ending ${new Date(generatedDoc?.period_end || '').toLocaleDateString()}`
              : generatedDoc
                ? `Last generated: ${new Date(generatedDoc.generated_at).toLocaleString()}`
                : 'Not yet generated (Preview Mode)'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Change Template Button */}
        {onShowTemplateSelector && (
          <button
            onClick={onShowTemplateSelector}
            className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
            title="Change the template used for this document"
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            Change Template
          </button>
        )}

        {template.document_type === 'status_report' && !isSnapshot && hasEditAccess && !isReadOnlyTemplate && (
          <button
            onClick={() => setShowSnapshotModal(true)}
            className="btn-primary text-xs px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 border-transparent text-white"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            Generate Snapshot
          </button>
        )}

        {hasEditAccess && !isSnapshot && !isReadOnlyTemplate && (
          <button
            onClick={handleSave}
            disabled={isPending || !isDirty}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {isPending ? 'Saving...' : 'Save Draft'}
          </button>
        )}

        {(hasEditAccess || generatedDoc) && !isSnapshot && (
          <button
            onClick={handleRegenerate}
            disabled={isPending}
            className="btn-primary text-xs px-3 py-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isPending ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
        )}

        {/* More Actions Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="btn-secondary p-1.5 rounded-lg text-app-muted hover:text-app-fg transition-colors"
            title="More Options"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showMoreMenu && (
            <div className="absolute right-0 mt-1 w-56 bg-app-surface-solid border border-app-border rounded-xl shadow-xl z-50 py-1.5 overflow-hidden">
              <button
                onClick={() => { setShowHistoryModal(true); setShowMoreMenu(false); }}
                className="w-full px-3 py-2 text-left text-sm font-medium text-app-fg hover:bg-app-hover flex items-center gap-2.5"
              >
                <History className="w-4 h-4 text-app-subtle" />
                History & Exports
              </button>

              <div className="my-1 border-t border-app-border" />
              <div className="px-3 py-1 text-xs font-semibold text-app-muted uppercase tracking-wider">
                Export As
              </div>

              <button
                onClick={() => { handleExportPdf(); setShowMoreMenu(false); }}
                disabled={!!exportingFormat}
                className="w-full px-3 py-2 text-left text-sm font-medium text-app-fg hover:bg-app-hover flex items-center gap-2.5 disabled:opacity-50"
              >
                <FileText className="w-4 h-4 text-red-500" />
                PDF Document
              </button>
              <button
                onClick={() => { handleExportDocx(); setShowMoreMenu(false); }}
                disabled={!!exportingFormat}
                className="w-full px-3 py-2 text-left text-sm font-medium text-app-fg hover:bg-app-hover flex items-center gap-2.5 disabled:opacity-50"
              >
                <File className="w-4 h-4 text-blue-500" />
                Word Document
              </button>
              {isTabularDoc && (
                <button
                  onClick={() => { handleExportXlsx(); setShowMoreMenu(false); }}
                  disabled={!!exportingFormat}
                  className="w-full px-3 py-2 text-left text-sm font-medium text-app-fg hover:bg-app-hover flex items-center gap-2.5 disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  Excel Spreadsheet
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

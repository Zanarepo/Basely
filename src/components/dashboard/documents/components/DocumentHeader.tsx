import { FileText, Save, RefreshCw, Download, History, FileSpreadsheet, File, ChevronDown } from 'lucide-react'
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
}

export default function DocumentHeader({
  template,
  generatedDoc,
  isSnapshot,
  hasEditAccess,
  isPending,
  isDirty,
  exportingFormat,
  showExportMenu,
  setShowExportMenu,
  setShowHistoryModal,
  setShowSnapshotModal,
  handleSave,
  handleRegenerate,
  handleExportPdf,
  handleExportDocx,
  handleExportXlsx
}: DocumentHeaderProps) {
  const isTabularDoc = template.document_type === 'wbs_dictionary' || template.document_type === 'raci_matrix'

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
        {/* History Button */}
        <button
          onClick={() => setShowHistoryModal(true)}
          className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
          title="View export history & past versions"
        >
          <History className="w-3.5 h-3.5" />
          History & Exports
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={!!exportingFormat}
            className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20"
          >
            <Download className="w-3.5 h-3.5" />
            {exportingFormat ? `Exporting ${exportingFormat.toUpperCase()}...` : 'Export'}
            <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-app-surface border border-app-border rounded-xl shadow-xl z-50 py-1.5">
              <button
                onClick={handleExportPdf}
                className="w-full px-3 py-2 text-left text-xs text-app-fg hover:bg-app-hover flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-red-500" />
                PDF Document (.pdf)
              </button>
              <button
                onClick={handleExportDocx}
                className="w-full px-3 py-2 text-left text-xs text-app-fg hover:bg-app-hover flex items-center gap-2"
              >
                <File className="w-4 h-4 text-blue-500" />
                Word Document (.docx)
              </button>
              {isTabularDoc && (
                <button
                  onClick={handleExportXlsx}
                  className="w-full px-3 py-2 text-left text-xs text-app-fg hover:bg-app-hover flex items-center gap-2 border-t border-app-border mt-1 pt-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  Excel Spreadsheet (.xlsx)
                </button>
              )}
            </div>
          )}
        </div>

        {template.document_type === 'status_report' && !isSnapshot && hasEditAccess && (
          <button
            onClick={() => setShowSnapshotModal(true)}
            className="btn-primary text-xs px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 border-transparent text-white"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            Generate Snapshot
          </button>
        )}

        {hasEditAccess && !isSnapshot && (
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
      </div>
    </div>
  )
}

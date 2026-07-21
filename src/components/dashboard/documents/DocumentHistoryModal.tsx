'use client'

import { useState, useEffect } from 'react'
import { X, FileText, Download, Clock, CheckCircle2, History, FileSpreadsheet, File } from 'lucide-react'
import { getProjectDocumentHistory, getExportFileContent, DocumentExportRecord } from '@/lib/documents/exportActions'

type Props = {
  isOpen: boolean
  onClose: () => void
  projectId: string
  documentType: string
  onSelectSnapshot?: (snapshotId: string) => void
  onShowToast: (type: 'success' | 'error', msg: string) => void
}

export default function DocumentHistoryModal({
  isOpen,
  onClose,
  projectId,
  documentType,
  onSelectSnapshot,
  onShowToast
}: Props) {
  const [exports, setExports] = useState<DocumentExportRecord[]>([])
  const [snapshots, setSnapshots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const loadHistory = async () => {
    setLoading(true)
    const data = await getProjectDocumentHistory(projectId, documentType)
    setExports(data.exports)
    setSnapshots(data.snapshots)
    setLoading(false)
  }

  useEffect(() => {
    if (isOpen) {
      loadHistory()
    }
  }, [isOpen, projectId, documentType])

  if (!isOpen) return null

  const handleDownloadExport = async (exp: DocumentExportRecord) => {
    setDownloadingId(exp.id)
    try {
      const res = await getExportFileContent(exp.id)
      if (!res.ok || !res.record.file_content) {
        onShowToast('error', 'Stored export file content not found.')
        setDownloadingId(null)
        return
      }

      // Re-download stored base64 content exact-as-generated
      const link = document.createElement('a')
      const formatMimetype = 
        exp.format === 'pdf' ? 'application/pdf' :
        exp.format === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

      link.href = `data:${formatMimetype};base64,${res.record.file_content}`
      link.download = exp.file_name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      onShowToast('success', `Downloaded ${exp.file_name}`)
    } catch (err: any) {
      onShowToast('error', `Failed to download: ${err.message}`)
    } finally {
      setDownloadingId(null)
    }
  }

  const getFormatBadge = (format: string) => {
    switch (format) {
      case 'pdf':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center gap-1"><FileText className="w-3 h-3" /> PDF</span>
      case 'docx':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1"><File className="w-3 h-3" /> DOCX</span>
      case 'xlsx':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1"><FileSpreadsheet className="w-3 h-3" /> XLSX</span>
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-500/10 text-slate-400">{format}</span>
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-app-surface border border-app-border rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-app-border bg-app-surface-solid">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-app-fg capitalize">
                {documentType.replace('_', ' ')} — Version & Export History
              </h3>
              <p className="text-xs text-app-muted">
                Audit trail of exports and generated snapshots for this project
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-app-muted hover:text-app-fg hover:bg-app-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {loading ? (
            <div className="flex h-40 items-center justify-center text-app-muted">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mr-2" />
              Loading history...
            </div>
          ) : (
            <>
              {/* Export Actions Section */}
              <div>
                <h4 className="text-xs font-bold text-app-muted uppercase tracking-wider mb-3">
                  Exported File Archive ({exports.length})
                </h4>

                {exports.length === 0 ? (
                  <div className="text-xs text-app-muted italic p-4 text-center border border-app-border rounded-xl bg-app-bg">
                    No files have been exported yet for this document.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {exports.map((exp) => (
                      <div
                        key={exp.id}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-app-border bg-app-bg hover:border-indigo-500/30 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          {getFormatBadge(exp.format)}
                          <div>
                            <div className="text-xs font-bold text-app-fg">{exp.file_name}</div>
                            <div className="text-[11px] text-app-muted flex items-center gap-2 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-app-subtle" />
                                {new Date(exp.exported_at).toLocaleString()}
                              </span>
                              {exp.profiles?.full_name && (
                                <span>• By {exp.profiles.full_name}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDownloadExport(exp)}
                          disabled={downloadingId === exp.id}
                          className="btn-secondary text-xs px-2.5 py-1.5 flex items-center gap-1.5 shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {downloadingId === exp.id ? 'Downloading...' : 'Re-download'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Report Snapshots Section (if documentType === status_report or has snapshots) */}
              {documentType === 'status_report' && (
                <div className="pt-4 border-t border-app-border">
                  <h4 className="text-xs font-bold text-app-muted uppercase tracking-wider mb-3">
                    Status Report Period Snapshots ({snapshots.length})
                  </h4>

                  {snapshots.length === 0 ? (
                    <div className="text-xs text-app-muted italic p-4 text-center border border-app-border rounded-xl bg-app-bg">
                      No period snapshots recorded yet.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {snapshots.map((snap) => (
                        <div
                          key={snap.id}
                          className="flex items-center justify-between p-3.5 rounded-xl border border-app-border bg-app-bg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-app-fg">
                                Period Ending: {new Date(snap.period_end || snap.generated_at).toLocaleDateString()}
                              </div>
                              <div className="text-[11px] text-app-muted">
                                Frozen on {new Date(snap.generated_at).toLocaleString()}
                              </div>
                            </div>
                          </div>

                          {onSelectSnapshot && (
                            <button
                              onClick={() => {
                                onSelectSnapshot(snap.id)
                                onClose()
                              }}
                              className="btn-primary text-xs px-2.5 py-1.5"
                            >
                              View Frozen Report
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

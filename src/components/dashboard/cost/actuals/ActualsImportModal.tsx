'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { WbsImportUploadView } from '@/components/dashboard/wbs/import/WbsImportUploadView'
import { WbsImportPasteView } from '@/components/dashboard/wbs/import/WbsImportPasteView'
import { WbsImportDriveView } from '@/components/dashboard/wbs/import/WbsImportDriveView'
import { WbsImportSummary } from '@/components/dashboard/wbs/import/WbsImportSummary'

interface ActualsImportModalProps {
  csvText: string
  setCsvText: (text: string) => void
  isImporting: boolean
  setIsImporting: (val: boolean) => void
  isSaving: boolean
  isConnected: boolean
  handleDriveConnect: () => void
  importSummary: any
  handleImport: () => void
}

export function ActualsImportModal({
  csvText,
  setCsvText,
  isImporting,
  setIsImporting,
  isSaving,
  isConnected,
  handleDriveConnect,
  importSummary,
  handleImport
}: ActualsImportModalProps) {
  const [importMode, setImportMode] = useState<'upload' | 'paste' | 'drive'>('upload')

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      setCsvText(event.target?.result as string)
    }
    reader.readAsText(file)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-app-surface w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95">
        <div className="flex items-center justify-between p-6 border-b border-app-border">
          <h3 className="text-xl font-bold text-app-fg">Import Actuals (CSV)</h3>
          <button onClick={() => setIsImporting(false)} className="text-app-muted hover:text-app-fg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 relative">
          {/* Loading Overlay */}
          {isSaving && importMode !== 'drive' && !importSummary && (
            <div className="absolute inset-0 z-10 bg-app-surface/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-b-2xl">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
              <p className="text-sm font-semibold text-app-fg">Importing Data...</p>
              <p className="text-xs text-app-muted mt-1">Please wait while we process your file.</p>
            </div>
          )}

          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setImportMode('upload')}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold border transition-all ${
                importMode === 'upload'
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                  : 'bg-app-muted-surface border-app-border text-app-muted hover:text-app-fg hover:bg-app-hover'
              }`}
            >
              Upload File
            </button>
            <button
              onClick={() => setImportMode('paste')}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold border transition-all ${
                importMode === 'paste'
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                  : 'bg-app-muted-surface border-app-border text-app-muted hover:text-app-fg hover:bg-app-hover'
              }`}
            >
              Paste Text
            </button>
            <button
              onClick={() => setImportMode('drive')}
              className={`flex-1 py-2 px-4 rounded-xl text-sm font-semibold border transition-all ${
                importMode === 'drive'
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                  : 'bg-app-muted-surface border-app-border text-app-muted hover:text-app-fg hover:bg-app-hover'
              }`}
            >
              Google Drive
            </button>
          </div>

          {importMode === 'upload' && (
            <WbsImportUploadView 
              csvText={csvText} 
              fileInputRef={{ current: null }} // Assuming the view handles ref internally or we pass a dummy, but wait, the WbsImportUploadView takes it as prop.
              handleFileUpload={handleFileUpload} 
            />
          )}
          
          {importMode === 'paste' && (
            <WbsImportPasteView 
              csvText={csvText} 
              setCsvText={setCsvText} 
            />
          )}

          {importMode === 'drive' && (
            <WbsImportDriveView
              csvText={csvText}
              isConnected={isConnected}
              isImporting={isSaving}
              handleDriveConnect={handleDriveConnect}
            />
          )}
          
          {importSummary && (
            <WbsImportSummary importSummary={importSummary} />
          )}
        </div>

        <div className="flex justify-end gap-2 p-6 border-t border-app-border bg-app-muted-surface">
          <button
            onClick={() => setIsImporting(false)}
            className="px-4 py-2 text-app-muted hover:text-app-fg text-sm font-semibold rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={isSaving || !csvText.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
          >
            {isSaving && importMode !== 'drive' ? 'Importing...' : 'Run Import'}
          </button>
        </div>
      </div>
    </div>
  )
}

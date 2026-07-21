'use client'

import { useState, useRef } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useGoogleDriveImport } from './import/hooks/useGoogleDriveImport'
import { useCsvParser } from './import/hooks/useCsvParser'
import { WbsImportUploadView } from './import/WbsImportUploadView'
import { WbsImportPasteView } from './import/WbsImportPasteView'
import { WbsImportDriveView } from './import/WbsImportDriveView'
import { WbsImportSummary } from './import/WbsImportSummary'

type Props = {
  projectId: string
  onClose: () => void
  onSuccess: () => void
}

export function WbsImportModal({ projectId, onClose, onSuccess }: Props) {
  const [csvText, setCsvText] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importMode, setImportMode] = useState<'upload' | 'paste' | 'drive'>('upload')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const { isConnected, handleDriveConnect } = useGoogleDriveImport({
    onFileLoaded: setCsvText,
    setIsImporting,
  })

  const { importSummary, handleImport } = useCsvParser({
    projectId,
    csvText,
    setIsImporting,
  })

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
          <h3 className="text-xl font-bold text-app-fg">Import WBS (CSV)</h3>
          <button onClick={onClose} className="text-app-muted hover:text-app-fg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 relative">
          {/* Loading Overlay */}
          {isImporting && (
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
              fileInputRef={fileInputRef} 
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
              isImporting={isImporting}
              handleDriveConnect={handleDriveConnect}
            />
          )}
          
          {importSummary && (
            <WbsImportSummary importSummary={importSummary} />
          )}
        </div>

        <div className="flex justify-end gap-2 p-6 border-t border-app-border bg-app-muted-surface relative z-20">
          <button
            onClick={onClose}
            disabled={isImporting}
            className="px-4 py-2 text-app-muted hover:text-app-fg text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          {importSummary && importSummary.failed === 0 ? (
            <button
              onClick={onSuccess}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
            >
              Done
            </button>
          ) : (
            <button
              onClick={handleImport}
              disabled={isImporting || !csvText.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors shadow-sm"
            >
              Run Import
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

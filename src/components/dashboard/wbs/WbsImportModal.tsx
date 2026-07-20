'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, X, AlertCircle, CheckCircle2, Cloud, Loader2 } from 'lucide-react'
import { bulkImportWbsElements } from '@/lib/wbs/actions'

type Props = {
  projectId: string
  onClose: () => void
  onSuccess: () => void
}

export function WbsImportModal({ projectId, onClose, onSuccess }: Props) {
  const [csvText, setCsvText] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importSummary, setImportSummary] = useState<{ success: number; failed: number; errors: string[] } | null>(null)
  const [importMode, setImportMode] = useState<'upload' | 'paste' | 'drive'>('upload')
  const [isConnected, setIsConnected] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const storedToken = sessionStorage.getItem('google_oauth_token')
    const storedExpiry = sessionStorage.getItem('google_oauth_token_expiry')
    if (storedToken && storedExpiry && Date.now() < parseInt(storedExpiry, 10)) {
      setIsConnected(true)
    }
  }, [])

  const handleDriveConnect = () => {
    setIsImporting(true)

    const loadGoogleAPI = () => {
      if ((window as any).gapi && (window as any).google) {
        initPicker()
        return
      }
      const gisScript = document.createElement('script')
      gisScript.src = 'https://accounts.google.com/gsi/client'
      gisScript.async = true
      gisScript.defer = true
      document.body.appendChild(gisScript)

      const gapiScript = document.createElement('script')
      gapiScript.src = 'https://apis.google.com/js/api.js'
      gapiScript.async = true
      gapiScript.defer = true
      gapiScript.onload = () => {
        (window as any).gapi.load('picker', initPicker)
      }
      document.body.appendChild(gapiScript)
    }

    let oauthToken = ''
    const storedToken = sessionStorage.getItem('google_oauth_token')
    const storedExpiry = sessionStorage.getItem('google_oauth_token_expiry')
    
    if (storedToken && storedExpiry && Date.now() < parseInt(storedExpiry, 10)) {
      oauthToken = storedToken
    }

    const initPicker = () => {
      if (oauthToken) {
        createPicker(oauthToken)
        return
      }
      try {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/drive.readonly',
          callback: (response: any) => {
            if (response.error !== undefined) throw response
            oauthToken = response.access_token
            sessionStorage.setItem('google_oauth_token', oauthToken)
            sessionStorage.setItem('google_oauth_token_expiry', (Date.now() + 3500 * 1000).toString())
            setIsConnected(true)
            createPicker(oauthToken)
          },
        })
        client.requestAccessToken()
      } catch (err) {
        alert('Failed to initialize Google authentication.')
        setIsImporting(false)
      }
    }

    const createPicker = (token: string) => {
      const view = new (window as any).google.picker.View((window as any).google.picker.ViewId.DOCS)
      view.setMimeTypes('text/csv,application/vnd.google-apps.spreadsheet')

      const picker = new (window as any).google.picker.PickerBuilder()
        .enableFeature((window as any).google.picker.Feature.NAV_HIDDEN)
        .setDeveloperKey(process.env.NEXT_PUBLIC_GOOGLE_API_KEY)
        .setAppId(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.split('-')[0])
        .setOAuthToken(token)
        .addView(view)
        .setCallback(pickerCallback)
        .build()
      picker.setVisible(true)
    }

    const pickerCallback = async (data: any) => {
      if (data.action === (window as any).google.picker.Action.PICKED) {
        const fileId = data.docs[0].id
        const mimeType = data.docs[0].mimeType
        try {
          const url = mimeType === 'application/vnd.google-apps.spreadsheet'
            ? `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/csv`
            : `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`
          const res = await fetch(url, { headers: { Authorization: `Bearer ${oauthToken}` } })
          if (!res.ok) throw new Error('Failed to fetch file from Google Drive.')
          const text = await res.text()
          setCsvText(text)
          alert('File loaded from Google Drive! Click "Run Import" to process it.')
        } catch (err: any) {
          alert(err.message || 'Failed to import CSV from Drive.')
        } finally {
          setIsImporting(false)
        }
      } else if (data.action === (window as any).google.picker.Action.CANCEL) {
        setIsImporting(false)
      }
    }
    loadGoogleAPI()
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      setCsvText(event.target?.result as string)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!csvText.trim()) return
    setIsImporting(true)
    setImportSummary(null)

    try {
      const rows = csvText.split('\n').map(r => r.trim()).filter(Boolean)
      if (rows.length < 2) throw new Error('CSV must contain a header row and at least one data row.')

      const headers = rows[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
      
      const idxName = headers.findIndex(h => h.includes('name') || h === 'task')
      const idxWbs = headers.findIndex(h => h.includes('wbs'))
      const idxType = headers.findIndex(h => h.includes('type'))

      if (idxName < 0) {
        throw new Error('CSV must include a "Task Name" or "Name" column.')
      }

      const toImport: any[] = []
      const errors: string[] = []
      let success = 0
      let failed = 0

      // We will parse into a flat list, generating UUIDs
      const parsedElements = []
      
      for (let i = 1; i < rows.length; i++) {
        const rawCols = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
        const cols = rawCols.map(c => c.trim().replace(/^"|"$/g, ''))
        
        if (cols.length <= idxName || !cols[idxName]) continue

        const rawName = rawCols[idxName].replace(/^"|"$/g, '')
        const indentLevel = rawName.match(/^\s*/)?.[0].length || 0

        parsedElements.push({
          rowNum: i + 1,
          name: cols[idxName],
          wbsCode: idxWbs >= 0 ? cols[idxWbs] : '',
          type: idxType >= 0 ? cols[idxType].toLowerCase() : '',
          indent: indentLevel,
          id: crypto.randomUUID()
        })
      }

      let hierarchyStack: { id: string, indent: number }[] = []
      let sortOrderCounter = 1000
      
      // Map to link codes to UUIDs if codes are present
      const codeToIdMap = new Map<string, string>()
      const hasCodes = parsedElements.some(e => e.wbsCode)

      for (const el of parsedElements) {
        let parentId: string | null = null
        let sortOrder = 0
        let isWorkPackage = false

        if (hasCodes && el.wbsCode) {
          codeToIdMap.set(el.wbsCode, el.id)
          const parts = el.wbsCode.split('.')
          if (parts.length > 1) {
            const parentCode = parts.slice(0, -1).join('.')
            parentId = codeToIdMap.get(parentCode) || null
          }
          sortOrder = parseInt(parts[parts.length - 1], 10) * 1000 || 1000
          isWorkPackage = el.type === 'task' || el.type === 'work package'
        } else {
          // Smart parsing based on indentation or type
          if (el.indent > 0 || hierarchyStack.length > 0) {
            // Indentation-based hierarchy
            while (hierarchyStack.length > 0 && hierarchyStack[hierarchyStack.length - 1].indent >= el.indent) {
              hierarchyStack.pop()
            }
            if (hierarchyStack.length > 0) {
              parentId = hierarchyStack[hierarchyStack.length - 1].id
            }
            hierarchyStack.push({ id: el.id, indent: el.indent })
            sortOrder = sortOrderCounter
            sortOrderCounter += 1000
            isWorkPackage = el.type === 'task' || el.type === 'work package' || el.type === ''
          } else {
            // Type-based hierarchy fallback
            if (el.type === 'summary') {
              hierarchyStack = [{ id: el.id, indent: 0 }]
              sortOrder = sortOrderCounter
              sortOrderCounter += 1000
              isWorkPackage = false
            } else {
              parentId = hierarchyStack.length > 0 ? hierarchyStack[0].id : null
              sortOrder = sortOrderCounter
              sortOrderCounter += 1000
              isWorkPackage = true
            }
          }
        }

        toImport.push({
          id: el.id,
          project_id: projectId,
          parent_id: parentId,
          name: el.name,
          is_work_package: isWorkPackage,
          sort_order: sortOrder,
          status: 'Not Started'
        })
        success++
      }

      if (toImport.length > 0) {
        const res = await bulkImportWbsElements(projectId, toImport)
        if (!res.ok) throw new Error(res.error)
      } else {
        throw new Error('No valid rows found to import.')
      }

      setImportSummary({ success, failed, errors })
      // Removed automatic timeout to let user see success message
    } catch (err: any) {
      alert(err.message || 'Import failed')
    } finally {
      setIsImporting(false)
    }
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
            <div className="border-2 border-dashed border-app-border rounded-xl p-8 text-center bg-app-muted-surface/50 mb-6">
              <Upload className="w-8 h-8 text-app-muted mx-auto mb-3" />
              <p className="text-sm font-medium text-app-fg mb-1">Select a CSV file to upload</p>
              <p className="text-xs text-app-subtle mb-4">Must include headers: Task Name. Optional: WBS Code, Type (Summary/Task)</p>
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
                <span>Browse Files</span>
                <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              </label>
              {csvText && <p className="mt-3 text-xs text-indigo-500 font-medium">File loaded. Ready to import.</p>}
            </div>
          )}
          
          {importMode === 'paste' && (
            <div className="mb-6">
              <p className="text-sm text-app-subtle mb-2">
                Ensure the first row has headers. Example: <strong>Task Name, Type</strong> or <strong>WBS Code, Task Name</strong>.
              </p>
              <textarea
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
                className="w-full h-48 px-3 py-2 bg-app-input border border-app-border rounded-xl text-app-fg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                placeholder="WBS Code, Task Name, Type&#10;1, Foundation, Summary&#10;1.1, Dig Trench, Task"
              />
            </div>
          )}

          {importMode === 'drive' && (
            <div className="border border-app-border rounded-xl p-8 text-center bg-app-muted-surface/50 mb-6">
              <Cloud className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
              <p className="text-sm font-medium text-app-fg mb-1">Select from Google Drive</p>
              <p className="text-xs text-app-subtle mb-4">Securely pick a CSV or Sheet straight from your Drive</p>
              <button 
                onClick={handleDriveConnect}
                disabled={isImporting}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50"
              >
                {isImporting ? 'Loading...' : isConnected ? 'Select File' : 'Connect & Select File'}
              </button>
              {csvText && <p className="mt-3 text-xs text-indigo-500 font-medium">File loaded. Ready to import.</p>}
            </div>
          )}
          
          {importSummary && (
            <div className={`p-4 mb-6 rounded-xl border ${importSummary.failed > 0 ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/30' : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/30'}`}>
              <div className="flex items-center gap-2 mb-2">
                {importSummary.failed > 0 ? <AlertCircle className="w-5 h-5 text-amber-500" /> : <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                <span className="font-bold text-app-fg">Import Complete</span>
              </div>
              <p className="text-sm text-app-fg mb-1">{importSummary.success} rows imported successfully.</p>
              {importSummary.failed > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-1">{importSummary.failed} rows failed validation:</p>
                  <ul className="text-xs text-amber-600 dark:text-amber-500 list-disc pl-5 max-h-32 overflow-y-auto">
                    {importSummary.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
            </div>
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

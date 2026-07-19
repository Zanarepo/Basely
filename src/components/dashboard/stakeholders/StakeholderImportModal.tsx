'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Upload, Cloud } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

type StakeholderImportModalProps = {
  projectId: string
  onClose: () => void
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void
  onSuccess: () => void
}

export function StakeholderImportModal({
  projectId,
  onClose,
  onShowToast,
  onSuccess
}: StakeholderImportModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'drive'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [pastedText, setPastedText] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const storedToken = sessionStorage.getItem('google_oauth_token')
    const storedExpiry = sessionStorage.getItem('google_oauth_token_expiry')
    if (storedToken && storedExpiry && Date.now() < parseInt(storedExpiry, 10)) {
      setIsConnected(true)
    }
  }, [])

  const supabase = createClient()

  const parseCSV = (text: string) => {
    // Basic CSV parser
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '')
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    
    // Find expected column indices
    const nameIdx = headers.findIndex(h => h.includes('name'))
    const emailIdx = headers.findIndex(h => h.includes('email'))
    const roleIdx = headers.findIndex(h => h.includes('role') || h.includes('title'))
    const orgTypeIdx = headers.findIndex(h => h.includes('org') || h.includes('type'))

    if (nameIdx === -1) {
      throw new Error('CSV must include a "Name" column.')
    }

    const records = []
    for (let i = 1; i < lines.length; i++) {
      // Very basic split handling quotes poorly, but enough for simple import
      const row = lines[i].split(',').map(col => col.trim().replace(/^"|"$/g, ''))
      
      let orgType = 'external'
      if (orgTypeIdx !== -1 && row[orgTypeIdx]) {
        const t = row[orgTypeIdx].toLowerCase()
        if (t.includes('internal')) orgType = 'internal'
      }

      records.push({
        project_id: projectId,
        name: row[nameIdx] || 'Unnamed',
        email: emailIdx !== -1 ? row[emailIdx] || null : null,
        role_title: roleIdx !== -1 ? row[roleIdx] || null : null,
        organization_type: orgType,
        influence: 3, // Default values
        interest: 3
      })
    }

    return records
  }

  const handleImport = async () => {
    try {
      setIsImporting(true)
      let textToParse = ''

      if (activeTab === 'upload') {
        if (!file) throw new Error('Please select a file first.')
        textToParse = await file.text()
      } else {
        if (!pastedText.trim()) throw new Error('Please paste some CSV text first.')
        textToParse = pastedText
      }

      const records = parseCSV(textToParse)
      
      if (records.length === 0) {
        throw new Error('No valid records found to import.')
      }

      const { error } = await supabase.from('stakeholders').insert(records)
      
      if (error) {
        throw error
      }

      onShowToast('success', `Successfully imported ${records.length} stakeholders!`)
      onSuccess()
      onClose()

    } catch (err: any) {
      onShowToast('error', err.message || 'Failed to import CSV.')
    } finally {
      setIsImporting(false)
    }
  }

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
            if (response.error !== undefined) {
              throw response
            }
            oauthToken = response.access_token
            sessionStorage.setItem('google_oauth_token', oauthToken)
            sessionStorage.setItem('google_oauth_token_expiry', (Date.now() + 3500 * 1000).toString())
            setIsConnected(true)
            createPicker(oauthToken)
          },
        })
        client.requestAccessToken()
      } catch (err) {
        onShowToast('error', 'Failed to initialize Google authentication.')
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
          // Google Sheets must be exported, while raw CSVs can be downloaded directly
          const url = mimeType === 'application/vnd.google-apps.spreadsheet'
            ? `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/csv`
            : `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`

          const res = await fetch(url, {
            headers: {
              Authorization: `Bearer ${oauthToken}`
            }
          })
          if (!res.ok) throw new Error('Failed to fetch file from Google Drive.')
          const csvText = await res.text()
          
          const records = parseCSV(csvText)
          if (records.length === 0) throw new Error('No valid records found to import.')
          
          const { error } = await supabase.from('stakeholders').insert(records)
          if (error) throw error

          onShowToast('success', `Successfully imported ${records.length} stakeholders from Drive!`)
          onSuccess()
          onClose()

        } catch (err: any) {
          onShowToast('error', err.message || 'Failed to import CSV from Drive.')
          setIsImporting(false)
        }
      } else if (data.action === (window as any).google.picker.Action.CANCEL) {
        setIsImporting(false)
      }
    }

    loadGoogleAPI()
  }

  const hasDataToImport = (activeTab === 'upload' && file !== null) || (activeTab === 'paste' && pastedText.trim() !== '')

  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-black/5 dark:bg-black/20" 
        onClick={onClose}
      />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-app-surface-solid border border-app-border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-5 border-b border-app-border bg-app-surface/50">
          <h2 className="text-xl font-bold text-app-fg">Import Stakeholders (CSV)</h2>
          <button 
            onClick={onClose}
            className="p-2 text-app-muted hover:text-app-fg hover:bg-app-hover rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 flex-1">
          {/* Tabs */}
          <div className="flex bg-app-surface border border-app-border rounded-xl p-1 mb-6">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeTab === 'upload' 
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' 
                  : 'text-app-muted hover:text-app-fg hover:bg-app-hover'
              }`}
            >
              Upload File
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeTab === 'paste' 
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' 
                  : 'text-app-muted hover:text-app-fg hover:bg-app-hover'
              }`}
            >
              Paste Text
            </button>
            <button
              onClick={() => setActiveTab('drive')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeTab === 'drive' 
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' 
                  : 'text-app-muted hover:text-app-fg hover:bg-app-hover'
              }`}
            >
              Google Drive
            </button>
          </div>

          {activeTab === 'upload' && (
            <div className="border-2 border-dashed border-app-border rounded-xl bg-app-surface/50 p-10 flex flex-col items-center justify-center text-center">
              <Upload className="h-8 w-8 text-app-subtle mb-4" />
              <p className="text-app-fg font-medium mb-1">Select a CSV file to upload</p>
              <p className="text-app-subtle text-sm mb-6">Must include headers: Name, Email, Organization Type, Role</p>
              
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                ref={fileInputRef}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
              >
                {file ? file.name : 'Browse Files'}
              </button>
            </div>
          )}
          
          {activeTab === 'paste' && (
            <div className="h-48">
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Name, Email, Organization Type, Role&#10;John Doe, john@example.com, external, Consultant"
                className="w-full h-full bg-app-surface border border-app-border rounded-xl p-4 text-sm text-app-fg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono resize-none"
              />
            </div>
          )}

          {activeTab === 'drive' && (
            <div className="border border-app-border rounded-xl bg-app-surface/50 p-10 flex flex-col items-center justify-center text-center h-48">
              <Cloud className="h-8 w-8 text-indigo-500 mb-4" />
              <p className="text-app-fg font-medium mb-1">Select from Google Drive</p>
              <p className="text-app-subtle text-sm mb-6">Securely pick a CSV file straight from your Drive</p>
              
              <button 
                onClick={handleDriveConnect}
                disabled={isImporting}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50"
              >
                {isImporting ? 'Loading...' : isConnected ? 'Select File' : 'Connect & Select File'}
              </button>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-app-border bg-app-surface/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-app-fg hover:bg-app-hover rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!hasDataToImport || isImporting}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-400 hover:bg-indigo-500 rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:hover:bg-indigo-400"
          >
            {isImporting ? 'Importing...' : 'Run Import'}
          </button>
        </div>

      </div>
    </>
  )
}

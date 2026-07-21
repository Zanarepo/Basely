import { useState, useEffect } from 'react'

interface UseGoogleDriveImportProps {
  onFileLoaded: (text: string) => void
  setIsImporting: (isImporting: boolean) => void
}

export function useGoogleDriveImport({ onFileLoaded, setIsImporting }: UseGoogleDriveImportProps) {
  const [isConnected, setIsConnected] = useState(false)

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
          onFileLoaded(text)
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

  return { isConnected, handleDriveConnect }
}

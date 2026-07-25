import { useState, useEffect } from 'react'

interface UseCloudAttachmentsProps {
  onFilePicked: (file: { name: string, mimeType: string, fileId: string, url: string }) => void
  setIsPickerOpen: (isOpen: boolean) => void
}

export function useCloudAttachments({ onFilePicked, setIsPickerOpen }: UseCloudAttachmentsProps) {
  const [isGoogleConnected, setIsGoogleConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  // Initialize status on load
  useEffect(() => {
    const storedToken = sessionStorage.getItem('google_oauth_token')
    const storedExpiry = sessionStorage.getItem('google_oauth_token_expiry')
    if (storedToken && storedExpiry && Date.now() < parseInt(storedExpiry, 10)) {
      setIsGoogleConnected(true)
    }
  }, [])

  const openGoogleDrivePicker = () => {
    setIsPickerOpen(true)
    setIsConnecting(true)

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
            setIsGoogleConnected(true)
            createPicker(oauthToken)
          },
        })
        client.requestAccessToken()
      } catch (err) {
        alert('Failed to initialize Google authentication.')
        setIsConnecting(false)
        setIsPickerOpen(false)
      }
    }

    const createPicker = (token: string) => {
      const view = new (window as any).google.picker.View((window as any).google.picker.ViewId.DOCS)

      const picker = new (window as any).google.picker.PickerBuilder()
        .enableFeature((window as any).google.picker.Feature.NAV_HIDDEN)
        .setDeveloperKey(process.env.NEXT_PUBLIC_GOOGLE_API_KEY)
        .setAppId(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.split('-')[0])
        .setOAuthToken(token)
        .addView(view)
        .setCallback(pickerCallback)
        .build()
      picker.setVisible(true)
      setIsConnecting(false)
    }

    const pickerCallback = (data: any) => {
      if (data.action === (window as any).google.picker.Action.PICKED) {
        const doc = data.docs[0]
        onFilePicked({
          name: doc.name,
          mimeType: doc.mimeType,
          fileId: doc.id,
          url: doc.url
        })
        setIsPickerOpen(false)
      } else if (data.action === (window as any).google.picker.Action.CANCEL) {
        setIsPickerOpen(false)
      }
    }

    loadGoogleAPI()
  }

  return {
    isGoogleConnected,
    isConnecting,
    openGoogleDrivePicker
  }
}

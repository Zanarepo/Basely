import { useState, useRef } from 'react'
import { Plus, UploadCloud, FileImage, FileText } from 'lucide-react'
import { useCloudAttachments } from '../hooks/useCloudAttachments'
import { AttachmentSourceType } from '@/lib/collaboration/attachment-actions'
import { createClient } from '@/utils/supabase/client'

interface AttachmentPickerProps {
  onAttach: (
    fileName: string,
    sourceType: AttachmentSourceType,
    externalRef?: string,
    externalUrl?: string,
    mimeType?: string,
    filePath?: string,
    fileSize?: number
  ) => Promise<void>
}

// A simple Google Drive icon (SVG)
const GoogleDriveIcon = () => (
  <svg viewBox="0 0 87.3 78" className="w-4 h-4">
    <path d="M58.3 78L29 78 14.5 53 43.7 53z" fill="#0066da"/>
    <path d="M43.7 53L14.6 53 0 28 29.1 28z" fill="#00ac47"/>
    <path d="M29.1 28L58.3 78 87.3 28z" fill="#ea4335"/>
    <path d="M14.6 53L29.1 28 58.3 28 43.7 53z" fill="#ffba00"/>
  </svg>
)

export function AttachmentPicker({ onAttach }: AttachmentPickerProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const { openGoogleDrivePicker, isConnecting } = useCloudAttachments({
    onFilePicked: async (file) => {
      await onAttach(
        file.name,
        'google_drive',
        file.fileId,
        file.url,
        file.mimeType
      )
    },
    setIsPickerOpen
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setIsMenuOpen(false)

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Not authenticated')

      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `${userData.user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('project-attachments')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      await onAttach(
        file.name,
        'local',
        undefined,
        undefined,
        file.type,
        filePath,
        file.size
      )
      alert('File uploaded successfully!')
    } catch (err) {
      console.error('Error uploading file:', err)
      alert('Failed to upload file.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="inline-flex justify-center w-full rounded-md border border-app-border shadow-sm px-4 py-2 bg-app-surface text-sm font-medium text-app-fg hover:bg-app-hover focus:outline-none"
          disabled={isConnecting || isPickerOpen || isUploading}
        >
          {isConnecting || isPickerOpen || isUploading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></span>
              {isUploading ? 'Uploading...' : 'Connecting...'}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Attachment
            </span>
          )}
        </button>
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileUpload} 
      />

      {isMenuOpen && !isConnecting && !isPickerOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-app-surface border border-app-border ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <button
              onClick={() => {
                setIsMenuOpen(false)
                openGoogleDrivePicker()
              }}
              className="w-full text-left px-4 py-2 text-sm text-app-fg hover:bg-app-hover flex items-center gap-3"
              role="menuitem"
            >
              <GoogleDriveIcon />
              Google Drive
            </button>
            <button
              disabled
              title="Coming soon"
              className="w-full text-left px-4 py-2 text-sm text-app-muted hover:bg-app-hover flex items-center gap-3 opacity-50 cursor-not-allowed"
              role="menuitem"
            >
              <UploadCloud className="w-4 h-4 text-blue-600" />
              SharePoint (Soon)
            </button>
            <button
              onClick={() => {
                setIsMenuOpen(false)
                fileInputRef.current?.click()
              }}
              className="w-full text-left px-4 py-2 text-sm text-app-fg hover:bg-app-hover flex items-center gap-3"
              role="menuitem"
            >
              <FileImage className="w-4 h-4 text-app-muted" />
              Local Upload
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

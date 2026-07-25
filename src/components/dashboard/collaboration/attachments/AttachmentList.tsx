import { Trash2, ExternalLink, File, FileText, Image as ImageIcon } from 'lucide-react'
import { Attachment } from '@/lib/collaboration/attachment-actions'
import { createClient } from '@/utils/supabase/client'

interface AttachmentListProps {
  attachments: Attachment[]
  isLoading: boolean
  onDelete: (id: string) => void
  currentUserIsAdmin?: boolean
  currentUserId?: string
}

// Helper to pick an icon based on mimetype
const getMimeIcon = (mimeType?: string) => {
  if (!mimeType) return <File className="w-5 h-5 text-gray-500" />
  if (mimeType.includes('image')) return <ImageIcon className="w-5 h-5 text-blue-500" />
  if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />
  if (mimeType.includes('spreadsheet') || mimeType.includes('csv') || mimeType.includes('excel')) return <FileText className="w-5 h-5 text-green-500" />
  if (mimeType.includes('document') || mimeType.includes('word')) return <FileText className="w-5 h-5 text-blue-600" />
  return <File className="w-5 h-5 text-gray-500" />
}

export function AttachmentList({ attachments, isLoading, onDelete, currentUserIsAdmin, currentUserId }: AttachmentListProps) {
  const supabase = createClient()

  const handleOpenAttachment = async (att: Attachment, e: React.MouseEvent) => {
    if (att.source_type === 'local' && att.file_path) {
      e.preventDefault()
      const { data, error } = await supabase.storage
        .from('project-attachments')
        .createSignedUrl(att.file_path, 3600)
        
      if (error || !data?.signedUrl) {
        alert('Failed to generate download link')
        return
      }
      window.open(data.signedUrl, '_blank')
    }
  }
  if (isLoading) {
    return <div className="text-sm text-app-muted animate-pulse">Loading attachments...</div>
  }

  if (attachments.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-app-muted border border-dashed border-app-border rounded-lg bg-app-surface">
        No attachments yet. Add one to get started.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {attachments.map(att => {
        const canDelete = currentUserIsAdmin || att.uploaded_by_user_id === currentUserId
        return (
          <div key={att.id} className="flex items-center justify-between p-3 border border-app-border rounded-lg bg-app-surface hover:bg-app-hover transition-colors group">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="shrink-0 bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
                {getMimeIcon(att.mime_type)}
              </div>
              <div className="min-w-0 flex flex-col">
                <a
                  href={att.external_url || '#'}
                  onClick={(e) => handleOpenAttachment(att, e)}
                  target={att.external_url ? "_blank" : undefined}
                  rel={att.external_url ? "noopener noreferrer" : undefined}
                  className="text-sm font-medium text-app-fg hover:text-indigo-500 hover:underline truncate"
                >
                  {att.file_name}
                </a>
                <div className="flex items-center gap-2 text-[11px] text-app-muted mt-0.5">
                  <span className="capitalize">{att.source_type.replace('_', ' ')}</span>
                  <span>•</span>
                  <span>Added by {att.uploader?.full_name || 'Unknown'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              {att.source_type !== 'local' && att.external_url ? (
                <a
                  href={att.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-app-muted hover:text-app-fg hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                  title="Open file"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <button
                  onClick={(e) => handleOpenAttachment(att, e)}
                  className="p-1.5 text-app-muted hover:text-app-fg hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                  title="Open file"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => onDelete(att.id)}
                  className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
                  title="Remove attachment"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

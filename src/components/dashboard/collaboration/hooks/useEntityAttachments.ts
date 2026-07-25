import { useState, useEffect, useCallback } from 'react'
import { getAttachments, addAttachment, deleteAttachment, Attachment, AttachmentSourceType } from '@/lib/collaboration/attachment-actions'
import { type ActivityEntityType } from '@/lib/projects/activity-actions'

export function useEntityAttachments(projectId: string | undefined, entityType: ActivityEntityType, entityId: string | undefined) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)

  const fetchAttachments = useCallback(async () => {
    if (!projectId || !entityId) {
      setIsLoading(false)
      return
    }
    
    setIsLoading(true)
    try {
      const data = await getAttachments(projectId, entityType, entityId)
      setAttachments(data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [projectId, entityType, entityId])

  useEffect(() => {
    fetchAttachments()
  }, [fetchAttachments])

  const handleAddAttachment = async (
    fileName: string,
    sourceType: AttachmentSourceType,
    externalRef?: string,
    externalUrl?: string,
    mimeType?: string,
    filePath?: string,
    fileSize?: number
  ) => {
    if (!projectId || !entityId) return
    
    setIsAdding(true)
    try {
      const result = await addAttachment(projectId, entityType, entityId, {
        file_name: fileName,
        source_type: sourceType,
        external_reference: externalRef,
        external_url: externalUrl,
        mime_type: mimeType,
        file_path: filePath,
        file_size: fileSize
      })

      if (result.ok && result.data) {
        setAttachments(prev => [result.data!, ...prev])
      } else {
        alert('Failed to attach file: ' + result.error)
      }
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!projectId) return
    
    const confirmDelete = window.confirm('Are you sure you want to remove this attachment?')
    if (!confirmDelete) return

    setAttachments(prev => prev.filter(a => a.id !== attachmentId))
    
    const result = await deleteAttachment(projectId, attachmentId)
    if (!result.ok) {
      alert('Failed to delete attachment: ' + result.error)
      // Revert optimistic delete
      fetchAttachments()
    }
  }

  return {
    attachments,
    isLoading,
    isAdding,
    handleAddAttachment,
    handleDeleteAttachment,
    refreshAttachments: fetchAttachments
  }
}

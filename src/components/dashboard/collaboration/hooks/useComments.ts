import { useState, useEffect, useCallback } from 'react'
import { getComments, postComment, updateComment, deleteComment, type Comment } from '@/lib/collaboration/actions'

export function useComments(projectId: string, entityType: 'activity' | 'document' | 'risk' | 'issue', entityId: string) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchComments = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getComments(projectId, entityType, entityId)
      setComments(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch comments')
    } finally {
      setIsLoading(false)
    }
  }, [projectId, entityType, entityId])

  useEffect(() => {
    if (projectId && entityId) {
      fetchComments()
    }
  }, [fetchComments, projectId, entityId])

  const handlePostComment = async (body: string, mentions: { stakeholderId?: string, userId?: string }[], parentId?: string) => {
    const res = await postComment(projectId, entityType, entityId, body, mentions, parentId)
    if (res.success && res.comment) {
      // Optimistically fetch comments to get full relationships (author, etc.)
      fetchComments()
      return { success: true }
    }
    return { success: false, error: res.error }
  }

  const handleUpdateComment = async (commentId: string, body: string, mentions: any[]) => {
    const res = await updateComment(commentId, body, mentions)
    if (res.success) {
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, body, edited_at: new Date().toISOString() } : c))
      return { success: true }
    }
    return { success: false, error: res.error }
  }

  const handleDeleteComment = async (commentId: string) => {
    const res = await deleteComment(commentId)
    if (res.success) {
      setComments(prev => prev.filter(c => c.id !== commentId))
      return { success: true }
    }
    return { success: false, error: res.error }
  }

  return {
    comments,
    isLoading,
    error,
    fetchComments,
    postComment: handlePostComment,
    updateComment: handleUpdateComment,
    deleteComment: handleDeleteComment
  }
}
